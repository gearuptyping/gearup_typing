// Game.js - Solo game page (24 levels, 7 cars, NO badges)
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, get, update } from "firebase/database";
import RacingEnvironment from "../components/RacingEnvironment";
import {
  getRegularCarForLevel,
  checkAndUnlockCar,
} from "../services/carService";
import {
  calculateSoloPoints,
  addWeeklyPoints,
} from "../services/leaderboardService";
import "./Game.css";

const Game = ({ user }) => {
  const { levelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const level = location.state?.level;

  // State Variables
  const [inputText, setInputText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [correctChars, setCorrectChars] = useState(0);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [resultType, setResultType] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [newCarUnlocked, setNewCarUnlocked] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const activityIntervalRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);

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

  // 24 levels with progressive paragraphs
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

  const currentLevel = level || levelData[levelId];
  const levelGradient = "linear-gradient(145deg, #14141e 0%, #1e2943 100%)";

  // Initialize players with car based on level
  useEffect(() => {
    const playerName = displayName || user?.email?.split("@")[0] || "Player";
    const playerCar = getRegularCarForLevel(levelId);
    setPlayers([
      {
        id: 1,
        name: playerName,
        carType: playerCar.id,
        displayCarName: playerCar.displayName,
        progress: 0,
        boost: false,
        color: "#ffffff",
      },
    ]);
  }, [user, displayName, levelId]);

  // Audio Functions
  const initAudio = () => {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  };

  const playBeep = (frequency = 800, duration = 0.1) => {
    try {
      const ctx = audioContext || initAudio();
      if (ctx.state === "suspended") ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const playHorn = () => {
    try {
      const ctx = audioContext || initAudio();
      if (ctx.state === "suspended") ctx.resume();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.frequency.value = 440;
      osc2.frequency.value = 554;
      gainNode.gain.value = 0.4;
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const playCrowdCheer = () => {
    try {
      const ctx = audioContext || initAudio();
      if (ctx.state === "suspended") ctx.resume();
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.frequency.value = 400 + Math.random() * 300;
          gainNode.gain.value = 0.05;
          osc.start();
          osc.stop(ctx.currentTime + 0.1 + Math.random() * 0.2);
        }, i * 60);
      }
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // Load level data
  useEffect(() => {
    setIsLoading(true);
    if (!levelId || !levelData[levelId]) {
      navigate("/levels");
      return;
    }
    if (currentLevel) {
      setTargetText(currentLevel.text);
      setTimer(currentLevel.timeLimit);
    }
    setIsLoading(false);
  }, [currentLevel, levelId, navigate]);

  // Focus input after countdown
  useEffect(() => {
    if (isActive && inputRef.current) inputRef.current.focus();
  }, [isActive]);

  // Timer logic
  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isActive) {
      endGame();
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, timer]);

  // Calculate WPM and accuracy
  useEffect(() => {
    if (!targetText || targetText.length === 0) return;
    if (!isActive || inputText.length === 0) {
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

    const minutes = (currentLevel?.timeLimit - timer) / 60;
    const words = inputText.length / 5;
    const currentWpm = minutes > 0 ? Math.floor(words / minutes) : 0;
    setWpm(currentWpm);

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        progress: (inputText.length / targetText.length) * 100,
        boost: currentWpm > 40 && newAccuracy > 95,
      })),
    );

    if (inputText.length >= targetText.length) endGame();
  }, [inputText, isActive, targetText, timer, currentLevel]);

  // Start countdown
  const handleKeyDown = (e) => {
    if (!isActive && !isFinished && !showCountdown && e.key.length === 1) {
      startCountdown();
    }
  };

  const startCountdown = () => {
    initAudio();
    setShowCountdown(true);
    setCountdown(3);
    playBeep(800, 0.2);

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count >= 1) {
        setCountdown(count);
        playBeep(800, 0.2);
      } else if (count === 0) {
        setCountdown("GO");
        playHorn();
        playCrowdCheer();
        clearInterval(countdownRef.current);
        setTimeout(() => {
          setShowCountdown(false);
          setIsActive(true);
          setInputText("");
          setCorrectChars(0);
          setWpm(0);
          setAccuracy(100);
          if (inputRef.current) inputRef.current.focus();
        }, 800);
      }
    }, 1000);
  };

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

  // End Game Function
  const endGame = async () => {
    setIsActive(false);
    setIsFinished(true);
    clearTimeout(timerRef.current);
    playCrowdCheer();

    const finalAccuracy =
      inputText.length > 0
        ? Math.floor((correctChars / inputText.length) * 100)
        : 0;
    const minutes = (currentLevel?.timeLimit || 60) / 60;
    const finalWpm =
      inputText.length > 0 ? Math.floor(inputText.length / 5 / minutes) : 0;

    setAccuracy(finalAccuracy);
    setWpm(finalWpm);
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, progress: 100, boost: false })),
    );

    // Determine result type
    const completedFullParagraph = inputText.length >= targetText.length;
    const finishedBeforeTimeUp = timer > 0;

    if (completedFullParagraph && finishedBeforeTimeUp && finalAccuracy > 80) {
      setResultType("victory");
    } else if (!completedFullParagraph && timer === 0) {
      setResultType("timeout");
    } else if (!completedFullParagraph) {
      setResultType("incomplete");
    } else if (completedFullParagraph && finalAccuracy <= 80) {
      setResultType("lowAccuracy");
    } else {
      setResultType("complete");
    }

    try {
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentScore = data.score || 0;
        const unlockedLevels = data.unlockedLevels || [1];

        const levelScores = data.levelScores || {};
        const levelNum = parseInt(levelId);
        const scoreEarned = Math.floor((finalWpm * finalAccuracy) / 10);
        const previousBest = levelScores[levelNum] || 0;
        const isNewHighScore = scoreEarned > previousBest;

        let additionalScore = 0;
        if (isNewHighScore) {
          additionalScore = scoreEarned - previousBest;
          levelScores[levelNum] = scoreEarned;
        }

        // Level unlock - only if all conditions met
        if (
          completedFullParagraph &&
          finishedBeforeTimeUp &&
          finalAccuracy > 80
        ) {
          if (!unlockedLevels.includes(levelNum + 1) && levelNum < 24) {
            unlockedLevels.push(levelNum + 1);

            // Check and unlock car when reaching milestone levels (3,6,9,12,15,18,21,24)
            const carUnlockResult = await checkAndUnlockCar(
              user.uid,
              levelNum + 1,
            );
            if (carUnlockResult.unlocked) {
              setNewCarUnlocked(carUnlockResult.car);
              console.log(
                `🎉 New car unlocked: ${carUnlockResult.car.displayName}`,
              );
            }
          }
        }

        const playerLevel = Math.max(...unlockedLevels);
        const updates = {
          unlockedLevels: unlockedLevels,
          level: playerLevel,
          lastPlayed: new Date().toISOString(),
        };

        if (additionalScore > 0) {
          updates.score = currentScore + additionalScore;
          updates.levelScores = levelScores;
        }

        await update(userRef, updates);

        // Increment gamesPlayed counter
        await incrementGamesPlayed();

        // Weekly points
        const weeklyPoints = calculateSoloPoints(
          finalWpm,
          finalAccuracy,
          levelNum,
        );
        await addWeeklyPoints(user.uid, weeklyPoints);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleInputChange = (e) => {
    if (!isActive || isFinished) return;
    setInputText(e.target.value);
  };

  const handleRestart = () => {
    setIsActive(false);
    setIsFinished(false);
    setInputText("");
    setTimer(currentLevel?.timeLimit || 60);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setNewCarUnlocked(null);
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, progress: 0, boost: false })),
    );
    startCountdown();
  };

  const handleNextLevel = () => {
    setNewCarUnlocked(null);
    const nextLevel = parseInt(levelId) + 1;
    if (nextLevel <= 24) {
      navigate(`/game/${nextLevel}`, {
        state: { level: levelData[nextLevel] },
      });
      setTimeout(handleRestart, 100);
    } else {
      navigate("/levels");
    }
  };

  const renderTargetText = () => {
    if (!targetText || targetText.length === 0) return null;
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

  const getResultContent = () => {
    const levelNum = parseInt(levelId);
    switch (resultType) {
      case "victory":
        if (levelNum === 24) {
          return {
            title: "🏆 CHAMPION!",
            message:
              "You've completed all 24 levels! You are a true typing master!",
          };
        }
        return { title: "🏆 VICTORY!", message: "Level Unlocked! Great job!" };
      case "lowAccuracy":
        return {
          title: "🎯 TOO MANY ERRORS",
          message: `Accuracy ${accuracy}% needs to be >80% to unlock next level.`,
        };
      case "timeout":
        return {
          title: "⏰ TIME'S UP!",
          message: "You ran out of time. Try again!",
        };
      case "incomplete":
        return {
          title: "📝 INCOMPLETE",
          message: "You didn't finish the paragraph.",
        };
      default:
        return {
          title: "LEVEL COMPLETE",
          message: "Keep practicing to improve!",
        };
    }
  };

  const shouldShowNextLevel = () => {
    const levelNum = parseInt(levelId);
    return resultType === "victory" && levelNum < 24;
  };

  if (isLoading || !currentLevel) {
    return (
      <div className="game-container">
        <div className="game-box">
          <div className="loading-spinner"></div>
          <p>Loading level...</p>
        </div>
      </div>
    );
  }

  if (!targetText || targetText.length === 0) {
    return (
      <div className="game-container">
        <div className="game-box">
          <h2>Level not found</h2>
          <button onClick={() => navigate("/levels")} className="restart-btn">
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  const progress = (inputText.length / targetText.length) * 100;
  const resultContent = getResultContent();

  return (
    <div className="game-container">
      <div className="game-box">
        <div className="top-bar">
          <div className="level-display" style={{ background: levelGradient }}>
            LEVEL {levelId}
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
              <span className="stat-value">{timer}s</span>
            </div>
            <div className="stat">
              <span className="stat-label">PROG</span>
              <span className="stat-value">{Math.floor(progress)}%</span>
            </div>
          </div>
        </div>

        <div className="racing-container">
          <RacingEnvironment
            players={players}
            wpm={wpm}
            accuracy={accuracy}
            isRacing={isActive}
            showCountdown={showCountdown}
            countdown={countdown}
            level={levelId}
          />
        </div>

        <div className="typing-section">
          <div className="target-text">{renderTargetText()}</div>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isFinished || showCountdown}
            placeholder="Press any key to start countdown..."
            className="typing-input"
          />
        </div>

        <div className="player-bar">
          {players.map((player) => (
            <div
              key={player.id}
              className="player-info"
              style={{ borderColor: "#ffffff" }}
            >
              <span className="player-name" style={{ color: "#ffffff" }}>
                {player.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isFinished && (
        <div className="results-modal">
          <h2>{resultContent.title}</h2>
          <p className="result-message">{resultContent.message}</p>

          {/* New Car Unlocked Notification */}
          {newCarUnlocked && (
            <div className="new-car-unlock">
              <span className="car-unlock-icon">🚗</span>
              <div className="car-unlock-info">
                <span className="car-unlock-title">NEW CAR UNLOCKED!</span>
                <span className="car-unlock-name">
                  {newCarUnlocked.displayName}
                </span>
              </div>
            </div>
          )}

          <div className="results-stats">
            <div className="result-box">
              <span>WPM</span>
              <span className="result-value">{wpm}</span>
            </div>
            <div className="result-box">
              <span>ACCURACY</span>
              <span className="result-value">{accuracy}%</span>
            </div>
            <div className="result-box">
              <span>SCORE</span>
              <span className="result-value">
                {Math.floor((wpm * accuracy) / 10)}
              </span>
            </div>
          </div>
          <div className="results-actions">
            <button onClick={handleRestart} className="restart-btn">
              RACE AGAIN
            </button>
            {shouldShowNextLevel() && (
              <button onClick={handleNextLevel} className="next-btn">
                NEXT LEVEL
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
