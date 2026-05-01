// MultiplayerGame.js - Multiplayer racing game with real players and weekly points
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
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [results, setResults] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [raceFinished, setRaceFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [correctChars, setCorrectChars] = useState(0);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const activityIntervalRef = useRef(null);

  // Update lastActive periodically while user is playing
  useEffect(() => {
    if (!user) return;

    const updateLastActive = async () => {
      try {
        const statusRef = ref(database, `status/${user.uid}`);
        await update(statusRef, {
          lastOnline: Date.now(),
          isOnline: true,
        });
      } catch (error) {
        console.log("Error updating lastActive:", error);
      }
    };

    // Update immediately
    updateLastActive();

    // Update every 2 minutes while on game page
    activityIntervalRef.current = setInterval(updateLastActive, 2 * 60 * 1000);

    // Update on user activity (typing)
    const handleActivity = () => {
      updateLastActive();
    };

    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [user]);

  // COMPLETE 24 levels with progressive difficulty paragraphs (FULL VERSION - matching solo game)
  const levelData = {
    1: {
      text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. The five boxing wizards jump quickly.",
      timeLimit: 60,
    },
    2: {
      text: "A journey of a thousand miles begins with a single step. Slow and steady wins the race. Practice makes perfect every single day.",
      timeLimit: 90,
    },
    3: {
      text: "An apple a day keeps the doctor away. Early to bed and early to rise makes a man healthy, wealthy, and wise. A penny for your thoughts.",
      timeLimit: 120,
    },
    4: {
      text: "The sun rises in the east and sets in the west. The moon orbits around the Earth. Stars twinkle in the night sky above us all.",
      timeLimit: 150,
    },
    5: {
      text: "Cats have nine lives, or so the old saying goes. Dogs are called man's best friend for good reason. Fish live in water and breathe through gills.",
      timeLimit: 180,
    },
    6: {
      text: "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs that was over three thousand years old. It remains the only food that lasts forever.",
      timeLimit: 198,
    },
    7: {
      text: "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills while the third pumps it to the rest of the body. They are remarkably intelligent creatures.",
      timeLimit: 216,
    },
    8: {
      text: "Bananas are technically berries, while strawberries are not. Botanically speaking, a berry has seeds inside rather than outside. This surprises many people when they first learn it.",
      timeLimit: 234,
    },
    9: {
      text: "A day on Venus is longer than its year. Venus takes two hundred forty-three Earth days to rotate once but only two hundred twenty-five days to orbit the sun. Time works differently there.",
      timeLimit: 252,
    },
    10: {
      text: "Wombat poop is cube-shaped. This unique shape prevents it from rolling away, marking territory more effectively. Nature finds the most fascinating solutions to problems.",
      timeLimit: 270,
    },
    11: {
      text: "The human nose can remember over fifty thousand different scents. Dogs have noses even more powerful, with up to three hundred million scent receptors compared to our mere six million.",
      timeLimit: 288,
    },
    12: {
      text: "Lightning strikes the Earth about one hundred times every second. That's eight million times per day. Each bolt reaches temperatures hotter than the surface of the sun.",
      timeLimit: 306,
    },
    13: {
      text: "Trees communicate with each other through underground fungal networks. They share nutrients and send warnings about pests and diseases. Scientists call this network the Wood Wide Web.",
      timeLimit: 324,
    },
    14: {
      text: "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. Astronauts can see it only with magnification, just like many other human structures.",
      timeLimit: 342,
    },
    15: {
      text: "The shortest war in history lasted only thirty-eight minutes. It occurred between Britain and Zanzibar in 1896. The Zanzibar forces surrendered after a brief bombardment.",
      timeLimit: 360,
    },
    16: {
      text: "Cleopatra lived closer in time to the invention of the iPhone than to the construction of the pyramids. The Great Pyramid was built around 2560 BCE, while Cleopatra lived around 30 BCE.",
      timeLimit: 378,
    },
    17: {
      text: "The concept of quantum entanglement suggests that particles can remain connected across vast distances. When one particle changes, its entangled partner changes instantly regardless of separation.",
      timeLimit: 396,
    },
    18: {
      text: "Black holes are regions where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle.",
      timeLimit: 414,
    },
    19: {
      text: "DNA contains the instructions for building and maintaining living organisms. This molecule stores information in a code made of four chemical bases that pair together in specific combinations.",
      timeLimit: 432,
    },
    20: {
      text: "Plate tectonics explains how Earth's outer shell is divided into plates that glide over the mantle. These plates move about as fast as fingernails grow, yet their collisions build mountains.",
      timeLimit: 450,
    },
    21: {
      text: "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith slipped quickly through the glass doors of Victory Mansions. - George Orwell, Nineteen Eighty-Four",
      timeLimit: 468,
    },
    22: {
      text: "It was a pleasure to burn. It was a special pleasure to see things eaten, to see things blackened and changed. Fire was bright, and fire was clean. - Ray Bradbury, Fahrenheit 451",
      timeLimit: 486,
    },
    23: {
      text: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole: it was a hobbit-hole, and that means comfort. - J.R.R. Tolkien, The Hobbit",
      timeLimit: 504,
    },
    24: {
      text: "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden. - J.M. Barrie, Peter Pan",
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

    if (room.status === "playing") {
      console.log("🏁 Race starting! Navigating to game...");
      navigate(`/multiplayer/game/${roomId}`);
    }
  }, [room?.status, roomId, navigate]);

  // Start countdown only once for ALL players
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

  // FIXED: Timer logic - proper countdown
  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && isActive) {
      // Time's up - player gets DNF (0 points)
      finishGame(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, timer]);

  // Calculate WPM and accuracy in real-time
  useEffect(() => {
    if (!isActive || !targetText || inputText.length === 0) {
      if (inputText.length === 0 && isActive) setAccuracy(100);
      return;
    }

    let correct = 0;
    for (let i = 0; i < inputText.length; i++) {
      if (i < targetText.length && inputText[i] === targetText[i]) correct++;
    }

    setCorrectChars(correct);
    const newAccuracy = Math.floor((correct / inputText.length) * 100);
    setAccuracy(newAccuracy);

    const elapsedSeconds = (levelData[room?.level]?.timeLimit || 60) - timer;
    const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.0167;
    const words = inputText.length / 5;
    const currentWpm = minutes > 0 ? Math.floor(words / minutes) : 0;
    setWpm(currentWpm);

    // Update progress in Firebase
    const progress = (inputText.length / targetText.length) * 100;
    const playerRef = ref(
      database,
      `multiplayer/rooms/${roomId}/playersData/${user.uid}`,
    );
    update(playerRef, {
      progress: progress,
      wpm: currentWpm,
      accuracy: newAccuracy,
      inputLength: inputText.length,
    });
  }, [inputText, isActive, targetText, timer, room, roomId, user.uid]);

  // Check if player finished by completing the paragraph
  useEffect(() => {
    if (!isActive || !targetText) return;
    if (inputText.length >= targetText.length) {
      finishGame(false);
    }
  }, [inputText, targetText, isActive]);

  // Check if ALL players finished (to show results)
  useEffect(() => {
    if (!players.length || !room) return;

    const allFinished = players.every((p) => p.finished === true);
    if (allFinished && players.length > 0 && !raceFinished) {
      calculateResults();
      setRaceFinished(true);
      setIsActive(false);
    }
  }, [players, raceFinished]);

  // Increment gamesPlayed function
  const incrementGamesPlayed = async () => {
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const currentGames = userSnapshot.val()?.gamesPlayed || 0;
      await update(userRef, {
        gamesPlayed: currentGames + 1,
      });
    } catch (error) {
      console.error("Error incrementing gamesPlayed:", error);
    }
  };

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
          setWpm(0);
          setAccuracy(100);
          setCorrectChars(0);
          if (inputRef.current) inputRef.current.focus();
        }, 800);
      }
    }, 1000);
  };

  // Finish game function (called when player finishes or times out)
  const finishGame = async (isTimeout = false) => {
    setIsActive(false);
    setIsFinished(true);
    clearTimeout(timerRef.current);

    const elapsedSeconds = (levelData[room?.level]?.timeLimit || 60) - timer;
    const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.0167;

    // If timeout, finalWpm and finalAccuracy are 0
    const finalWpm =
      !isTimeout && inputText.length > 0
        ? Math.floor(inputText.length / 5 / minutes)
        : 0;

    let finalAccuracy = 0;
    if (!isTimeout && inputText.length > 0) {
      let correct = 0;
      for (let i = 0; i < inputText.length; i++) {
        if (i < targetText.length && inputText[i] === targetText[i]) correct++;
      }
      finalAccuracy = Math.floor((correct / inputText.length) * 100);
    }

    const playerRef = ref(
      database,
      `multiplayer/rooms/${roomId}/playersData/${user.uid}`,
    );
    await update(playerRef, {
      finished: true,
      finalWpm: finalWpm,
      finalAccuracy: finalAccuracy,
      finishTime: isTimeout ? null : Date.now(),
      isTimeout: isTimeout,
    });
  };

  // FIXED: Calculate results when all players finish - ONLY finishers get points
  const calculateResults = async () => {
    // Separate finishers and non-finishers
    const finishers = players.filter(
      (p) => p.finished && !p.isTimeout && p.finishTime,
    );
    const nonFinishers = players.filter((p) => !p.finished || p.isTimeout);

    // Sort finishers by finish time (fastest first)
    finishers.sort((a, b) => a.finishTime - b.finishTime);

    // Combine: finishers first (ranked), then non-finishers (unranked)
    const rankedPlayers = [...finishers, ...nonFinishers];

    const level = room?.level || 1;
    const points = getPointsForLevel(level);

    const results = rankedPlayers.map((player, index) => {
      let pointsEarned = 0;
      let rank = null;
      let finishTimeFormatted = "DNF";

      // ONLY award points to finishers (players who completed the race on time)
      if (player.finished && !player.isTimeout && player.finishTime) {
        rank = finishers.findIndex((f) => f.id === player.id) + 1;

        // Award points based on rank among finishers only
        if (rank === 1) pointsEarned = points.first;
        else if (rank === 2) pointsEarned = points.second;
        else if (rank === 3) pointsEarned = points.third;
        else if (rank === 4) pointsEarned = points.fourth;

        // Calculate finish time
        const startTime = Date.now() - timer * 1000;
        const timeTaken = (player.finishTime - startTime) / 1000;
        finishTimeFormatted = formatTime(Math.max(0, timeTaken));
      } else if (player.isTimeout) {
        finishTimeFormatted = "TIMEOUT";
      } else {
        finishTimeFormatted = "DNF";
      }

      return {
        ...player,
        rank: rank || finishers.length + index + 1,
        points: pointsEarned,
        finalWpm: player.finalWpm || player.wpm || 0,
        finalAccuracy: player.finalAccuracy || player.accuracy || 0,
        finishTimeFormatted,
      };
    });

    setResults(results);

    // Increment gamesPlayed for current user
    await incrementGamesPlayed();

    // Award weekly points and update scores for finishers only
    for (const player of results) {
      if (player.id === user.uid && player.points > 0) {
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
      updates[
        `multiplayer/rooms/${roomId}/playersData/${player.id}/isTimeout`
      ] = null;
    });
    await update(ref(database), updates);

    setInputText("");
    setIsFinished(false);
    setRaceFinished(false);
    setGameStarted(false);
    setResults(null);
    setIsActive(false);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
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
      1: "car5",
      2: "car8",
      3: "car9",
      4: "car10",
    };
    return carMap[position] || "car5";
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

  const racingPlayers = players.map((player) => {
    const carForPosition = getCarForPosition(player.position);
    console.log(
      `Player ${player.position} (${player.name}) gets car: ${carForPosition}`,
    );
    return {
      id: player.id,
      name: player.id === user.uid ? "YOU" : player.name,
      progress: player.progress || 0,
      carType: carForPosition,
      carImage: `/src/assets/cars/${carForPosition}.png`,
      color: getCarColor(player.position),
      boost: (player.wpm || 0) > 40 && (player.accuracy || 0) > 95,
      position: player.position,
    };
  });

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
              <span className="stat-value">{wpm}</span>
            </div>
            <div className="stat">
              <span className="stat-label">ACC</span>
              <span className="stat-value">{accuracy}%</span>
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
            wpm={wpm}
            accuracy={accuracy}
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
                    ? player.isTimeout
                      ? "⏰ TIMEOUT"
                      : "✓ FINISHED"
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
                <span className="result-rank">
                  {player.rank ? `#${player.rank}` : "-"}
                </span>
                <span className="result-name">
                  {player.id === user.uid ? "YOU" : player.name}
                </span>
                <span className="result-wpm">{player.finalWpm} WPM</span>
                <span className="result-acc">{player.finalAccuracy}%</span>
                <span className="result-time">
                  {player.finishTimeFormatted}
                </span>
                <span className="result-points">
                  {player.points > 0 ? `+${player.points}` : "0"}
                </span>
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
