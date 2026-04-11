// leaderboardService.js - Weekly leaderboard system for points, rankings, resets, and special car awards
import {
  getDatabase,
  ref,
  get,
  update,
  set,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { assignSpecialCar } from "./carService";

// Points calculation for solo game
export const calculateSoloPoints = (wpm, accuracy, level) => {
  const performancePoints = Math.floor((wpm * accuracy) / 10);
  const levelBonus = Math.floor(level * 5);
  const accuracyBonus = accuracy > 95 ? 50 : accuracy > 90 ? 25 : 0;
  return performancePoints + levelBonus + accuracyBonus;
};

// Points calculation for multiplayer game
export const calculateMultiplayerPoints = (rank, level, playersCount) => {
  const rankPoints = { 1: 100, 2: 75, 3: 50, 4: 25 };
  const levelMultiplier = 1 + level / 100;
  const playerBonus = playersCount * 10;
  const basePoints = rankPoints[rank] || 25;
  return Math.floor((basePoints + playerBonus) * levelMultiplier);
};

// Add weekly points to user's total
export const addWeeklyPoints = async (userId, points) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.error("User not found");
      return { success: false };
    }

    const userData = snapshot.val();
    const currentWeeklyScore = userData.weeklyScore || 0;
    const newWeeklyScore = currentWeeklyScore + points;

    await update(userRef, {
      weeklyScore: newWeeklyScore,
      lastWeeklyUpdate: Date.now(),
    });

    return {
      success: true,
      newWeeklyScore,
      pointsAdded: points,
    };
  } catch (error) {
    console.error("Error adding weekly points:", error);
    return { success: false, error };
  }
};

