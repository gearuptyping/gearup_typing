// Levels.js - Level selection page with 24 levels, lock system, admin bypass
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

  // Check if user is admin - unlocks all 24 levels for admins only
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const adminStatus = await checkIfUserIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
      if (adminStatus) {
        // Admin sees all 24 levels unlocked
        setUnlockedLevels([...Array(24).keys()].map((i) => i + 1));
      }
    };
    checkAdminStatus();
  }, [user]);

  // Generate 24 levels with progressive difficulty
  const generateLevels = () => {
    const levels = [];
    for (let i = 1; i <= 24; i++) {
      const baseWpm = 15 + Math.floor(i * 1.5);
      const baseTime = 45 + Math.floor(i * 2);
      const text = getParagraphForLevel(i);
      // SINGLE COLOR for ALL levels - consistent design
      const gradient = "linear-gradient(145deg, #41588a 0%, #2a3a6a 100%)";

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

  // Paragraphs for each level (1-24)
  const getParagraphForLevel = (level) => {
    // Levels 1-4: Easiest - Pangrams & Proverbs
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

    // Levels 5-8: Easy - Interesting Facts
    if (level === 5) {
      return "Cats have nine lives, or so the old saying goes. Dogs are called man's best friend for good reason. Fish live in water and breathe through gills.";
    }
    if (level === 6) {
      return "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs that was over three thousand years old. It remains the only food that lasts forever.";
    }
    if (level === 7) {
      return "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills while the third pumps it to the rest of the body. They are remarkably intelligent creatures.";
    }
    if (level === 8) {
      return "Bananas are technically berries, while strawberries are not. Botanically speaking, a berry has seeds inside rather than outside. This surprises many people when they first learn it.";
    }

    // Levels 9-12: Easy-Medium - Science Facts
    if (level === 9) {
      return "A day on Venus is longer than its year. Venus takes two hundred forty-three Earth days to rotate once but only two hundred twenty-five days to orbit the sun. Time works differently there.";
    }
    if (level === 10) {
      return "Wombat poop is cube-shaped. This unique shape prevents it from rolling away, marking territory more effectively. Nature finds the most fascinating solutions to problems.";
    }
    if (level === 11) {
      return "The human nose can remember over fifty thousand different scents. Dogs have noses even more powerful, with up to three hundred million scent receptors compared to our mere six million.";
    }
    if (level === 12) {
      return "Lightning strikes the Earth about one hundred times every second. That's eight million times per day. Each bolt reaches temperatures hotter than the surface of the sun.";
    }

    // Levels 13-16: Medium - History & Nature
    if (level === 13) {
      return "Trees communicate with each other through underground fungal networks. They share nutrients and send warnings about pests and diseases. Scientists call this network the Wood Wide Web.";
    }
    if (level === 14) {
      return "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. Astronauts can see it only with magnification, just like many other human structures.";
    }
    if (level === 15) {
      return "The shortest war in history lasted only thirty-eight minutes. It occurred between Britain and Zanzibar in 1896. The Zanzibar forces surrendered after a brief bombardment.";
    }
    if (level === 16) {
      return "Cleopatra lived closer in time to the invention of the iPhone than to the construction of the pyramids. The Great Pyramid was built around 2560 BCE, while Cleopatra lived around 30 BCE.";
    }

    // Levels 17-20: Hard - Scientific Explanations
    if (level === 17) {
      return "The concept of quantum entanglement suggests that particles can remain connected across vast distances. When one particle changes, its entangled partner changes instantly regardless of separation.";
    }
    if (level === 18) {
      return "Black holes are regions where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle.";
    }
    if (level === 19) {
      return "DNA contains the instructions for building and maintaining living organisms. This molecule stores information in a code made of four chemical bases that pair together in specific combinations.";
    }
    if (level === 20) {
      return "Plate tectonics explains how Earth's outer shell is divided into plates that glide over the mantle. These plates move about as fast as fingernails grow, yet their collisions build mountains.";
    }

    // Levels 21-24: Hardest - Literature Excerpts
    if (level === 21) {
      return "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith slipped quickly through the glass doors of Victory Mansions. - George Orwell, Nineteen Eighty-Four";
    }
    if (level === 22) {
      return "It was a pleasure to burn. It was a special pleasure to see things eaten, to see things blackened and changed. Fire was bright, and fire was clean. - Ray Bradbury, Fahrenheit 451";
    }
    if (level === 23) {
      return "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole: it was a hobbit-hole, and that means comfort. - J.R.R. Tolkien, The Hobbit";
    }
    if (level === 24) {
      return "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden. - J.M. Barrie, Peter Pan";
    }

    // Fallback
    return `Level ${level} typing challenge. Focus on accuracy and speed will follow naturally with practice.`;
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

  // Create array of 25 items (24 levels + 1 coming soon)
  const displayItems = [...levels];
  for (let i = levels.length + 1; i <= 25; i++) {
    displayItems.push({ id: i, isComingSoon: true });
  }

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

      {/* Levels Grid - 25 items (24 levels + 1 coming soon) */}
      <div className="levels-grid">
        {displayItems.map((item) => {
          if (item.isComingSoon) {
            return (
              <div key={item.id} className="level-card coming-soon">
                <div className="coming-soon-icon">🚧</div>
                <div className="level-number">LEVEL {item.id}</div>
                <div className="coming-soon-text">COMING SOON</div>
                <div className="coming-soon-message">
                  More levels on the way!
                </div>
              </div>
            );
          }

          const isUnlocked = unlockedLevels.includes(item.id);
          const isMaxLevel = item.id === 24;

          return (
            <div
              key={item.id}
              className={`level-card ${isUnlocked ? "unlocked" : "locked"}`}
              onClick={() => isUnlocked && handleLevelSelect(item)}
              style={isUnlocked ? { background: item.gradient } : {}}
            >
              {!isUnlocked && <div className="lock-icon">🔒</div>}
              {isMaxLevel && isUnlocked && (
                <div className="max-level-badge">🏆</div>
              )}
              <div className="level-number">LEVEL {item.id}</div>
              <div className="level-stats">
                <div className="stat">
                  <span className="stat-label">TARGET</span>
                  <span className="stat-value">{item.wpmTarget} WPM</span>
                </div>
                <div className="stat">
                  <span className="stat-label">TIME</span>
                  <span className="stat-value">{item.timeLimit}s</span>
                </div>
              </div>
              {isUnlocked && <button className="select-level-btn">RACE</button>}
              {!isUnlocked && (
                <div className="locked-message">
                  Complete Level {item.id - 1} to unlock
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Info - Only visible to admins */}
      {isAdmin && (
        <div className="admin-info-banner">
          <span className="admin-icon">👑</span>
          <span>Admin Mode: All 24 levels unlocked</span>
        </div>
      )}
    </div>
  );
};

export default Levels;
