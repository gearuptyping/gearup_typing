// userUtils.js - Helper functions for getting user display names
import { database } from "../firebase";
import { ref, get } from "firebase/database";

// Fetch user's display name from Firebase asynchronously
export const getUserDisplayName = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}/displayName`);
    const snapshot = await get(userRef);
    return snapshot.val() || "Player";
  } catch (error) {
    console.error("Error fetching display name:", error);
    return "Player";
  }
};

// Get display name synchronously from available data
// Priority: userData.displayName → user.displayName → user.email → "Player"
export const getDisplayNameSync = (user, userData) => {
  if (userData?.displayName) return userData.displayName;
  if (user?.displayName) return user.displayName;
  if (user?.email) return user.email.split("@")[0];
  return "Player";
};
