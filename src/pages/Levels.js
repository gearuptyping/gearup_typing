// Levels.js - Level selection page with 50 levels, lock system, and admin bypass
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { checkIfUserIsAdmin } from "../services/adminService";
import "./Levels.css";

const Levels = ({ user }) => {
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Load user's unlocked levels from Firebase
  useEffect(() => {
    const loadLevels = async () => {
      if (!user) return;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUnlockedLevels(data.unlockedLevels || [1]);
      }
      setLoading(false);
    };

    loadLevels();
  }, [user]);

  // Check if user is admin - unlocks all levels
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const adminStatus = await checkIfUserIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
      if (adminStatus) {
        setUnlockedLevels([...Array(50).keys()].map((i) => i + 1));
      }
    };
    checkAdminStatus();
  }, [user]);

  // Generate 50 levels with progressive difficulty
  const generateLevels = () => {
    const levels = [];
    for (let i = 1; i <= 50; i++) {
      const baseWpm = 15 + Math.floor(i * 1.5);
      const baseTime = 45 + Math.floor(i * 2);
      const text = getParagraphForLevel(i);
      const gradient = getGradientForLevel(i);

      levels.push({
        id: i,
        wpmTarget: baseWpm,
        timeLimit: baseTime,
        gradient: gradient,
        text: text,
      });
    }
    return levels;
  };

  // Paragraphs for each level (1-50)
  const getParagraphForLevel = (level) => {
    // Levels 1-5: Easiest - Simple Facts
    if (level === 1) {
      return "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. The five boxing wizards jump quickly.";
    }
    if (level === 2) {
      return "A journey of a thousand miles begins with a single step. Slow and steady wins the race. Practice makes perfect every single day.";
    }
    if (level === 3) {
      return "An apple a day keeps the doctor away. Early to bed and early to rise makes a man healthy, wealthy, and wise. A penny for your thoughts.";
    }
    if (level === 4) {
      return "The sun rises in the east and sets in the west. The moon orbits around the Earth. Stars twinkle in the night sky above us all.";
    }
    if (level === 5) {
      return "Cats have nine lives, or so the old saying goes. Dogs are called man's best friend for good reason. Fish live in water and breathe through gills.";
    }

    // Levels 6-10: Easy - Interesting Facts
    if (level === 6) {
      return "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs that was over three thousand years old. It remains the only food that lasts forever.";
    }
    if (level === 7) {
      return "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills while the third pumps it to the rest of the body. They are remarkably intelligent creatures.";
    }
    if (level === 8) {
      return "Bananas are technically berries, while strawberries are not. Botanically speaking, a berry has seeds inside rather than outside. This surprises many people when they first learn it.";
    }
    if (level === 9) {
      return "A day on Venus is longer than its year. Venus takes two hundred forty-three Earth days to rotate once but only two hundred twenty-five days to orbit the sun. Time works differently there.";
    }
    if (level === 10) {
      return "Wombat poop is cube-shaped. This unique shape prevents it from rolling away, marking territory more effectively. Nature finds the most fascinating solutions to problems.";
    }

    // Levels 11-15: Easy-Medium - Science Facts
    if (level === 11) {
      return "The human nose can remember over fifty thousand different scents. Dogs have noses even more powerful, with up to three hundred million scent receptors compared to our mere six million. Their world is built around smells we cannot perceive.";
    }
    if (level === 12) {
      return "Lightning strikes the Earth about one hundred times every second. That's eight million times per day. Each bolt reaches temperatures hotter than the surface of the sun, creating the thunder we hear afterwards.";
    }
    if (level === 13) {
      return "Trees communicate with each other through underground fungal networks. They share nutrients and send warnings about pests and diseases. Scientists call this network the Wood Wide Web, and it connects entire forests in ways we are only beginning to understand.";
    }
    if (level === 14) {
      return "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. Astronauts can see it only with magnification, just like many other human structures. This myth has persisted for decades despite being proven false.";
    }
    if (level === 15) {
      return "Butterflies taste with their feet. They have taste sensors on their legs that help them find food and suitable plants for laying eggs. This unusual adaptation ensures their caterpillars will have the right leaves to eat when they hatch.";
    }

    // Levels 16-20: Medium - History & Nature
    if (level === 16) {
      return "The shortest war in history lasted only thirty-eight minutes. It occurred between Britain and Zanzibar in 1896. The Zanzibar forces surrendered after a brief bombardment, making it the most one-sided conflict ever recorded in military history books.";
    }
    if (level === 17) {
      return "Cleopatra lived closer in time to the invention of the iPhone than to the construction of the pyramids. The Great Pyramid was built around 2560 BCE, while Cleopatra lived around 30 BCE. This puts nearly two thousand five hundred years between the pyramids and Egypt's most famous queen.";
    }
    if (level === 18) {
      return "Octopuses can change not only their color but also their texture to blend in with surroundings. They mimic rocks, coral, and sand with incredible accuracy. This camouflage happens in less than a second, controlled directly by their complex nervous system.";
    }
    if (level === 19) {
      return "The Eiffel Tower grows taller in summer. The iron structure expands in heat, adding up to six inches in height during hot days. It also leans slightly away from the sun, demonstrating how temperature affects even the most solid constructions.";
    }
    if (level === 20) {
      return "Cows have best friends and become stressed when separated from them. Scientists have observed lower heart rates and reduced stress hormones when cows are with their preferred companions. This reveals the deep social bonds that exist throughout the animal kingdom.";
    }

    // Levels 21-25: Medium-Hard - Literature & Culture
    if (level === 21) {
      return "The ancient Library of Alexandria was one of the largest and most significant libraries of the ancient world. It housed hundreds of thousands of scrolls containing knowledge from Africa, Europe, and Asia. Scholars traveled from across the known world to study there, making it a true center of learning.";
    }
    if (level === 22) {
      return "Shakespeare invented over seventeen hundred words that we still use today. Among them are bedroom, lonely, generous, and majestic. His creative wordplay transformed the English language forever, giving us new ways to express thoughts that previously had no name.";
    }
    if (level === 23) {
      return "The Viking explorer Leif Erikson reached North America about five hundred years before Columbus. He established a settlement in Newfoundland around the year 1000. Norse sagas tell of his voyages to a land they called Vinland, named for the wild grapes they found growing there.";
    }
    if (level === 24) {
      return "Paper money was first developed in China during the Tang Dynasty around the 7th century. Marco Polo brought stories of this strange practice back to Europe, where people continued using coins for centuries longer. The concept eventually spread worldwide, transforming global commerce forever.";
    }
    if (level === 25) {
      return "The ancient Olympic Games continued for over a thousand years before being abolished. They began in 776 BCE and lasted until 393 CE when a Christian emperor banned them as pagan. Athletes competed naked, and the games included events like chariot racing that we no longer see today.";
    }

    // Levels 26-30: Hard - Scientific Explanations
    if (level === 26) {
      return "The concept of quantum entanglement suggests that particles can remain connected across vast distances. When one particle changes, its entangled partner changes instantly regardless of separation. Einstein called this spooky action at a distance and never fully accepted it, though experiments have repeatedly confirmed its existence.";
    }
    if (level === 27) {
      return "Black holes are regions where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle. The boundary around them called the event horizon marks the point of no return, beyond which all matter and energy are forever lost to our observable universe.";
    }
    if (level === 28) {
      return "DNA contains the instructions for building and maintaining living organisms. This molecule stores information in a code made of four chemical bases that pair together in specific combinations. The complete set of human DNA contains about three billion base pairs, and if stretched out would reach from Earth to the sun and back multiple times.";
    }
    if (level === 29) {
      return "Plate tectonics explains how Earth's outer shell is divided into plates that glide over the mantle. These plates move about as fast as fingernails grow, yet their collisions build mountains and trigger earthquakes. The theory revolutionized geology in the twentieth century, confirming that continents drift across the planet over millions of years.";
    }
    if (level === 30) {
      return "Photosynthesis transforms sunlight into chemical energy, producing oxygen as a byproduct. Plants absorb carbon dioxide and water, converting them into glucose using chlorophyll. This process sustains nearly all life on Earth by providing food and breathable air, making it arguably the most important chemical reaction on our planet.";
    }

    // Levels 31-35: Harder - Philosophical & Abstract
    if (level === 31) {
      return "The ancient Greek philosopher Socrates never wrote anything himself. Everything we know about him comes from his students, particularly Plato. He taught by asking questions that made people examine their own beliefs, a method now called the Socratic technique that remains fundamental to education and philosophy today.";
    }
    if (level === 32) {
      return "Time perception varies among species. Flies process visual information much faster than humans, making our movements appear slow to them. This explains why they can evade swats so effectively. Small animals generally perceive time more rapidly than larger ones, a survival adaptation that helps them react quickly to threats.";
    }
    if (level === 33) {
      return "The Fibonacci sequence appears throughout nature in surprising ways. Flower petals often follow these numbers, as do pinecones and sunflower seed arrangements. This mathematical pattern creates efficient packing and optimal growth, suggesting that nature favors certain numerical relationships for practical evolutionary reasons.";
    }
    if (level === 34) {
      return "Human memory is not a recording but a reconstruction. Each time we remember something, we rebuild it from fragments, often altering details. This explains why eyewitness testimony can be unreliable and why different people remember the same event differently. Our memories change subtly with each recall.";
    }
    if (level === 35) {
      return "The placebo effect demonstrates the power of belief in healing. Patients given sugar pills often improve simply because they expect to. This phenomenon reveals the profound connection between mind and body, showing that our expectations can trigger real physiological changes that promote recovery and reduce pain.";
    }

    // Levels 36-40: Very Hard - Complex Topics
    if (level === 36) {
      return "The development of written language transformed human civilization. Before writing, knowledge existed only in memory and could be lost with a single generation. Writing allowed information to accumulate across centuries, enabling the complex societies, laws, and scientific discoveries that define modern life. It represents perhaps humanity's most important technological achievement.";
    }
    if (level === 37) {
      return "The concept of zero originated in India around the 5th century. Earlier civilizations had placeholders but no true zero as a number. This invention revolutionized mathematics by enabling place value systems and making advanced calculations possible. Without zero, we would lack modern algebra, calculus, and computing.";
    }
    if (level === 38) {
      return "Symbiosis describes relationships where different species live together intimately. Some partnerships benefit both organisms, like bees and flowers. Others benefit one without harming the other, while parasitic relationships harm the host. These complex interactions shape ecosystems and drive evolution, creating the interdependent web of life we see everywhere in nature.";
    }
    if (level === 39) {
      return "The Heisenberg uncertainty principle states that we cannot simultaneously know both the position and momentum of a particle with perfect accuracy. This is not a limitation of measurement but a fundamental property of reality at quantum scales. The more precisely we measure one property, the less we can know about the other, challenging our classical understanding of the universe.";
    }
    if (level === 40) {
      return "Epigenetics studies how environmental factors can change gene expression without altering DNA itself. Stress, diet, and experiences can modify which genes are activated, and some of these changes may pass to future generations. This challenges the traditional view that inheritance involves only DNA sequences, revealing a more complex picture of how traits are passed down.";
    }

    // Levels 41-45: Second Hardest - Short Stories
    if (level === 41) {
      return "The old man sat on the park bench every morning, feeding pigeons from a paper bag. Children called him the pigeon man, though he never seemed to mind. One day a little girl asked why he came alone each day. He smiled and said the pigeons were his family now, and family never asks why you visit. The girl returned the next day with her own bag of bread crumbs.";
    }
    if (level === 42) {
      return "A fisherman once caught a bottle with a message inside. The note read: Throw me back, for I contain only the dreams of a child. He opened it anyway, and found it empty. Disappointed, he threw the bottle back into the sea. Years later his daughter found it on the same beach and wrote her own dreams on a tiny paper, placing them inside before casting it back to the waves.";
    }
    if (level === 43) {
      return "The librarian noticed a book that never got checked out. Its title was The Secret Life of Librarians. Curious, she opened it to find blank pages except one that read: Every story needs a reader to come alive. She placed it on display, and by week's end, every page was filled with handwritten stories from townspeople who finally felt seen.";
    }
    if (level === 44) {
      return "Two seeds landed beside each other in a garden. One grew toward the sun, reaching tall and proud. The other stayed small, afraid of being seen. The tall plant produced beautiful flowers that attracted bees and admiration. The small plant watched and waited. When autumn came, gardeners collected seeds from both. The small plant's seeds scattered far and wide while the tall one's fell close to home, teaching them both that different paths lead to different destinations.";
    }
    if (level === 45) {
      return "A clockmaker built a magnificent timepiece that never lost a second. People came from distant towns to set their watches by it. One day it stopped at exactly noon. The clockmaker worked for weeks but could not fix it. Finally he understood that perfect timekeeping meant nothing if the clock no longer served its purpose. He left it stopped at noon and hung a sign: It's always noon somewhere, and now it's always noon here.";
    }

    // Levels 46-50: Hardest - Classic Literature Excerpts
    if (level === 46) {
      return "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him. - George Orwell, Nineteen Eighty-Four";
    }
    if (level === 47) {
      return "The sky above the port was the color of television, tuned to a dead channel. Case was twenty-four and already tired. He'd been in the wilderness for two years, running on nothing but nerve and habit. Now he sat in a cheap hotel room watching the rain pattern the window and thought about survival. - William Gibson, Neuromancer";
    }
    if (level === 48) {
      return "It was a pleasure to burn. It was a special pleasure to see things eaten, to see things blackened and changed. With the brass nozzle in his fists, with this great python spitting its venomous kerosene upon the world, he watched the pages burn. Fire was bright, and fire was clean. - Ray Bradbury, Fahrenheit 451";
    }
    if (level === 49) {
      return "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort. - J.R.R. Tolkien, The Hobbit";
    }
    if (level === 50) {
      return "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother. I suppose she must have looked rather delightful, for Mrs. Darling put her hand to her heart and cried, Oh, why can't you remain like this forever! That was all that passed between them on the subject, but henceforth Wendy knew that she must grow up. - J.M. Barrie, Peter Pan";
    }

    // Fallback
    return `Level ${level} typing challenge. Focus on accuracy and speed will follow naturally with practice.`;
  };

  // Gradients for levels (5 levels per group)
  const getGradientForLevel = (level) => {
    const group = Math.ceil(level / 5);
    const variation = level % 5;

    switch (group) {
      case 1:
        return variation === 1
          ? "linear-gradient(145deg, #282986 0%, #0e54d6 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #2a2b8a 0%, #1258da 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #2c2d8e 0%, #165cde 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #2e2f92 0%, #1a60e2 100%)"
                : "linear-gradient(145deg, #303196 0%, #1e64e6 100%)";
      case 2:
        return variation === 1
          ? "linear-gradient(145deg, #1a3a3a 0%, #2a5a5a 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #1e3f3f 0%, #2e5f5f 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #224444 0%, #326464 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #264949 0%, #366969 100%)"
                : "linear-gradient(145deg, #2a4e4e 0%, #3a6e6e 100%)";
      case 3:
        return variation === 1
          ? "linear-gradient(145deg, #103038 0%, #1a4d5a 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #13353e 0%, #1e5362 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #163a44 0%, #22596a 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #193f4a 0%, #265f72 100%)"
                : "linear-gradient(145deg, #1c4450 0%, #2a657a 100%)";
      case 4:
        return variation === 1
          ? "linear-gradient(145deg, #143018 0%, #1e4d28 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #17351c 0%, #22532c 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #1a3a20 0%, #265930 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #1d3f24 0%, #2a5f34 100%)"
                : "linear-gradient(145deg, #204428 0%, #2e6538 100%)";
      case 5:
        return variation === 1
          ? "linear-gradient(145deg, #1a1430 0%, #2a1e4d 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #1d1735 0%, #2e2153 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #201a3a 0%, #322459 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #231d3f 0%, #36275f 100%)"
                : "linear-gradient(145deg, #262044 0%, #3a2a65 100%)";
      case 6:
        return variation === 1
          ? "linear-gradient(145deg, #30141a 0%, #4d1e2a 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #35171d 0%, #53212e 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #3a1a20 0%, #592432 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #3f1d23 0%, #5f2736 100%)"
                : "linear-gradient(145deg, #442026 0%, #652a3a 100%)";
      case 7:
        return variation === 1
          ? "linear-gradient(145deg, #101830 0%, #1a284d 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #131b35 0%, #1e2c53 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #161e3a 0%, #223059 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #19213f 0%, #26345f 100%)"
                : "linear-gradient(145deg, #1c2444 0%, #2a3865 100%)";
      case 8:
        return variation === 1
          ? "linear-gradient(145deg, #103030 0%, #1a4d4d 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #133535 0%, #1e5353 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #163a3a 0%, #225959 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #193f3f 0%, #265f5f 100%)"
                : "linear-gradient(145deg, #1c4444 0%, #2a6565 100%)";
      case 9:
        return variation === 1
          ? "linear-gradient(145deg, #2a1430 0%, #421e4d 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #2e1735 0%, #462153 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #321a3a 0%, #4a2459 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #361d3f 0%, #4e275f 100%)"
                : "linear-gradient(145deg, #3a2044 0%, #522a65 100%)";
      case 10:
        return variation === 1
          ? "linear-gradient(145deg, #0f1a2a 0%, #1e3850 100%)"
          : variation === 2
            ? "linear-gradient(145deg, #121e2e 0%, #223c54 100%)"
            : variation === 3
              ? "linear-gradient(145deg, #152232 0%, #264058 100%)"
              : variation === 4
                ? "linear-gradient(145deg, #182636 0%, #2a445c 100%)"
                : "linear-gradient(145deg, #1b2a3a 0%, #2e4860 100%)";
      default:
        return "linear-gradient(145deg, #0a0a0f 0%, #0f1a2f 100%)";
    }
  };

  const levels = generateLevels();

  // Handle level selection - only unlocked levels can be selected
  const handleLevelSelect = (level) => {
    if (unlockedLevels.includes(level.id)) {
      navigate(`/game/${level.id}`, { state: { level: level } });
    }
  };

  // Handle solo practice - random unlocked level
  const handleSoloPractice = () => {
    const randomLevelId =
      unlockedLevels[Math.floor(Math.random() * unlockedLevels.length)];
    const levelData = levels.find((l) => l.id === randomLevelId);
    navigate(`/game/${randomLevelId}`, { state: { level: levelData } });
  };

  // Loading State
  if (loading) {
    return (
      <div className="levels-loading">
        <div className="loading-spinner"></div>
        <p>Loading levels...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="levels-container">
      {/* Header Section */}
      <div className="levels-header">
        <h1>SELECT LEVEL</h1>
        <p className="header-subtitle">Choose a level to start racing</p>
        <div className="header-line"></div>
      </div>

      {/* Practice/Multiplayer Buttons */}
      <div className="practice-section">
        <button className="practice-btn" onClick={handleSoloPractice}>
          <span className="practice-icon">⚡</span>
          <span className="practice-text">SOLO PRACTICE</span>
          <span className="practice-desc">Random unlocked level</span>
        </button>

        <button
          className="multiplayer-btn"
          onClick={() => navigate("/multiplayer")}
        >
          <span className="multi-icon">🏁</span>
          <span className="multi-text">MULTIPLAYER</span>
          <span className="multi-desc">Race against others online</span>
        </button>
      </div>

      {/* Levels Grid - 50 cards */}
      <div className="levels-grid">
        {levels.map((level) => {
          const isUnlocked = unlockedLevels.includes(level.id);

          return (
            <div
              key={level.id}
              className={`level-card ${isUnlocked ? "unlocked" : "locked"}`}
              onClick={() => isUnlocked && handleLevelSelect(level)}
              style={isUnlocked ? { background: level.gradient } : {}}
            >
              {!isUnlocked && <div className="lock-icon">🔒</div>}
              <div className="level-number">LEVEL {level.id}</div>
              <div className="level-stats">
                <div className="stat">
                  <span className="stat-label">TARGET</span>
                  <span className="stat-value">{level.wpmTarget} WPM</span>
                </div>
                <div className="stat">
                  <span className="stat-label">TIME</span>
                  <span className="stat-value">{level.timeLimit}s</span>
                </div>
              </div>
              {isUnlocked && <button className="select-level-btn">RACE</button>}
              {!isUnlocked && (
                <div className="locked-message">
                  Complete Level {level.id - 1} to unlock
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Levels;
