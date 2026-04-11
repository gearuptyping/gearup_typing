// friendService.js - Friend request system for sending, accepting, declining, and managing friends
import { database } from "../firebase";
import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";

// Send friend request by display name
export const sendFriendRequest = async (
  fromUserId,
  fromUserName,
  toUserDisplayName,
) => {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    let toUserId = null;
    let toUserData = null;

    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (
        userData.displayName &&
        userData.displayName.toLowerCase() === toUserDisplayName.toLowerCase()
      ) {
        toUserId = childSnapshot.key;
        toUserData = userData;
      }
    });

    if (!toUserId) {
      return { success: false, error: "User not found" };
    }

    if (toUserId === fromUserId) {
      return { success: false, error: "You cannot add yourself" };
    }

    const fromUserRef = ref(database, `users/${fromUserId}/friends`);
    const fromUserSnapshot = await get(fromUserRef);
    const fromUserFriends = fromUserSnapshot.val() || [];

    if (fromUserFriends.some((f) => f.userId === toUserId)) {
      return { success: false, error: "Already friends" };
    }

    const requestsRef = ref(database, "friendRequests");
    const requestsSnapshot = await get(requestsRef);
    let requestExists = false;

    if (requestsSnapshot.exists()) {
      requestsSnapshot.forEach((child) => {
        const req = child.val();
        if (
          req.from === fromUserId &&
          req.to === toUserId &&
          req.status === "pending"
        ) {
          requestExists = true;
        }
      });
    }

    if (requestExists) {
      return { success: false, error: "Friend request already sent" };
    }

    const newRequestRef = push(ref(database, "friendRequests"));
    await set(newRequestRef, {
      from: fromUserId,
      fromName: fromUserName,
      to: toUserId,
      toName: toUserData.displayName,
      status: "pending",
      timestamp: Date.now(),
    });

    return { success: true, requestId: newRequestRef.key };
  } catch (error) {
    console.error("Error sending friend request:", error);
    return { success: false, error: error.message };
  }
};

// Get pending friend requests received by user
export const getPendingRequests = (userId, callback) => {
  const requestsRef = ref(database, "friendRequests");
  const requestsQuery = query(requestsRef, orderByChild("to"), equalTo(userId));

  return onValue(requestsQuery, (snapshot) => {
    const requests = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const req = child.val();
        if (req.status === "pending") {
          requests.push({
            id: child.key,
            ...req,
          });
        }
      });
    }
    callback(requests);
  });
};

// Get sent friend requests from user
export const getSentRequests = (userId, callback) => {
  const requestsRef = ref(database, "friendRequests");
  const requestsQuery = query(
    requestsRef,
    orderByChild("from"),
    equalTo(userId),
  );

  return onValue(requestsQuery, (snapshot) => {
    const requests = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const req = child.val();
        if (req.status === "pending") {
          requests.push({
            id: child.key,
            ...req,
          });
        }
      });
    }
    callback(requests);
  });
};

// Accept friend request and add to both friends lists
export const acceptFriendRequest = async (requestId, fromUserId, toUserId) => {
  try {
    const requestRef = ref(database, `friendRequests/${requestId}`);
    await update(requestRef, { status: "accepted" });

    const timestamp = new Date().toISOString();

    const fromUserRef = ref(database, `users/${fromUserId}/displayName`);
    const toUserRef = ref(database, `users/${toUserId}/displayName`);

    const [fromNameSnap, toNameSnap] = await Promise.all([
      get(fromUserRef),
      get(toUserRef),
    ]);

    const fromName = fromNameSnap.val();
    const toName = toNameSnap.val();

    const toUserFriendsRef = ref(database, `users/${toUserId}/friends`);
    const toUserSnapshot = await get(toUserFriendsRef);
    const toUserFriends = toUserSnapshot.val() || [];
    toUserFriends.push({
      userId: fromUserId,
      displayName: fromName,
      addedAt: timestamp,
    });
    await set(toUserFriendsRef, toUserFriends);

    const fromUserFriendsRef = ref(database, `users/${fromUserId}/friends`);
    const fromUserSnapshot = await get(fromUserFriendsRef);
    const fromUserFriends = fromUserSnapshot.val() || [];
    fromUserFriends.push({
      userId: toUserId,
      displayName: toName,
      addedAt: timestamp,
    });
    await set(fromUserFriendsRef, fromUserFriends);

    return { success: true };
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return { success: false, error: error.message };
  }
};

// Decline friend request
export const declineFriendRequest = async (requestId) => {
  try {
    const requestRef = ref(database, `friendRequests/${requestId}`);
    await update(requestRef, { status: "declined" });
    return { success: true };
  } catch (error) {
    console.error("Error declining friend request:", error);
    return { success: false, error: error.message };
  }
};

// Remove friend from both users' lists
export const removeFriend = async (userId, friendId) => {
  try {
    const userRef = ref(database, `users/${userId}/friends`);
    const userSnapshot = await get(userRef);
    const userFriends = userSnapshot.val() || [];
    const updatedUserFriends = userFriends.filter((f) => f.userId !== friendId);
    await set(userRef, updatedUserFriends);

    const friendRef = ref(database, `users/${friendId}/friends`);
    const friendSnapshot = await get(friendRef);
    const friendFriends = friendSnapshot.val() || [];
    const updatedFriendFriends = friendFriends.filter(
      (f) => f.userId !== userId,
    );
    await set(friendRef, updatedFriendFriends);

    return { success: true };
  } catch (error) {
    console.error("Error removing friend:", error);
    return { success: false, error: error.message };
  }
};

// Search users by display name
export const searchUsers = async (searchTerm, excludeUserId = null) => {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    const results = [];

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const userId = child.key;
        const userData = child.val();

        if (excludeUserId && userId === excludeUserId) return;

        if (
          userData.displayName &&
          userData.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({
            userId: userId,
            displayName: userData.displayName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=41588a&color=fff&bold=true`,
          });
        }
      });
    }

    return results
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, 10);
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

// Check if two users are friends
export const areFriends = async (userId1, userId2) => {
  try {
    const userRef = ref(database, `users/${userId1}/friends`);
    const snapshot = await get(userRef);
    const friends = snapshot.val() || [];
    return friends.some((f) => f.userId === userId2);
  } catch (error) {
    console.error("Error checking friendship:", error);
    return false;
  }
};

// Get friend suggestions (random users not already friends)
export const getFriendSuggestions = async (userId, limit = 5) => {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    const suggestions = [];

    const userRef = ref(database, `users/${userId}/friends`);
    const userSnapshot = await get(userRef);
    const userFriends = userSnapshot.val() || [];
    const friendIds = userFriends.map((f) => f.userId);

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const suggestionId = child.key;
        const userData = child.val();

        if (suggestionId === userId) return;
        if (friendIds.includes(suggestionId)) return;

        suggestions.push({
          userId: suggestionId,
          displayName: userData.displayName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=41588a&color=fff&bold=true`,
        });
      });
    }

    return suggestions.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch (error) {
    console.error("Error getting friend suggestions:", error);
    return [];
  }
};
