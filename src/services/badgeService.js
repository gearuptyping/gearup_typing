// badgeService.js - Core badge system for unlock conditions, definitions, and user progress
import { getDatabase, ref, update, get } from "firebase/database";

// Badge definitions - All 10 level-based badges
export const BADGES = {
  newbie: {
    id: "newbie",
    name: "Newbie",
    icon: "🔰",
    color: "#4CAF50",
    glowColor: "rgba(76, 175, 80, 0.5)",
    levelRange: [1, 5],
    description: "Beginning your typing journey",
    order: 1,
  },
  rookie: {
    id: "rookie",
    name: "Rookie",
    icon: "🛡️",
    color: "#64B5F6",
    glowColor: "rgba(100, 181, 246, 0.5)",
    levelRange: [6, 10],
    description: "Learning the ropes",
    order: 2,
  },
  amateur: {
    id: "amateur",
    name: "Amateur",
    icon: "🏎️",
    color: "#2196F3",
    glowColor: "rgba(33, 150, 243, 0.5)",
    levelRange: [11, 15],
    description: "Finding your speed",
    order: 3,
  },
  pro: {
    id: "pro",
    name: "Pro",
    icon: "🌟",
    color: "#9C27B0",
    glowColor: "rgba(156, 39, 176, 0.5)",
    levelRange: [16, 20],
    description: "Professional typer in training",
    order: 4,
  },
  expert: {
    id: "expert",
    name: "Expert",
    icon: "🎯",
    color: "#FF9800",
    glowColor: "rgba(255, 152, 0, 0.5)",
    levelRange: [21, 25],
    description: "Accuracy is your strength",
    order: 5,
  },
  master: {
    id: "master",
    name: "Master",
    icon: "💎",
    color: "#CD7F32",
    glowColor: "rgba(205, 127, 50, 0.5)",
    levelRange: [26, 30],
    description: "Master of the keyboard",
    order: 6,
  },
  legend: {
    id: "legend",
    name: "Legend",
    icon: "🏅",
    color: "#C0C0C0",
    glowColor: "rgba(192, 192, 192, 0.5)",
    levelRange: [31, 35],
    description: "Legendary status approaching",
    order: 7,
  },
  champion: {
    id: "champion",
    name: "Champion",
    icon: "🏆",
    color: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.5)",
    levelRange: [36, 40],
    description: "Champion typer",
    order: 8,
  },
  hero: {
    id: "hero",
    name: "Hero",
    icon: "⚔️",
    color: "#F44336",
    glowColor: "rgba(244, 67, 54, 0.5)",
    levelRange: [41, 45],
    description: "Heroic typing speed",
    order: 9,
  },
  immortal: {
    id: "immortal",
    name: "Immortal",
    icon: "♾️",
    color: "#000000",
    glowColor: "rgba(192, 192, 192, 0.5)",
    levelRange: [46, 50],
    description: "Transcended beyond mortal limits",
    order: 10,
  },
};

// Get badge by level
export const getBadgeByLevel = (level) => {
  if (!level || level < 1) return null;

  const badge = Object.values(BADGES).find(
    (b) => level >= b.levelRange[0] && level <= b.levelRange[1],
  );

  return badge || null;
};

// Get badge by ID
export const getBadgeById = (badgeId) => {
  return BADGES[badgeId] || null;
};

// Get all badges sorted by order
export const getAllBadges = () => {
  return Object.values(BADGES).sort((a, b) => a.order - b.order);
};

// Get badge progress for a user
export const getUserBadgeProgress = async (userId) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/badges`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return {
        unlocked: [],
        nextBadge: null,
        totalUnlocked: 0,
      };
    }

    const badgesData = snapshot.val();
    const unlocked = [];

    Object.keys(badgesData).forEach((badgeId) => {
      if (badgesData[badgeId].unlocked) {
        unlocked.push({
          ...BADGES[badgeId],
          unlockedAt: badgesData[badgeId].unlockedAt,
          level: badgesData[badgeId].level,
        });
      }
    });

    unlocked.sort((a, b) => a.order - b.order);

    const allBadges = getAllBadges();
    const nextBadge = allBadges.find(
      (b) => !unlocked.some((u) => u.id === b.id),
    );

    return {
      unlocked,
      nextBadge: nextBadge || null,
      totalUnlocked: unlocked.length,
    };
  } catch (error) {
    console.error("Error getting user badge progress:", error);
    return {
      unlocked: [],
      nextBadge: null,
      totalUnlocked: 0,
    };
  }
};

// Check for new badge unlocks when user levels up
export const checkForBadgeUnlock = async (userId, newLevel) => {
  try {
    const db = getDatabase();
    const userBadgesRef = ref(db, `users/${userId}/badges`);
    const snapshot = await get(userBadgesRef);

    let currentBadges = snapshot.exists() ? snapshot.val() : {};

    const badgeForLevel = getBadgeByLevel(newLevel);

    if (!badgeForLevel) {
      return { unlocked: false, badge: null };
    }

    if (currentBadges[badgeForLevel.id]?.unlocked) {
      return { unlocked: false, badge: null };
    }

    // Badges unlock at the MAX level of their range (e.g., Newbie at Level 5)
    if (newLevel !== badgeForLevel.levelRange[1]) {
      return { unlocked: false, badge: null };
    }

    const unlockData = {
      [badgeForLevel.id]: {
        unlocked: true,
        unlockedAt: Date.now(),
        level: newLevel,
      },
    };

    await update(userBadgesRef, unlockData);

    return {
      unlocked: true,
      badge: {
        ...badgeForLevel,
        unlockedAt: Date.now(),
        level: newLevel,
      },
    };
  } catch (error) {
    console.error("Error checking for badge unlock:", error);
    return { unlocked: false, badge: null, error };
  }
};

// Get user's highest badge for display next to username
export const getHighestBadge = async (userId) => {
  try {
    const progress = await getUserBadgeProgress(userId);

    if (progress.unlocked.length === 0) {
      return null;
    }

    return progress.unlocked[progress.unlocked.length - 1];
  } catch (error) {
    console.error("Error getting highest badge:", error);
    return null;
  }
};

// Initialize badges for a new user
export const initializeUserBadges = async (userId) => {
  try {
    const db = getDatabase();
    const userBadgesRef = ref(db, `users/${userId}/badges`);

    const initialBadges = {};
    Object.keys(BADGES).forEach((badgeId) => {
      initialBadges[badgeId] = { unlocked: false };
    });

    await update(userBadgesRef, initialBadges);
    return { success: true };
  } catch (error) {
    console.error("Error initializing user badges:", error);
    return { success: false, error };
  }
};

// Backfill badges for existing users
export const backfillUserBadges = async (userId, currentLevel) => {
  try {
    const db = getDatabase();
    const userBadgesRef = ref(db, `users/${userId}/badges`);

    const badgesToUnlock = {};

    Object.values(BADGES).forEach((badge) => {
      const maxLevelForBadge = badge.levelRange[1];
      if (currentLevel >= maxLevelForBadge) {
        badgesToUnlock[badge.id] = {
          unlocked: true,
          unlockedAt: Date.now(),
          level: maxLevelForBadge,
        };
      } else {
        badgesToUnlock[badge.id] = { unlocked: false };
      }
    });

    await update(userBadgesRef, badgesToUnlock);

    return { success: true };
  } catch (error) {
    console.error("Error backfilling user badges:", error);
    return { success: false, error };
  }
};
