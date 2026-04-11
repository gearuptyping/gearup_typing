// Game.js - Solo game page with typing, racing environment, badges, and weekly points
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth, database } from "../firebase";
import { ref, get, update } from "firebase/database";
import RacingEnvironment from "../components/RacingEnvironment";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import BadgeToast from "../components/BadgeToast";
import { checkForBadgeUnlock } from "../services/badgeService";
import { getRegularCarForLevel } from "../services/carService";
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
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [newBadgeUnlocked, setNewBadgeUnlocked] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);

  // Get car color based on type
  const getCarColor = (carType) => {
    return "#ffffff";
  };

  // Fetch user's display name from Firebase
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

  // Fallback level data with all 50 paragraphs
  const fallbackLevelData = {
    1: {
      id: 1,
      text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. The five boxing wizards jump quickly.",
      timeLimit: 60,
      gradient: "linear-gradient(145deg, #0a0a0f 0%, #0f1a2f 100%)",
    },
    2: {
      id: 2,
      text: "A journey of a thousand miles begins with a single step. Slow and steady wins the race. Practice makes perfect every single day.",
      timeLimit: 90,
      gradient: "linear-gradient(145deg, #0c0c12 0%, #121d33 100%)",
    },
    3: {
      id: 3,
      text: "An apple a day keeps the doctor away. Early to bed and early to rise makes a man healthy, wealthy, and wise. A penny for your thoughts.",
      timeLimit: 120,
      gradient: "linear-gradient(145deg, #0e0e15 0%, #152037 100%)",
    },
    4: {
      id: 4,
      text: "The sun rises in the east and sets in the west. The moon orbits around the Earth. Stars twinkle in the night sky above us all.",
      timeLimit: 150,
      gradient: "linear-gradient(145deg, #101018 0%, #18233b 100%)",
    },
    5: {
      id: 5,
      text: "Cats have nine lives, or so the old saying goes. Dogs are called man's best friend for good reason. Fish live in water and breathe through gills.",
      timeLimit: 180,
      gradient: "linear-gradient(145deg, #12121b 0%, #1b263f 100%)",
    },
  };

  // Level gradients for visual variety
  const levelGradients = {
    6: "linear-gradient(145deg, #14141e 0%, #1e2943 100%)",
    7: "linear-gradient(145deg, #161621 0%, #212c47 100%)",
    8: "linear-gradient(145deg, #181824 0%, #242f4b 100%)",
    9: "linear-gradient(145deg, #1a1a27 0%, #27324f 100%)",
    10: "linear-gradient(145deg, #1c1c2a 0%, #2a3553 100%)",
    11: "linear-gradient(145deg, #1e1e2d 0%, #2d3857 100%)",
    12: "linear-gradient(145deg, #202030 0%, #303b5b 100%)",
    13: "linear-gradient(145deg, #222233 0%, #333e5f 100%)",
    14: "linear-gradient(145deg, #242436 0%, #364163 100%)",
    15: "linear-gradient(145deg, #262639 0%, #394467 100%)",
    16: "linear-gradient(145deg, #28283c 0%, #3c476b 100%)",
    17: "linear-gradient(145deg, #2a2a3f 0%, #3f4a6f 100%)",
    18: "linear-gradient(145deg, #2c2c42 0%, #424d73 100%)",
    19: "linear-gradient(145deg, #2e2e45 0%, #455077 100%)",
    20: "linear-gradient(145deg, #303048 0%, #48537b 100%)",
    21: "linear-gradient(145deg, #32324b 0%, #4b567f 100%)",
    22: "linear-gradient(145deg, #34344e 0%, #4e5983 100%)",
    23: "linear-gradient(145deg, #363651 0%, #515c87 100%)",
    24: "linear-gradient(145deg, #383854 0%, #545f8b 100%)",
    25: "linear-gradient(145deg, #3a3a57 0%, #57628f 100%)",
    26: "linear-gradient(145deg, #3c3c5a 0%, #5a6593 100%)",
    27: "linear-gradient(145deg, #3e3e5d 0%, #5d6897 100%)",
    28: "linear-gradient(145deg, #404060 0%, #606b9b 100%)",
    29: "linear-gradient(145deg, #424263 0%, #636e9f 100%)",
    30: "linear-gradient(145deg, #444466 0%, #6671a3 100%)",
    31: "linear-gradient(145deg, #464669 0%, #6974a7 100%)",
    32: "linear-gradient(145deg, #48486c 0%, #6c77ab 100%)",
    33: "linear-gradient(145deg, #4a4a6f 0%, #6f7aaf 100%)",
    34: "linear-gradient(145deg, #4c4c72 0%, #727db3 100%)",
    35: "linear-gradient(145deg, #4e4e75 0%, #7580b7 100%)",
    36: "linear-gradient(145deg, #505078 0%, #7883bb 100%)",
    37: "linear-gradient(145deg, #52527b 0%, #7b86bf 100%)",
    38: "linear-gradient(145deg, #54547e 0%, #7e89c3 100%)",
    39: "linear-gradient(145deg, #565681 0%, #818cc7 100%)",
    40: "linear-gradient(145deg, #585884 0%, #848fcb 100%)",
    41: "linear-gradient(145deg, #5a5a87 0%, #8792cf 100%)",
    42: "linear-gradient(145deg, #5c5c8a 0%, #8a95d3 100%)",
    43: "linear-gradient(145deg, #5e5e8d 0%, #8d98d7 100%)",
    44: "linear-gradient(145deg, #606090 0%, #909bdb 100%)",
    45: "linear-gradient(145deg, #626293 0%, #939edf 100%)",
    46: "linear-gradient(145deg, #646496 0%, #96a1e3 100%)",
    47: "linear-gradient(145deg, #666699 0%, #99a4e7 100%)",
    48: "linear-gradient(145deg, #68689c 0%, #9ca7eb 100%)",
    49: "linear-gradient(145deg, #6a6a9f 0%, #9faaef 100%)",
    50: "linear-gradient(145deg, #6c6ca2 0%, #a2adf3 100%)",
  };

  // Generate all paragraphs for levels 6-50
  for (let i = 6; i <= 50; i++) {
    if (!fallbackLevelData[i]) {
      let text = "";

      // Levels 6-10: Easy Facts
      if (i >= 6 && i <= 10) {
        if (i === 6)
          text =
            "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs that was over three thousand years old. It remains the only food that lasts forever.";
        if (i === 7)
          text =
            "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills while the third pumps it to the rest of the body. They are remarkably intelligent creatures.";
        if (i === 8)
          text =
            "Bananas are technically berries, while strawberries are not. Botanically speaking, a berry has seeds inside rather than outside. This surprises many people when they first learn it.";
        if (i === 9)
          text =
            "A day on Venus is longer than its year. Venus takes two hundred forty-three Earth days to rotate once but only two hundred twenty-five days to orbit the sun. Time works differently there.";
        if (i === 10)
          text =
            "Wombat poop is cube-shaped. This unique shape prevents it from rolling away, marking territory more effectively. Nature finds the most fascinating solutions to problems.";
      }

      // Levels 11-15: Science Facts
      if (i >= 11 && i <= 15) {
        if (i === 11)
          text =
            "The human nose can remember over fifty thousand different scents. Dogs have noses even more powerful, with up to three hundred million scent receptors compared to our mere six million. Their world is built around smells we cannot perceive.";
        if (i === 12)
          text =
            "Lightning strikes the Earth about one hundred times every second. That's eight million times per day. Each bolt reaches temperatures hotter than the surface of the sun, creating the thunder we hear afterwards.";
        if (i === 13)
          text =
            "Trees communicate with each other through underground fungal networks. They share nutrients and send warnings about pests and diseases. Scientists call this network the Wood Wide Web, and it connects entire forests in ways we are only beginning to understand.";
        if (i === 14)
          text =
            "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. Astronauts can see it only with magnification, just like many other human structures. This myth has persisted for decades despite being proven false.";
        if (i === 15)
          text =
            "Butterflies taste with their feet. They have taste sensors on their legs that help them find food and suitable plants for laying eggs. This unusual adaptation ensures their caterpillars will have the right leaves to eat when they hatch.";
      }

      // Levels 16-20: History & Nature
      if (i >= 16 && i <= 20) {
        if (i === 16)
          text =
            "The shortest war in history lasted only thirty-eight minutes. It occurred between Britain and Zanzibar in 1896. The Zanzibar forces surrendered after a brief bombardment, making it the most one-sided conflict ever recorded in military history books.";
        if (i === 17)
          text =
            "Cleopatra lived closer in time to the invention of the iPhone than to the construction of the pyramids. The Great Pyramid was built around 2560 BCE, while Cleopatra lived around 30 BCE. This puts nearly two thousand five hundred years between the pyramids and Egypt's most famous queen.";
        if (i === 18)
          text =
            "Octopuses can change not only their color but also their texture to blend in with surroundings. They mimic rocks, coral, and sand with incredible accuracy. This camouflage happens in less than a second, controlled directly by their complex nervous system.";
        if (i === 19)
          text =
            "The Eiffel Tower grows taller in summer. The iron structure expands in heat, adding up to six inches in height during hot days. It also leans slightly away from the sun, demonstrating how temperature affects even the most solid constructions.";
        if (i === 20)
          text =
            "Cows have best friends and become stressed when separated from them. Scientists have observed lower heart rates and reduced stress hormones when cows are with their preferred companions. This reveals the deep social bonds that exist throughout the animal kingdom.";
      }

      // Levels 21-25: Literature & Culture
      if (i >= 21 && i <= 25) {
        if (i === 21)
          text =
            "The ancient Library of Alexandria was one of the largest and most significant libraries of the ancient world. It housed hundreds of thousands of scrolls containing knowledge from Africa, Europe, and Asia. Scholars traveled from across the known world to study there, making it a true center of learning.";
        if (i === 22)
          text =
            "Shakespeare invented over seventeen hundred words that we still use today. Among them are bedroom, lonely, generous, and majestic. His creative wordplay transformed the English language forever, giving us new ways to express thoughts that previously had no name.";
        if (i === 23)
          text =
            "The Viking explorer Leif Erikson reached North America about five hundred years before Columbus. He established a settlement in Newfoundland around the year 1000. Norse sagas tell of his voyages to a land they called Vinland, named for the wild grapes they found growing there.";
        if (i === 24)
          text =
            "Paper money was first developed in China during the Tang Dynasty around the 7th century. Marco Polo brought stories of this strange practice back to Europe, where people continued using coins for centuries longer. The concept eventually spread worldwide, transforming global commerce forever.";
        if (i === 25)
          text =
            "The ancient Olympic Games continued for over a thousand years before being abolished. They began in 776 BCE and lasted until 393 CE when a Christian emperor banned them as pagan. Athletes competed naked, and the games included events like chariot racing that we no longer see today.";
      }

      // Levels 26-30: Scientific Explanations
      if (i >= 26 && i <= 30) {
        if (i === 26)
          text =
            "The concept of quantum entanglement suggests that particles can remain connected across vast distances. When one particle changes, its entangled partner changes instantly regardless of separation. Einstein called this spooky action at a distance and never fully accepted it, though experiments have repeatedly confirmed its existence.";
        if (i === 27)
          text =
            "Black holes are regions where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle. The boundary around them called the event horizon marks the point of no return, beyond which all matter and energy are forever lost to our observable universe.";
        if (i === 28)
          text =
            "DNA contains the instructions for building and maintaining living organisms. This molecule stores information in a code made of four chemical bases that pair together in specific combinations. The complete set of human DNA contains about three billion base pairs, and if stretched out would reach from Earth to the sun and back multiple times.";
        if (i === 29)
          text =
            "Plate tectonics explains how Earth's outer shell is divided into plates that glide over the mantle. These plates move about as fast as fingernails grow, yet their collisions build mountains and trigger earthquakes. The theory revolutionized geology in the twentieth century, confirming that continents drift across the planet over millions of years.";
        if (i === 30)
          text =
            "Photosynthesis transforms sunlight into chemical energy, producing oxygen as a byproduct. Plants absorb carbon dioxide and water, converting them into glucose using chlorophyll. This process sustains nearly all life on Earth by providing food and breathable air, making it arguably the most important chemical reaction on our planet.";
      }

      // Levels 31-35: Philosophical & Abstract
      if (i >= 31 && i <= 35) {
        if (i === 31)
          text =
            "The ancient Greek philosopher Socrates never wrote anything himself. Everything we know about him comes from his students, particularly Plato. He taught by asking questions that made people examine their own beliefs, a method now called the Socratic technique that remains fundamental to education and philosophy today.";
        if (i === 32)
          text =
            "Time perception varies among species. Flies process visual information much faster than humans, making our movements appear slow to them. This explains why they can evade swats so effectively. Small animals generally perceive time more rapidly than larger ones, a survival adaptation that helps them react quickly to threats.";
        if (i === 33)
          text =
            "The Fibonacci sequence appears throughout nature in surprising ways. Flower petals often follow these numbers, as do pinecones and sunflower seed arrangements. This mathematical pattern creates efficient packing and optimal growth, suggesting that nature favors certain numerical relationships for practical evolutionary reasons.";
        if (i === 34)
          text =
            "Human memory is not a recording but a reconstruction. Each time we remember something, we rebuild it from fragments, often altering details. This explains why eyewitness testimony can be unreliable and why different people remember the same event differently. Our memories change subtly with each recall.";
        if (i === 35)
          text =
            "The placebo effect demonstrates the power of belief in healing. Patients given sugar pills often improve simply because they expect to. This phenomenon reveals the profound connection between mind and body, showing that our expectations can trigger real physiological changes that promote recovery and reduce pain.";
      }

      // Levels 36-40: Complex Topics
      if (i >= 36 && i <= 40) {
        if (i === 36)
          text =
            "The development of written language transformed human civilization. Before writing, knowledge existed only in memory and could be lost with a single generation. Writing allowed information to accumulate across centuries, enabling the complex societies, laws, and scientific discoveries that define modern life. It represents perhaps humanity's most important technological achievement.";
        if (i === 37)
          text =
            "The concept of zero originated in India around the 5th century. Earlier civilizations had placeholders but no true zero as a number. This invention revolutionized mathematics by enabling place value systems and making advanced calculations possible. Without zero, we would lack modern algebra, calculus, and computing.";
        if (i === 38)
          text =
            "Symbiosis describes relationships where different species live together intimately. Some partnerships benefit both organisms, like bees and flowers. Others benefit one without harming the other, while parasitic relationships harm the host. These complex interactions shape ecosystems and drive evolution, creating the interdependent web of life we see everywhere in nature.";
        if (i === 39)
          text =
            "The Heisenberg uncertainty principle states that we cannot simultaneously know both the position and momentum of a particle with perfect accuracy. This is not a limitation of measurement but a fundamental property of reality at quantum scales. The more precisely we measure one property, the less we can know about the other, challenging our classical understanding of the universe.";
        if (i === 40)
          text =
            "Epigenetics studies how environmental factors can change gene expression without altering DNA itself. Stress, diet, and experiences can modify which genes are activated, and some of these changes may pass to future generations. This challenges the traditional view that inheritance involves only DNA sequences, revealing a more complex picture of how traits are passed down.";
      }

      // Levels 41-45: Short Stories
      if (i >= 41 && i <= 45) {
        if (i === 41)
          text =
            "The old man sat on the park bench every morning, feeding pigeons from a paper bag. Children called him the pigeon man, though he never seemed to mind. One day a little girl asked why he came alone each day. He smiled and said the pigeons were his family now, and family never asks why you visit. The girl returned the next day with her own bag of bread crumbs.";
        if (i === 42)
          text =
            "A fisherman once caught a bottle with a message inside. The note read: Throw me back, for I contain only the dreams of a child. He opened it anyway, and found it empty. Disappointed, he threw the bottle back into the sea. Years later his daughter found it on the same beach and wrote her own dreams on a tiny paper, placing them inside before casting it back to the waves.";
        if (i === 43)
          text =
            "The librarian noticed a book that never got checked out. Its title was The Secret Life of Librarians. Curious, she opened it to find blank pages except one that read: Every story needs a reader to come alive. She placed it on display, and by week's end, every page was filled with handwritten stories from townspeople who finally felt seen.";
        if (i === 44)
          text =
            "Two seeds landed beside each other in a garden. One grew toward the sun, reaching tall and proud. The other stayed small, afraid of being seen. The tall plant produced beautiful flowers that attracted bees and admiration. The small plant watched and waited. When autumn came, gardeners collected seeds from both. The small plant's seeds scattered far and wide while the tall one's fell close to home, teaching them both that different paths lead to different destinations.";
        if (i === 45)
          text =
            "A clockmaker built a magnificent timepiece that never lost a second. People came from distant towns to set their watches by it. One day it stopped at exactly noon. The clockmaker worked for weeks but could not fix it. Finally he understood that perfect timekeeping meant nothing if the clock no longer served its purpose. He left it stopped at noon and hung a sign: It's always noon somewhere, and now it's always noon here.";
      }

      // Levels 46-50: Classic Literature Excerpts
      if (i >= 46 && i <= 50) {
        if (i === 46)
          text =
            "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.";
        if (i === 47)
          text =
            "The sky above the port was the color of television, tuned to a dead channel. Case was twenty-four and already tired. He'd been in the wilderness for two years, running on nothing but nerve and habit. Now he sat in a cheap hotel room watching the rain pattern the window and thought about survival.";
        if (i === 48)
          text =
            "It was a pleasure to burn. It was a special pleasure to see things eaten, to see things blackened and changed. With the brass nozzle in his fists, with this great python spitting its venomous kerosene upon the world, he watched the pages burn. Fire was bright, and fire was clean.";
        if (i === 49)
          text =
            "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.";
        if (i === 50)
          text =
            "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother. I suppose she must have looked rather delightful, for Mrs. Darling put her hand to her heart and cried, Oh, why can't you remain like this forever! That was all that passed between them on the subject, but henceforth Wendy knew that she must grow up.";
      }

      fallbackLevelData[i] = {
        id: i,
        text: text,
        timeLimit: 60 + i * 3,
        gradient:
          levelGradients[i] ||
          "linear-gradient(145deg, #0a0a0f 0%, #0f1a2f 100%)",
      };
    }
  }

  // Get current level data
  const currentLevel = level || fallbackLevelData[levelId];
  const levelGradient =
    currentLevel?.gradient ||
    "linear-gradient(145deg, #0a0a0f 0%, #0f1a2f 100%)";

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

    if (!levelId || !fallbackLevelData[levelId]) {
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

  // Start countdown when user presses any key
  const handleKeyDown = (e) => {
    if (!isActive && !isFinished && !showCountdown && e.key.length === 1) {
      startCountdown();
    }
  };

  // Countdown Function
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

  // Check for badge unlocks after level completion
  const checkForNewBadges = async (completedLevel) => {
    if (!user) return;

    const milestoneLevels = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

    for (const milestone of milestoneLevels) {
      if (completedLevel === milestone) {
        const result = await checkForBadgeUnlock(user.uid, completedLevel);

        if (result.unlocked) {
          setNewBadgeUnlocked(result.badge);
          setShowUnlockModal(true);
          setToastMessage(`🎉 New badge unlocked: ${result.badge.name}!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      }
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

    // Determine result type for modal
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

        // High Score System
        const levelScores = data.levelScores || {};
        const levelNum = parseInt(levelId);
        const scoreEarned = Math.floor((finalWpm * finalAccuracy) / 10);

        const previousBest = levelScores[levelNum] || 0;
        const isNewHighScore = scoreEarned > previousBest;

        let additionalScore = 0;
        if (isNewHighScore) {
          additionalScore = scoreEarned - previousBest;
          levelScores[levelNum] = scoreEarned;
          console.log(
            `🏆 New high score for Level ${levelNum}: ${scoreEarned} (improved by ${additionalScore})`,
          );
        }

        // Level Unlock Logic - Only unlock if all conditions met
        if (
          completedFullParagraph &&
          finishedBeforeTimeUp &&
          finalAccuracy > 80
        ) {
          if (!unlockedLevels.includes(levelNum + 1)) {
            unlockedLevels.push(levelNum + 1);
            console.log(`🔓 Unlocked Level ${levelNum + 1} - Complete!`);
          }
        } else {
          if (!completedFullParagraph)
            console.log(`❌ Level not unlocked: Didn't finish paragraph`);
          if (!finishedBeforeTimeUp)
            console.log(`❌ Level not unlocked: Time ran out`);
          if (finalAccuracy <= 80)
            console.log(
              `❌ Level not unlocked: Accuracy ${finalAccuracy}% < 80%`,
            );
        }

        // Calculate player level and update Firebase
        const playerLevel = Math.max(...unlockedLevels);

        const updates = {
          unlockedLevels: unlockedLevels,
          level: playerLevel,
          lastPlayed: new Date().toISOString(),
        };

        if (additionalScore > 0) {
          updates.score = currentScore + additionalScore;
          updates.levelScores = levelScores;
          console.log(
            `✨ Added ${additionalScore} points! Total score: ${currentScore + additionalScore}`,
          );
        } else {
          console.log(
            `📊 No new high score. Best for Level ${levelNum} is ${previousBest}`,
          );
        }

        await update(userRef, updates);

        // Award weekly points for leaderboard
        const weeklyPoints = calculateSoloPoints(
          finalWpm,
          finalAccuracy,
          levelNum,
        );
        await addWeeklyPoints(user.uid, weeklyPoints);
        console.log(`📅 Added ${weeklyPoints} weekly points!`);

        // Check for badge unlocks
        await checkForNewBadges(levelNum);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  // Input Change Handler
  const handleInputChange = (e) => {
    if (!isActive || isFinished) return;
    setInputText(e.target.value);
  };

  // Restart Game Function
  const handleRestart = () => {
    setIsActive(false);
    setIsFinished(false);
    setInputText("");
    setTimer(currentLevel?.timeLimit || 60);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, progress: 0, boost: false })),
    );
    startCountdown();
  };

  // Next Level Function
  const handleNextLevel = () => {
    const nextLevel = parseInt(levelId) + 1;
    if (nextLevel <= 50) {
      navigate(`/game/${nextLevel}`, {
        state: { level: fallbackLevelData[nextLevel] },
      });
      setTimeout(handleRestart, 100);
    } else {
      navigate("/levels");
    }
  };

  // Handle badge unlock modal close
  const handleBadgeUnlockClose = () => {
    setShowUnlockModal(false);
    setNewBadgeUnlocked(null);
  };

  // Render target text with visible spaces
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

  // Get result title and message based on resultType
  const getResultContent = () => {
    switch (resultType) {
      case "victory":
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

  // Check if next level should be shown
  const shouldShowNextLevel = () => {
    const levelNum = parseInt(levelId);
    return resultType === "victory" && levelNum < 50;
  };

  // Loading State
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

  // Error State
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

  // Main Render
  return (
    <div className="game-container">
      <div className="game-box">
        {/* Top Bar */}
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

        {/* Racing Environment */}
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

        {/* Typing Section */}
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

        {/* Player Info Bar */}
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

      {/* Results Modal */}
      {isFinished && (
        <div className="results-modal">
          <h2>{resultContent.title}</h2>
          <p className="result-message">{resultContent.message}</p>
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

      {/* Badge Unlock Modal */}
      {showUnlockModal && newBadgeUnlocked && (
        <BadgeUnlockModal
          badge={newBadgeUnlocked}
          onClose={handleBadgeUnlockClose}
          onCollect={handleBadgeUnlockClose}
          userId={user?.uid}
          showConfetti={true}
        />
      )}

      {/* Badge Toast Notification */}
      {showToast && (
        <BadgeToast
          message={toastMessage}
          duration={3000}
          onClose={() => setShowToast(false)}
          icon="🎉"
          type="success"
        />
      )}
    </div>
  );
};

export default Game;