// Get user's current weekly score
export const getUserWeeklyScore = async (userId) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/weeklyScore`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error("Error getting weekly score:", error);
    return 0;
  }
};

// Get top 50 players for weekly leaderboard
export const getWeeklyLeaderboard = async (limit = 50) => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) return [];

    const leaderboard = [];

    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      const weeklyScore = userData.weeklyScore || 0;

      if (weeklyScore > 0) {
        leaderboard.push({
          userId: childSnapshot.key,
          displayName: userData.displayName || "Unknown",
          weeklyScore: weeklyScore,
          level: userData.level || 1,
        });
      }
    });

    leaderboard.sort((a, b) => b.weeklyScore - a.weeklyScore);

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankChanged: false,
    }));

    return rankedLeaderboard.slice(0, limit);
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return [];
  }
};

// Get user's current rank and stats
export const getUserRankInfo = async (userId) => {
  try {
    const leaderboard = await getWeeklyLeaderboard(100);
    const userEntry = leaderboard.find((entry) => entry.userId === userId);

    if (!userEntry) {
      const weeklyScore = await getUserWeeklyScore(userId);
      return {
        rank: null,
        weeklyScore,
        isInTop100: false,
        nextRank: null,
        pointsToNext: null,
      };
    }

    const currentIndex = leaderboard.findIndex(
      (entry) => entry.userId === userId,
    );
    const nextRankEntry =
      currentIndex > 0 ? leaderboard[currentIndex - 1] : null;
    const pointsToNext = nextRankEntry
      ? nextRankEntry.weeklyScore - userEntry.weeklyScore + 1
      : null;

    return {
      rank: userEntry.rank,
      weeklyScore: userEntry.weeklyScore,
      isInTop100: true,
      nextRank: nextRankEntry ? nextRankEntry.rank : null,
      pointsToNext,
      topThree: userEntry.rank <= 3,
    };
  } catch (error) {
    console.error("Error getting user rank info:", error);
    return { rank: null, weeklyScore: 0, isInTop100: false };
  }
};

// Get leaderboard filtered by friends only
export const getFriendLeaderboard = async (userId) => {
  try {
    const db = getDatabase();

    const userRef = ref(db, `users/${userId}/friends`);
    const friendsSnapshot = await get(userRef);

    if (!friendsSnapshot.exists()) return [];

    const friends = friendsSnapshot.val() || [];
    const friendIds = friends.map((f) => f.userId);
    friendIds.push(userId);

    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) return [];

    const friendLeaderboard = [];

    usersSnapshot.forEach((childSnapshot) => {
      const uid = childSnapshot.key;
      if (friendIds.includes(uid)) {
        const userData = childSnapshot.val();
        friendLeaderboard.push({
          userId: uid,
          displayName: userData.displayName || "Unknown",
          weeklyScore: userData.weeklyScore || 0,
          level: userData.level || 1,
        });
      }
    });

    friendLeaderboard.sort((a, b) => b.weeklyScore - a.weeklyScore);
    return friendLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error getting friend leaderboard:", error);
    return [];
  }
};

// Get week number and year for a timestamp
export const getWeekInfo = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return { week: weekNumber, year: date.getFullYear(), timestamp };
};

// Save weekly results to history
export const saveWeeklyResults = async (winners) => {
  try {
    const db = getDatabase();
    const weekInfo = getWeekInfo();
    const weekKey = `week${weekInfo.week}-${weekInfo.year}`;

    await set(ref(db, `leaderboard/history/${weekKey}`), {
      week: weekInfo.week,
      year: weekInfo.year,
      endedAt: Date.now(),
      winners: winners.map((w) => ({
        userId: w.userId,
        displayName: w.displayName,
        rank: w.rank,
        weeklyScore: w.weeklyScore,
      })),
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving weekly results:", error);
    return { success: false, error };
  }
};

// Main reset function - call every Monday at 00:00
export const performWeeklyReset = async () => {
  try {
    console.log("🔄 Starting weekly leaderboard reset...");

    const db = getDatabase();
    const leaderboard = await getWeeklyLeaderboard(100);
    const winners = leaderboard.slice(0, 3).map((entry) => ({
      userId: entry.userId,
      displayName: entry.displayName,
      rank: entry.rank,
      weeklyScore: entry.weeklyScore,
    }));

    await saveWeeklyResults(winners);

    for (const winner of winners) {
      await assignSpecialCar(winner.userId, winner.rank);
      console.log(
        `🏆 Awarded ${winner.displayName} with rank ${winner.rank} special car`,
      );
    }

    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);

    if (usersSnapshot.exists()) {
      const updates = {};
      usersSnapshot.forEach((childSnapshot) => {
        updates[`users/${childSnapshot.key}/weeklyScore`] = 0;
      });
      await update(ref(db), updates);
    }

    await set(ref(db, "leaderboard/lastReset"), {
      timestamp: Date.now(),
      weekInfo: getWeekInfo(),
    });

    console.log("✅ Weekly reset complete!");
    console.log(`🥇 Winners: ${winners.map((w) => w.displayName).join(", ")}`);

    return { success: true, winners, resetAt: Date.now() };
  } catch (error) {
    console.error("❌ Error during weekly reset:", error);
    return { success: false, error };
  }
};

// Get time until next Monday 00:00
export const getTimeUntilNextReset = () => {
  const now = new Date();
  const nextMonday = new Date();

  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  const diffMs = nextMonday - now;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes, totalMs: diffMs, nextResetDate: nextMonday };
};

// Get last reset info
export const getLastResetInfo = async () => {
  try {
    const db = getDatabase();
    const resetRef = ref(db, "leaderboard/lastReset");
    const snapshot = await get(resetRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error getting last reset info:", error);
    return null;
  }
};

// Get weekly history (past winners)
export const getWeeklyHistory = async (week, year) => {
  try {
    const db = getDatabase();
    const weekKey = week && year ? `week${week}-${year}` : null;

    if (weekKey) {
      const historyRef = ref(db, `leaderboard/history/${weekKey}`);
      const snapshot = await get(historyRef);
      return snapshot.exists() ? snapshot.val() : null;
    } else {
      const historyRef = ref(db, "leaderboard/history");
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) return [];

      const history = [];
      snapshot.forEach((child) => {
        history.push({ weekKey: child.key, ...child.val() });
      });

      history.sort((a, b) => b.endedAt - a.endedAt);
      return history;
    }
  } catch (error) {
    console.error("Error getting weekly history:", error);
    return [];
  }
};

// Get user's weekly history (past awards)
export const getUserWeeklyHistory = async (userId) => {
  try {
    const db = getDatabase();
    const historyRef = ref(db, "leaderboard/history");
    const snapshot = await get(historyRef);

    if (!snapshot.exists()) return [];

    const userHistory = [];

    snapshot.forEach((weekSnapshot) => {
      const weekData = weekSnapshot.val();
      const weekKey = weekSnapshot.key;
      const userWinner = weekData.winners?.find((w) => w.userId === userId);

      if (userWinner) {
        userHistory.push({
          weekKey,
          week: weekData.week,
          year: weekData.year,
          endedAt: weekData.endedAt,
          rank: userWinner.rank,
          weeklyScore: userWinner.weeklyScore,
        });
      }
    });

    userHistory.sort((a, b) => b.endedAt - a.endedAt);
    return userHistory;
  } catch (error) {
    console.error("Error getting user weekly history:", error);
    return [];
  }
};
