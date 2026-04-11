// messaging.js - Private messaging service for sending, receiving, and managing conversations
import { database } from "../firebase";
import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  update,
} from "firebase/database";

// Get or create a conversation ID between two users (sorted for consistency)
export const getConversationId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Send a new message
export const sendMessage = async (fromUserId, toUserId, messageText) => {
  try {
    if (!messageText.trim())
      return { success: false, error: "Message cannot be empty" };

    const conversationId = getConversationId(fromUserId, toUserId);
    const messagesRef = ref(database, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      from: fromUserId,
      to: toUserId,
      text: messageText,
      timestamp: Date.now(),
      read: false,
    };

    await set(newMessageRef, messageData);

    const timestamp = Date.now();

    const senderConvRef = ref(
      database,
      `conversations/${fromUserId}/${conversationId}`,
    );
    await set(senderConvRef, {
      withUserId: toUserId,
      lastMessage: messageText,
      lastMessageTime: timestamp,
      lastMessageSender: fromUserId,
      unreadCount: 0,
    });

    const receiverConvRef = ref(
      database,
      `conversations/${toUserId}/${conversationId}`,
    );
    const receiverConvSnapshot = await get(receiverConvRef);
    const currentUnread = receiverConvSnapshot.exists()
      ? receiverConvSnapshot.val().unreadCount || 0
      : 0;

    await set(receiverConvRef, {
      withUserId: fromUserId,
      lastMessage: messageText,
      lastMessageTime: timestamp,
      lastMessageSender: fromUserId,
      unreadCount: currentUnread + 1,
    });

    return { success: true, messageId: newMessageRef.key };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
};

// Get messages for a conversation (real-time)
export const getMessages = (userId1, userId2, callback, limit = 50) => {
  const conversationId = getConversationId(userId1, userId2);
  const messagesRef = ref(database, `messages/${conversationId}`);
  const messagesQuery = query(
    messagesRef,
    orderByChild("timestamp"),
    limitToLast(limit),
  );

  return onValue(messagesQuery, (snapshot) => {
    const messages = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        messages.push({
          id: child.key,
          ...child.val(),
        });
      });
    }
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });
};

// Get user's conversations list (real-time)
export const getConversations = (userId, callback) => {
  const conversationsRef = ref(database, `conversations/${userId}`);

  return onValue(conversationsRef, async (snapshot) => {
    const conversations = [];

    if (snapshot.exists()) {
      const conversationPromises = [];

      snapshot.forEach((child) => {
        const convData = child.val();
        const userPromise = get(
          ref(database, `users/${convData.withUserId}/displayName`),
        ).then((userSnap) => ({
          conversationId: child.key,
          ...convData,
          otherUserName: userSnap.val() || "Unknown User",
        }));
        conversationPromises.push(userPromise);
      });

      const results = await Promise.all(conversationPromises);
      results.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      callback(results);
    } else {
      callback([]);
    }
  });
};

// Mark messages as read
export const markMessagesAsRead = async (userId, otherUserId) => {
  try {
    const conversationId = getConversationId(userId, otherUserId);
    const convRef = ref(database, `conversations/${userId}/${conversationId}`);
    await update(convRef, { unreadCount: 0 });

    const messagesRef = ref(database, `messages/${conversationId}`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach((child) => {
        const message = child.val();
        if (message.to === userId && !message.read) {
          updates[`messages/${conversationId}/${child.key}/read`] = true;
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

// Get unread message count for a user
export const getUnreadCount = (userId, callback) => {
  const conversationsRef = ref(database, `conversations/${userId}`);

  return onValue(conversationsRef, (snapshot) => {
    let totalUnread = 0;
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        totalUnread += child.val().unreadCount || 0;
      });
    }
    callback(totalUnread);
  });
};

// Delete a conversation
export const deleteConversation = async (userId, otherUserId) => {
  try {
    const conversationId = getConversationId(userId, otherUserId);
    const userConvRef = ref(
      database,
      `conversations/${userId}/${conversationId}`,
    );
    await set(userConvRef, null);
    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: error.message };
  }
};
