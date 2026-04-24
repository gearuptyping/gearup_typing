// MultiplayerGame.js - Multiplayer racing game with real players and weekly points (24 levels, NO badges)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, onValue, update, get } from "firebase/database";
import RacingEnvironment from "../components/RacingEnvironment";
import {
  calculateMultiplayerPoints,
  addWeeklyPoints,
} from "../services/leaderboardService";
import "./MultiplayerGame.css";

const MultiplayerGame = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetText, setTargetText] = useState("");
  const [inputText, setInputText] = useState("");
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [results, setResults] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [raceFinished, setRaceFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // 24 levels with progressive difficulty paragraphs (matching solo game)
  const levelData = {
    1: {
      text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
      timeLimit: 60,
    },
    2: {
      text: "A journey of a thousand miles begins with a single step. Slow and steady wins the race.",
      timeLimit: 90,
    },
    3: {
      text: "An apple a day keeps the doctor away. Early to bed and early to rise makes a man healthy.",
      timeLimit: 120,
    },
    4: {
      text: "The sun rises in the east and sets in the west. The moon orbits around the Earth.",
      timeLimit: 150,
    },
    5: {
      text: "Cats have nine lives, or so the old saying goes. Dogs are called man's best friend.",
      timeLimit: 180,
    },
    6: {
      text: "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs.",
      timeLimit: 198,
    },
    7: {
      text: "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills.",
      timeLimit: 216,
    },
    8: {
      text: "Bananas are technically berries, while strawberries are not. A berry has seeds inside.",
      timeLimit: 234,
    },
    9: {
      text: "A day on Venus is longer than its year. Venus takes 243 Earth days to rotate once.",
      timeLimit: 252,
    },
    10: {
      text: "Wombat poop is cube-shaped. This unique shape prevents it from rolling away.",
      timeLimit: 270,
    },
    11: {
      text: "The human nose can remember over fifty thousand different scents.",
      timeLimit: 288,
    },
    12: {
      text: "Lightning strikes the Earth about one hundred times every second.",
      timeLimit: 306,
    },
    13: {
      text: "Trees communicate through underground fungal networks called the Wood Wide Web.",
      timeLimit: 324,
    },
    14: {
      text: "The Great Wall of China is not visible from space with the naked eye.",
      timeLimit: 342,
    },
    15: {
      text: "The shortest war in history lasted only thirty-eight minutes in 1896.",
      timeLimit: 360,
    },
    16: {
      text: "Cleopatra lived closer in time to the iPhone than to the pyramids.",
      timeLimit: 378,
    },
    17: {
      text: "Quantum entanglement connects particles across vast distances instantly.",
      timeLimit: 396,
    },
    18: {
      text: "Black holes have gravity so strong that not even light can escape.",
      timeLimit: 414,
    },
    19: {
      text: "DNA stores information in a code made of four chemical bases.",
      timeLimit: 432,
    },
    20: {
      text: "Plate tectonics explains how continents drift across the planet.",
      timeLimit: 450,
    },
    21: {
      text: "It was a bright cold day in April, and the clocks were striking thirteen. - George Orwell",
      timeLimit: 468,
    },
    22: {
      text: "It was a pleasure to burn. Fire was bright, and fire was clean. - Ray Bradbury",
      timeLimit: 486,
    },
    23: {
      text: "In a hole in the ground there lived a hobbit. - J.R.R. Tolkien",
      timeLimit: 504,
    },
    24: {
      text: "All children, except one, grow up. - J.M. Barrie",
      timeLimit: 522,
    },
  };

  // Fetch user's display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;
      try {
        const userRef = ref(database, `users/${user.uid}/displayName`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setDisplayName(snapshot.val());
        } else {
          setDisplayName(user.email?.split("@")[0] || "Player");
        }
      } catch (error) {
        console.error("Error fetching display name:", error);
        setDisplayName(user.email?.split("@")[0] || "Player");
      }
    };
    fetchDisplayName();
  }, [user]);

  // Load room data from Firebase
  useEffect(() => {
    const roomRef = ref(database, `multiplayer/rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        console.log("📢 Room data received:", {
          status: roomData.status,
          players: roomData.players,
        });
        setRoom(roomData);

        const playersArray = Object.entries(roomData.playersData || {})
          .map(([id, data]) => ({
            id,
            ...data,
            progress: data.progress || 0,
            wpm: data.wpm || 0,
            accuracy: data.accuracy || 100,
            finished: data.finished || false,
            finishTime: data.finishTime || null,
            finalWpm: data.finalWpm || 0,
            finalAccuracy: data.finalAccuracy || 0,
            position: data.position || 1,
          }))
          .sort((a, b) => a.position - b.position);

        setPlayers(playersArray);

        const level = roomData.level;
        if (levelData[level]) {
          setTargetText(levelData[level].text);
          setTimer(levelData[level].timeLimit);
        }

        setLoading(false);
      } else {
        navigate("/multiplayer");
      }
    });
    return () => unsubscribe();
  }, [roomId, navigate]);

  // Auto-navigate to game when room status becomes "playing"
  useEffect(() => {
    if (!room) return;
    console.log("📢 Checking room status:", room.status);

    // If room status becomes "playing", navigate ALL players to game
    if (room.status === "playing") {
      console.log("🏁 Race starting! Navigating to game...");
      navigate(`/multiplayer/game/${roomId}`);
    }
  }, [room?.status, roomId, navigate]);

  // Auto-navigate back to room if status is not playing (for safety)
  useEffect(() => {
    if (!room) return;
    if (room.status !== "playing" && !loading) {
      console.log("📢 Room not playing, returning to room...");
      navigate(`/multiplayer/room/${roomId}`);
    }
  }, [room?.status, roomId, navigate, loading]);

  // Start countdown only once - FIXED to work for ALL players
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (raceFinished) return;
    if (gameStarted) return;
    if (showCountdown) return;
    if (isActive) return;

    if (players.length > 0) {
      console.log("🎬 Starting countdown for all players...");
      startCountdown();
      setGameStarted(true);
    }
  }, [room, players, raceFinished, gameStarted, showCountdown, isActive]);

  // Focus input when game starts
  useEffect(() => {
    if (isActive && inputRef.current) inputRef.current.focus();
  }, [isActive]);

  // Timer logic
  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isActive) {
      finishGame();
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, timer]);

  // Update YOUR progress in Firebase (real-time)
  useEffect(() => {
    if (!isActive || !roomId || !user) return;

    const progress = (inputText.length / targetText.length) * 100;
    const elapsedSeconds = (levelData[room?.level]?.timeLimit || 60) - timer;
    const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.0167;
    const words = inputText.length / 5;
    const currentWpm = minutes > 0 ? Math.floor(words / minutes) : 0;

    let correct = 0;
    for (let i = 0; i < inputText.length; i++) {
      if (i < targetText.length && inputText[i] === targetText[i]) correct++;
    }
    const currentAccuracy =
      inputText.length > 0
        ? Math.floor((correct / inputText.length) * 100)
        : 100;

    const playerRef = ref(
      database,
      `multiplayer/rooms/${roomId}/playersData/${user.uid}`,
    );
    update(playerRef, {
      progress: progress,
      wpm: currentWpm,
      accuracy: currentAccuracy,
      inputLength: inputText.length,
    });
  }, [inputText, isActive, roomId, user, targetText, timer, room]);

  // Check if YOU finished
  useEffect(() => {
    if (!isActive || !targetText) return;
    if (inputText.length >= targetText.length) {
      finishGame();
    }
  }, [inputText, targetText, isActive]);

  // Check if ALL players finished (to show results)
  useEffect(() => {
    if (!players.length || !room) return;

    const allFinished = players.every((p) => p.finished);
    if (allFinished && players.length > 0 && !raceFinished) {
      calculateResults();
      setRaceFinished(true);
      setIsActive(false);
    }
  }, [players, raceFinished]);

  // Start countdown function
  const startCountdown = () => {
    setShowCountdown(true);
    setCountdown(3);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count >= 1) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown("GO");
        clearInterval(countdownRef.current);
        setTimeout(() => {
          setShowCountdown(false);
          setIsActive(true);
          setInputText("");
          if (inputRef.current) inputRef.current.focus();
        }, 800);
      }
    }, 1000);
  };

  // Finish game function (called when you finish)
  const finishGame = async () => {
    setIsActive(false);
    setIsFinished(true);
    clearTimeout(timerRef.current);

    const elapsedSeconds = (levelData[room?.level]?.timeLimit || 60) - timer;
    const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.0167;
    const finalWpm =
      inputText.length > 0 ? Math.floor(inputText.length / 5 / minutes) : 0;

    let correct = 0;
    for (let i = 0; i < inputText.length; i++) {
      if (i < targetText.length && inputText[i] === targetText[i]) correct++;
    }
    const finalAccuracy =
      inputText.length > 0 ? Math.floor((correct / inputText.length) * 100) : 0;

    const playerRef = ref(
      database,
      `multiplayer/rooms/${roomId}/playersData/${user.uid}`,
    );
    await update(playerRef, {
      finished: true,
      finalWpm: finalWpm,
      finalAccuracy: finalAccuracy,
      finishTime: Date.now(),
    });
  };

  // Calculate results when all players finish
  const calculateResults = async () => {
    const finishedPlayers = [...players].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finishTime && b.finishTime) {
        return a.finishTime - b.finishTime;
      }
      return b.progress - a.progress;
    });

    const level = room?.level || 1;
    const points = getPointsForLevel(level);

    const results = finishedPlayers.map((player, index) => {
      let pointsEarned = 0;
      if (index === 0) pointsEarned = points.first;
      else if (index === 1) pointsEarned = points.second;
      else if (index === 2) pointsEarned = points.third;
      else if (index === 3) pointsEarned = points.fourth;

      let finishTimeFormatted = "DNF";
      if (player.finishTime) {
        const startTime = Date.now() - timer * 1000;
        const timeTaken = (player.finishTime - startTime) / 1000;
        finishTimeFormatted = formatTime(Math.max(0, timeTaken));
      }

      return {
        ...player,
        rank: index + 1,
        points: pointsEarned,
        finalWpm: player.finalWpm || player.wpm || 0,
        finalAccuracy: player.finalAccuracy || player.accuracy || 0,
        finishTimeFormatted,
      };
    });

    setResults(results);

    for (const player of results) {
      if (player.id === user.uid) {
        const userScoreRef = ref(database, `users/${user.uid}/score`);
        const snapshot = await get(userScoreRef);
        const currentScore = snapshot.val() || 0;
        await update(ref(database, `users/${user.uid}`), {
          score: currentScore + player.points,
        });

        const weeklyPoints = calculateMultiplayerPoints(
          player.rank,
          level,
          players.length,
        );
        await addWeeklyPoints(user.uid, weeklyPoints);
        console.log(
          `📅 Added ${weeklyPoints} weekly points for rank #${player.rank} in multiplayer!`,
        );
      }
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Race Again function
  const raceAgain = async () => {
    const updates = {};
    players.forEach((player) => {
      updates[`multiplayer/rooms/${roomId}/playersData/${player.id}/progress`] =
        0;
      updates[`multiplayer/rooms/${roomId}/playersData/${player.id}/wpm`] = 0;
      updates[`multiplayer/rooms/${roomId}/playersData/${player.id}/accuracy`] =
        100;
      updates[`multiplayer/rooms/${roomId}/playersData/${player.id}/finished`] =
        false;
      updates[
        `multiplayer/rooms/${roomId}/playersData/${player.id}/finishTime`
      ] = null;
      updates[`multiplayer/rooms/${roomId}/playersData/${player.id}/finalWpm`] =
        null;
      updates[
        `multiplayer/rooms/${roomId}/playersData/${player.id}/finalAccuracy`
      ] = null;
    });
    await update(ref(database), updates);

    setInputText("");
    setIsFinished(false);
    setRaceFinished(false);
    setGameStarted(false);
    setResults(null);
    setIsActive(false);
    setTimer(levelData[room?.level]?.timeLimit || 60);
  };

  // Return to room (waiting room)
  const returnToRoom = () => {
    navigate(`/multiplayer/room/${roomId}`);
  };

  // Return to lobby
  const returnToLobby = () => {
    navigate("/multiplayer");
  };

  // Get points based on level (updated for 24 levels)
  const getPointsForLevel = (level) => {
    if (level <= 6) return { first: 20, second: 15, third: 12, fourth: 8 };
    if (level <= 12) return { first: 40, second: 30, third: 22, fourth: 15 };
    if (level <= 18) return { first: 60, second: 45, third: 32, fourth: 22 };
    return { first: 100, second: 75, third: 52, fourth: 38 };
  };

  // Handle input change
  const handleInputChange = (e) => {
    if (!isActive || isFinished) return;
    setInputText(e.target.value);
  };

  // Get car color based on position - Grayscale
  const getCarColor = (position) => {
    switch (position) {
      case 1:
        return "#FFFFFF";
      case 2:
        return "#CCCCCC";
      case 3:
        return "#999999";
      case 4:
        return "#666666";
      default:
        return "#FFFFFF";
    }
  };

  // Get car based on player position (using cars 5,8,9,10)
  const getCarForPosition = (position) => {
    const carMap = {
      1: "car-5",
      2: "car-8",
      3: "car-9",
      4: "car-10",
    };
    return carMap[position] || "car-5";
  };

  // Get car icon based on position
  const getCarIconForPosition = (position) => {
    const iconMap = {
      1: "🚗",
      2: "🏎️",
      3: "🏁",
      4: "⚡",
    };
    return iconMap[position] || "🚗";
  };

  // Render target text with colored characters
  const renderTargetText = () => {
    if (!targetText) return null;
    return targetText.split("").map((char, index) => {
      let className = "target-char";
      if (char === " ") className += " space";
      if (index < inputText.length) {
        className += inputText[index] === char ? " correct" : " incorrect";
      } else if (index === inputText.length && isActive) {
        className += " current";
      }
      return (
        <span key={index} className={className}>
          {char === " " ? "␣" : char}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div className="multiplayer-loading">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  const progress = (inputText.length / targetText.length) * 100;
  const currentPlayer = players.find((p) => p.id === user.uid);

  const racingPlayers = players.map((player) => ({
    id: player.id,
    name: player.id === user.uid ? "YOU" : player.name,
    progress: player.progress || 0,
    carType: getCarForPosition(player.position),
    carImage: `/src/assets/cars/${getCarForPosition(player.position)}.png`,
    color: getCarColor(player.position),
    boost: player.wpm > 40 && player.accuracy > 95,
    position: player.position,
  }));

  return (
    <div className="multiplayer-game-container">
      <div className="game-box">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="level-display">
            <span className="car-icon">
              {getCarIconForPosition(currentPlayer?.position || 1)}
            </span>
            LEVEL {room?.level}
          </div>
          <div className="stats-display">
            <div className="stat">
              <span className="stat-label">WPM</span>
              <span className="stat-value">{currentPlayer?.wpm || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">ACC</span>
              <span className="stat-value">
                {currentPlayer?.accuracy || 100}%
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">TIME</span>
              <span className="stat-value">{formatTime(timer)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">PROG</span>
              <span className="stat-value">{Math.floor(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Racing Environment */}
        <div className="racing-container" style={{ height: "450px" }}>
          <RacingEnvironment
            players={racingPlayers}
            wpm={currentPlayer?.wpm || 0}
            accuracy={currentPlayer?.accuracy || 100}
            isRacing={isActive}
            showCountdown={showCountdown}
            countdown={countdown}
            level={room?.level}
            isMultiplayer={true}
          />
        </div>

        {/* Typing Section */}
        <div className="typing-section">
          <div className="target-text">{renderTargetText()}</div>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            disabled={isFinished || showCountdown}
            placeholder={
              showCountdown
                ? "Get ready..."
                : isActive
                  ? "Start typing..."
                  : "Waiting for race to start..."
            }
            className="typing-input"
          />
        </div>

        {/* Bottom Bar */}
        <div className="player-bar">
          {players.map((player) => {
            const playerCarIcon = getCarIconForPosition(player.position);
            return (
              <div
                key={player.id}
                className="player-info"
                style={{ borderColor: getCarColor(player.position) }}
              >
                <span className="player-car-icon">{playerCarIcon}</span>
                <span
                  className="player-name"
                  style={{ color: getCarColor(player.position) }}
                >
                  {player.id === user.uid ? "YOU" : player.name}
                </span>
                <span className="player-stats">
                  {player.finished
                    ? "✓ FINISHED"
                    : `${Math.floor(player.progress || 0)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Modal */}
      {results && (
        <div className="results-modal">
          <h2>🏁 RACE RESULTS 🏁</h2>
          <div className="results-list">
            {results.map((player) => (
              <div
                key={player.id}
                className="result-item"
                style={{ borderColor: getCarColor(player.position) }}
              >
                <span className="result-rank">#{player.rank}</span>
                <span className="result-name">
                  {player.id === user.uid ? "YOU" : player.name}
                </span>
                <span className="result-wpm">{player.finalWpm} WPM</span>
                <span className="result-acc">{player.finalAccuracy}%</span>
                <span className="result-time">
                  {player.finishTimeFormatted}
                </span>
                <span className="result-points">+{player.points}</span>
              </div>
            ))}
          </div>
          <div className="results-actions">
            <button onClick={raceAgain} className="race-again-btn">
              RACE AGAIN
            </button>
            <button onClick={returnToRoom} className="room-btn">
              BACK TO ROOM
            </button>
            <button onClick={returnToLobby} className="lobby-btn">
              BACK TO LOBBY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;
