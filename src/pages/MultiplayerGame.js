// MultiplayerGame.js - Multiplayer racing game with real players, badges, and weekly points
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, onValue, update, get } from "firebase/database";
import RacingEnvironment from "../components/RacingEnvironment";
import BadgeDisplay from "../components/BadgeDisplay";
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

  // All 50 levels with progressive difficulty paragraphs
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
      text: "The human nose can remember over fifty thousand different scents. Dogs have noses even more powerful, with up to three hundred million scent receptors compared to our mere six million. Their world is built around smells we cannot perceive.",
      timeLimit: 288,
    },
    12: {
      text: "Lightning strikes the Earth about one hundred times every second. That's eight million times per day. Each bolt reaches temperatures hotter than the surface of the sun, creating the thunder we hear afterwards.",
      timeLimit: 306,
    },
    13: {
      text: "Trees communicate with each other through underground fungal networks. They share nutrients and send warnings about pests and diseases. Scientists call this network the Wood Wide Web, and it connects entire forests in ways we are only beginning to understand.",
      timeLimit: 324,
    },
    14: {
      text: "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. Astronauts can see it only with magnification, just like many other human structures. This myth has persisted for decades despite being proven false.",
      timeLimit: 342,
    },
    15: {
      text: "Butterflies taste with their feet. They have taste sensors on their legs that help them find food and suitable plants for laying eggs. This unusual adaptation ensures their caterpillars will have the right leaves to eat when they hatch.",
      timeLimit: 360,
    },
    16: {
      text: "The shortest war in history lasted only thirty-eight minutes. It occurred between Britain and Zanzibar in 1896. The Zanzibar forces surrendered after a brief bombardment, making it the most one-sided conflict ever recorded in military history books.",
      timeLimit: 378,
    },
    17: {
      text: "Cleopatra lived closer in time to the invention of the iPhone than to the construction of the pyramids. The Great Pyramid was built around 2560 BCE, while Cleopatra lived around 30 BCE. This puts nearly two thousand five hundred years between the pyramids and Egypt's most famous queen.",
      timeLimit: 396,
    },
    18: {
      text: "Octopuses can change not only their color but also their texture to blend in with surroundings. They mimic rocks, coral, and sand with incredible accuracy. This camouflage happens in less than a second, controlled directly by their complex nervous system.",
      timeLimit: 414,
    },
    19: {
      text: "The Eiffel Tower grows taller in summer. The iron structure expands in heat, adding up to six inches in height during hot days. It also leans slightly away from the sun, demonstrating how temperature affects even the most solid constructions.",
      timeLimit: 432,
    },
    20: {
      text: "Cows have best friends and become stressed when separated from them. Scientists have observed lower heart rates and reduced stress hormones when cows are with their preferred companions. This reveals the deep social bonds that exist throughout the animal kingdom.",
      timeLimit: 450,
    },
    21: {
      text: "The ancient Library of Alexandria was one of the largest and most significant libraries of the ancient world. It housed hundreds of thousands of scrolls containing knowledge from Africa, Europe, and Asia. Scholars traveled from across the known world to study there, making it a true center of learning.",
      timeLimit: 468,
    },
    22: {
      text: "Shakespeare invented over seventeen hundred words that we still use today. Among them are bedroom, lonely, generous, and majestic. His creative wordplay transformed the English language forever, giving us new ways to express thoughts that previously had no name.",
      timeLimit: 486,
    },
    23: {
      text: "The Viking explorer Leif Erikson reached North America about five hundred years before Columbus. He established a settlement in Newfoundland around the year 1000. Norse sagas tell of his voyages to a land they called Vinland, named for the wild grapes they found growing there.",
      timeLimit: 504,
    },
    24: {
      text: "Paper money was first developed in China during the Tang Dynasty around the 7th century. Marco Polo brought stories of this strange practice back to Europe, where people continued using coins for centuries longer. The concept eventually spread worldwide, transforming global commerce forever.",
      timeLimit: 522,
    },
    25: {
      text: "The ancient Olympic Games continued for over a thousand years before being abolished. They began in 776 BCE and lasted until 393 CE when a Christian emperor banned them as pagan. Athletes competed naked, and the games included events like chariot racing that we no longer see today.",
      timeLimit: 540,
    },
    26: {
      text: "The concept of quantum entanglement suggests that particles can remain connected across vast distances. When one particle changes, its entangled partner changes instantly regardless of separation. Einstein called this spooky action at a distance and never fully accepted it, though experiments have repeatedly confirmed its existence.",
      timeLimit: 558,
    },
    27: {
      text: "Black holes are regions where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle. The boundary around them called the event horizon marks the point of no return, beyond which all matter and energy are forever lost to our observable universe.",
      timeLimit: 576,
    },
    28: {
      text: "DNA contains the instructions for building and maintaining living organisms. This molecule stores information in a code made of four chemical bases that pair together in specific combinations. The complete set of human DNA contains about three billion base pairs, and if stretched out would reach from Earth to the sun and back multiple times.",
      timeLimit: 594,
    },
    29: {
      text: "Plate tectonics explains how Earth's outer shell is divided into plates that glide over the mantle. These plates move about as fast as fingernails grow, yet their collisions build mountains and trigger earthquakes. The theory revolutionized geology in the twentieth century, confirming that continents drift across the planet over millions of years.",
      timeLimit: 612,
    },
    30: {
      text: "Photosynthesis transforms sunlight into chemical energy, producing oxygen as a byproduct. Plants absorb carbon dioxide and water, converting them into glucose using chlorophyll. This process sustains nearly all life on Earth by providing food and breathable air, making it arguably the most important chemical reaction on our planet.",
      timeLimit: 630,
    },
    31: {
      text: "The ancient Greek philosopher Socrates never wrote anything himself. Everything we know about him comes from his students, particularly Plato. He taught by asking questions that made people examine their own beliefs, a method now called the Socratic technique that remains fundamental to education and philosophy today.",
      timeLimit: 648,
    },
    32: {
      text: "Time perception varies among species. Flies process visual information much faster than humans, making our movements appear slow to them. This explains why they can evade swats so effectively. Small animals generally perceive time more rapidly than larger ones, a survival adaptation that helps them react quickly to threats.",
      timeLimit: 666,
    },
    33: {
      text: "The Fibonacci sequence appears throughout nature in surprising ways. Flower petals often follow these numbers, as do pinecones and sunflower seed arrangements. This mathematical pattern creates efficient packing and optimal growth, suggesting that nature favors certain numerical relationships for practical evolutionary reasons.",
      timeLimit: 684,
    },
    34: {
      text: "Human memory is not a recording but a reconstruction. Each time we remember something, we rebuild it from fragments, often altering details. This explains why eyewitness testimony can be unreliable and why different people remember the same event differently. Our memories change subtly with each recall.",
      timeLimit: 702,
    },
    35: {
      text: "The placebo effect demonstrates the power of belief in healing. Patients given sugar pills often improve simply because they expect to. This phenomenon reveals the profound connection between mind and body, showing that our expectations can trigger real physiological changes that promote recovery and reduce pain.",
      timeLimit: 720,
    },
    36: {
      text: "The development of written language transformed human civilization. Before writing, knowledge existed only in memory and could be lost with a single generation. Writing allowed information to accumulate across centuries, enabling the complex societies, laws, and scientific discoveries that define modern life. It represents perhaps humanity's most important technological achievement.",
      timeLimit: 738,
    },
    37: {
      text: "The concept of zero originated in India around the 5th century. Earlier civilizations had placeholders but no true zero as a number. This invention revolutionized mathematics by enabling place value systems and making advanced calculations possible. Without zero, we would lack modern algebra, calculus, and computing.",
      timeLimit: 756,
    },
    38: {
      text: "Symbiosis describes relationships where different species live together intimately. Some partnerships benefit both organisms, like bees and flowers. Others benefit one without harming the other, while parasitic relationships harm the host. These complex interactions shape ecosystems and drive evolution, creating the interdependent web of life we see everywhere in nature.",
      timeLimit: 774,
    },
    39: {
      text: "The Heisenberg uncertainty principle states that we cannot simultaneously know both the position and momentum of a particle with perfect accuracy. This is not a limitation of measurement but a fundamental property of reality at quantum scales. The more precisely we measure one property, the less we can know about the other, challenging our classical understanding of the universe.",
      timeLimit: 792,
    },
    40: {
      text: "Epigenetics studies how environmental factors can change gene expression without altering DNA itself. Stress, diet, and experiences can modify which genes are activated, and some of these changes may pass to future generations. This challenges the traditional view that inheritance involves only DNA sequences, revealing a more complex picture of how traits are passed down.",
      timeLimit: 810,
    },
    41: {
      text: "The old man sat on the park bench every morning, feeding pigeons from a paper bag. Children called him the pigeon man, though he never seemed to mind. One day a little girl asked why he came alone each day. He smiled and said the pigeons were his family now, and family never asks why you visit. The girl returned the next day with her own bag of bread crumbs.",
      timeLimit: 828,
    },
    42: {
      text: "A fisherman once caught a bottle with a message inside. The note read: Throw me back, for I contain only the dreams of a child. He opened it anyway, and found it empty. Disappointed, he threw the bottle back into the sea. Years later his daughter found it on the same beach and wrote her own dreams on a tiny paper, placing them inside before casting it back to the waves.",
      timeLimit: 846,
    },
    43: {
      text: "The librarian noticed a book that never got checked out. Its title was The Secret Life of Librarians. Curious, she opened it to find blank pages except one that read: Every story needs a reader to come alive. She placed it on display, and by week's end, every page was filled with handwritten stories from townspeople who finally felt seen.",
      timeLimit: 864,
    },
    44: {
      text: "Two seeds landed beside each other in a garden. One grew toward the sun, reaching tall and proud. The other stayed small, afraid of being seen. The tall plant produced beautiful flowers that attracted bees and admiration. The small plant watched and waited. When autumn came, gardeners collected seeds from both. The small plant's seeds scattered far and wide while the tall one's fell close to home, teaching them both that different paths lead to different destinations.",
      timeLimit: 882,
    },
    45: {
      text: "A clockmaker built a magnificent timepiece that never lost a second. People came from distant towns to set their watches by it. One day it stopped at exactly noon. The clockmaker worked for weeks but could not fix it. Finally he understood that perfect timekeeping meant nothing if the clock no longer served its purpose. He left it stopped at noon and hung a sign: It's always noon somewhere, and now it's always noon here.",
      timeLimit: 900,
    },
    46: {
      text: "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him. - George Orwell, Nineteen Eighty-Four",
      timeLimit: 918,
    },
    47: {
      text: "The sky above the port was the color of television, tuned to a dead channel. Case was twenty-four and already tired. He'd been in the wilderness for two years, running on nothing but nerve and habit. Now he sat in a cheap hotel room watching the rain pattern the window and thought about survival. - William Gibson, Neuromancer",
      timeLimit: 936,
    },
    48: {
      text: "It was a pleasure to burn. It was a special pleasure to see things eaten, to see things blackened and changed. With the brass nozzle in his fists, with this great python spitting its venomous kerosene upon the world, he watched the pages burn. Fire was bright, and fire was clean. - Ray Bradbury, Fahrenheit 451",
      timeLimit: 954,
    },
    49: {
      text: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort. - J.R.R. Tolkien, The Hobbit",
      timeLimit: 972,
    },
    50: {
      text: "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother. I suppose she must have looked rather delightful, for Mrs. Darling put her hand to her heart and cried, Oh, why can't you remain like this forever! That was all that passed between them on the subject, but henceforth Wendy knew that she must grow up. - J.M. Barrie, Peter Pan",
      timeLimit: 990,
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

  // Start countdown only once
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (raceFinished) return;
    if (gameStarted) return;

    if (players.length > 0 && !showCountdown && !isActive && !raceFinished) {
      startCountdown();
      setGameStarted(true);
    }
  }, [room, players, raceFinished, gameStarted]);

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

  // Get points based on level
  const getPointsForLevel = (level) => {
    if (level <= 5) return { first: 20, second: 15, third: 12, fourth: 8 };
    if (level <= 10) return { first: 40, second: 30, third: 22, fourth: 15 };
    if (level <= 15) return { first: 60, second: 45, third: 32, fourth: 22 };
    if (level <= 20) return { first: 80, second: 60, third: 42, fourth: 30 };
    if (level <= 25) return { first: 100, second: 75, third: 52, fourth: 38 };
    if (level <= 30) return { first: 120, second: 90, third: 62, fourth: 45 };
    if (level <= 35) return { first: 140, second: 105, third: 72, fourth: 52 };
    if (level <= 40) return { first: 160, second: 120, third: 82, fourth: 60 };
    if (level <= 45) return { first: 180, second: 135, third: 92, fourth: 68 };
    return { first: 200, second: 150, third: 100, fourth: 75 };
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

  // Get car type based on player position and level
  const getCarType = (player, level) => {
    const carLevel = Math.ceil(level / 5) * 5;
    return `car${Math.min(carLevel, 50)}`;
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
    carType: getCarType(player, room?.level || 1),
    color: getCarColor(player.position),
    boost: player.wpm > 40 && player.accuracy > 95,
    position: player.position,
  }));

  return (
    <div className="multiplayer-game-container">
      <div className="game-box">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="level-display">LEVEL {room?.level}</div>
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
          {players.map((player) => (
            <div
              key={player.id}
              className="player-info"
              style={{ borderColor: getCarColor(player.position) }}
            >
              <span
                className="player-name"
                style={{ color: getCarColor(player.position) }}
              >
                {player.id === user.uid ? "YOU" : player.name}
                <BadgeDisplay userId={player.id} size="small" />
              </span>
              <span className="player-stats">
                {player.finished
                  ? "✓ FINISHED"
                  : `${Math.floor(player.progress || 0)}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Results Modal */}
      {results && (
        <div className="results-modal">
          <h2>RACE RESULTS</h2>
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
                  <BadgeDisplay userId={player.id} size="small" />
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
