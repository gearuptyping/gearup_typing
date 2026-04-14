// chatService.js - Service for private friend chat (250 char limit, 50 message history)
import { database } from "../firebase";
import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
  onValue,
  update,
} from "firebase/database";

// Get conversation ID between two users (sorted for consistency)
export const getConversationId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

// Send a message to a friend (250 character limit)
export const sendFriendMessage = async (fromUserId, toUserId, messageText) => {
  try {
    // Trim and validate message
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) {
      return { success: false, error: "Message cannot be empty" };
    }

    if (trimmedMessage.length > 250) {
      return { success: false, error: "Message exceeds 250 character limit" };
    }

    const conversationId = getConversationId(fromUserId, toUserId);
    const messagesRef = ref(database, `friendChats/${conversationId}/messages`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      from: fromUserId,
      to: toUserId,
      text: trimmedMessage,
      timestamp: Date.now(),
      read: false,
    };

    await set(newMessageRef, messageData);

    // Update last message info for both users
    const conversationRef = ref(database, `friendChats/${conversationId}/info`);
    await set(conversationRef, {
      lastMessage: trimmedMessage,
      lastMessageTime: Date.now(),
      lastMessageSender: fromUserId,
      lastMessageSenderName: null, // Will be updated separately if needed
    });

    // Update unread count for receiver
    const userConversationRef = ref(
      database,
      `friendChatsUsers/${toUserId}/${conversationId}`,
    );
    const snapshot = await get(userConversationRef);
    const currentUnread = snapshot.exists()
      ? snapshot.val().unreadCount || 0
      : 0;

    await set(userConversationRef, {
      withUserId: fromUserId,
      lastMessage: trimmedMessage,
      lastMessageTime: Date.now(),
      unreadCount: currentUnread + 1,
    });

    // Update sender's last message info (no unread count)
    const senderConversationRef = ref(
      database,
      `friendChatsUsers/${fromUserId}/${conversationId}`,
    );
    await set(senderConversationRef, {
      withUserId: toUserId,
      lastMessage: trimmedMessage,
      lastMessageTime: Date.now(),
      unreadCount: 0,
    });

    return { success: true, messageId: newMessageRef.key };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
};

// Get messages for a conversation (last 50 messages only - saves space)
export const getFriendMessages = (userId1, userId2, callback, limit = 50) => {
  const conversationId = getConversationId(userId1, userId2);
  const messagesRef = ref(database, `friendChats/${conversationId}/messages`);
  const messagesQuery = query(
    messagesRef,
    orderByChild("timestamp"),
    limitToLast(limit),
  );

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        messages.push({
          id: child.key,
          ...child.val(),
        });
      });
    }
    // Sort by timestamp ascending (oldest first)
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });

  return unsubscribe;
};

// Mark messages as read for a user
export const markFriendMessagesAsRead = async (userId, otherUserId) => {
  try {
    const conversationId = getConversationId(userId, otherUserId);

    // Reset unread count
    const userConvRef = ref(
      database,
      `friendChatsUsers/${userId}/${conversationId}`,
    );
    await update(userConvRef, { unreadCount: 0 });

    // Mark individual messages as read
    const messagesRef = ref(database, `friendChats/${conversationId}/messages`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach((child) => {
        const message = child.val();
        if (message.to === userId && !message.read) {
          updates[`friendChats/${conversationId}/messages/${child.key}/read`] =
            true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return { success: false, error: error.message };
  }
};

// Get unread message count for a user from all conversations
export const getTotalUnreadFriendMessages = (userId, callback) => {
  const userChatsRef = ref(database, `friendChatsUsers/${userId}`);

  const unsubscribe = onValue(userChatsRef, (snapshot) => {
    let totalUnread = 0;
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        totalUnread += child.val().unreadCount || 0;
      });
    }
    callback(totalUnread);
  });

  return unsubscribe;
};

// Get all conversations for a user (list of friends they've chatted with)
export const getUserConversations = (userId, callback) => {
  const userChatsRef = ref(database, `friendChatsUsers/${userId}`);

  const unsubscribe = onValue(userChatsRef, async (snapshot) => {
    const conversations = [];

    if (snapshot.exists()) {
      const promises = [];

      snapshot.forEach((child) => {
        const convData = child.val();
        const conversationId = child.key;

        // Fetch friend's display name
        const promise = get(
          ref(database, `users/${convData.withUserId}/displayName`),
        ).then((userSnap) => ({
          conversationId: conversationId,
          withUserId: convData.withUserId,
          withUserName: userSnap.val() || "Unknown User",
          lastMessage: convData.lastMessage,
          lastMessageTime: convData.lastMessageTime,
          unreadCount: convData.unreadCount || 0,
        }));

        promises.push(promise);
      });

      const results = await Promise.all(promises);
      results.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      callback(results);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

// Delete a conversation (clear message history)
export const deleteFriendConversation = async (userId, otherUserId) => {
  try {
    const conversationId = getConversationId(userId, otherUserId);

    // Delete the conversation from both users' lists
    const userConvRef = ref(
      database,
      `friendChatsUsers/${userId}/${conversationId}`,
    );
    const otherUserConvRef = ref(
      database,
      `friendChatsUsers/${otherUserId}/${conversationId}`,
    );

    await set(userConvRef, null);
    await set(otherUserConvRef, null);

    // Optionally delete the actual messages (saves space)
    // Uncomment if you want to completely delete chat history
    // const messagesRef = ref(database, `friendChats/${conversationId}`);
    // await set(messagesRef, null);

    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: error.message };
  }
};

// Clear old messages (optional - to save space, keep only last 50)
export const cleanOldMessages = async (conversationId, keepCount = 50) => {
  try {
    const messagesRef = ref(database, `friendChats/${conversationId}/messages`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
      const messages = [];
      snapshot.forEach((child) => {
        messages.push({ id: child.key, timestamp: child.val().timestamp });
      });

      // Sort by timestamp
      messages.sort((a, b) => b.timestamp - a.timestamp);

      // Delete messages beyond keepCount
      if (messages.length > keepCount) {
        const toDelete = messages.slice(keepCount);
        const updates = {};
        toDelete.forEach((msg) => {
          updates[`friendChats/${conversationId}/messages/${msg.id}`] = null;
        });
        await update(ref(database), updates);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error cleaning old messages:", error);
    return { success: false, error: error.message };
  }
};

// Get display name of a user
export const getUserDisplayName = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}/displayName`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : "Unknown User";
  } catch (error) {
    console.error("Error fetching user name:", error);
    return "Unknown User";
  }
};
