// presence.js - Firebase presence service for tracking online/offline status of users
import { database } from "../firebase";
import { ref, onValue, set, onDisconnect, get } from "firebase/database";

// Initialize user presence tracking (call when user logs in)
export const initPresence = (userId, username) => {
  if (!userId) return;

  const userStatusRef = ref(database, `/status/${userId}`);
  const connectedRef = ref(database, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      set(userStatusRef, {
        state: "online",
        lastOnline: new Date().toISOString(),
        username: username,
      });

      onDisconnect(userStatusRef).set({
        state: "offline",
        lastOnline: new Date().toISOString(),
        username: username,
      });
    }
  });
};

// Get number of online users (real-time)
export const getOnlineUsersCount = (callback) => {
  const statusRef = ref(database, "/status");

  return onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const onlineCount = Object.values(data).filter(
        (user) => user.state === "online",
      ).length;
      callback(onlineCount);
    } else {
      callback(0);
    }
  });
};

// Get specific user's status (real-time)
export const getUserStatus = (userId, callback) => {
  const userStatusRef = ref(database, `/status/${userId}`);
  return onValue(userStatusRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// Get status for multiple friends at once (one-time)
export const getFriendsStatus = (friendIds, callback) => {
  if (!friendIds || friendIds.length === 0) {
    callback({});
    return;
  }

  const statuses = {};
  let completed = 0;

  friendIds.forEach((friendId) => {
    const statusRef = ref(database, `/status/${friendId}`);

    onValue(
      statusRef,
      (snapshot) => {
        statuses[friendId] = snapshot.val();
        completed++;
        if (completed === friendIds.length) {
          callback(statuses);
        }
      },
      { onlyOnce: true },
    );
  });
};

// Get real-time status for multiple friends (returns unsubscribe function)
export const getFriendsStatusRealtime = (friendIds, callback) => {
  if (!friendIds || friendIds.length === 0) {
    callback({});
    return () => {};
  }

  const statuses = {};
  const unsubscribes = [];

  friendIds.forEach((friendId) => {
    const statusRef = ref(database, `/status/${friendId}`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      statuses[friendId] = snapshot.val();
      callback({ ...statuses });
    });

    unsubscribes.push(unsubscribe);
  });

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
};

// Format last seen timestamp to human-readable string
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Never";

  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

  return lastSeen.toLocaleDateString();
};

// Quick check if a user is online
export const isUserOnline = async (userId) => {
  try {
    const statusRef = ref(database, `/status/${userId}/state`);
    const snapshot = await get(statusRef);
    return snapshot.val() === "online";
  } catch (error) {
    console.error("Error checking user status:", error);
    return false;
  }
};

// Get just the last seen timestamp
export const getUserLastSeen = async (userId) => {
  try {
    const lastSeenRef = ref(database, `/status/${userId}/lastOnline`);
    const snapshot = await get(lastSeenRef);
    return snapshot.val();
  } catch (error) {
    console.error("Error getting last seen:", error);
    return null;
  }
};
