// FriendChat.jsx - Chat component for private messaging with friends
import React, { useState, useEffect, useRef } from "react";
import {
  sendFriendMessage,
  getFriendMessages,
  markFriendMessagesAsRead,
  getUserDisplayName,
} from "../services/chatService";
import "./FriendChat.css";

const FriendChat = ({ currentUserId, friend, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [friendName, setFriendName] = useState(friend.displayName || "Friend");
  const [charCount, setCharCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Max characters per message
  const MAX_CHARS = 250;

  // Fetch friend's display name if not provided
  useEffect(() => {
    const fetchFriendName = async () => {
      if (!friend.displayName) {
        const name = await getUserDisplayName(friend.userId);
        setFriendName(name);
      }
    };
    fetchFriendName();
  }, [friend]);

  // Load messages and mark as read
  useEffect(() => {
    if (!currentUserId || !friend.userId) return;

    const unsubscribe = getFriendMessages(
      currentUserId,
      friend.userId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        setLoading(false);

        // Mark messages as read after loading
        markFriendMessagesAsRead(currentUserId, friend.userId);

        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      },
    );

    return () => unsubscribe();
  }, [currentUserId, friend.userId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle message input change with character limit
  const handleMessageChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setNewMessage(text);
      setCharCount(text.length);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;
    if (newMessage.trim().length > MAX_CHARS) {
      alert(`Message cannot exceed ${MAX_CHARS} characters`);
      return;
    }

    setSending(true);
    const result = await sendFriendMessage(
      currentUserId,
      friend.userId,
      newMessage,
    );

    if (result.success) {
      setNewMessage("");
      setCharCount(0);
      // Message will appear via real-time listener
    } else {
      alert(result.error || "Failed to send message");
    }

    setSending(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: currentDate,
          messages: [message],
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  // Format date header
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <h3>
            <span className="chat-friend-avatar">
              {friendName.charAt(0).toUpperCase()}
            </span>
            {friendName}
          </h3>
          <button className="chat-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-messages-container">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner-small"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <span className="no-messages-icon">💬</span>
              <p>No messages yet</p>
              <p className="no-messages-sub">
                Send a message to start chatting!
              </p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="message-group">
                <div className="message-date-header">
                  <span>{formatDateHeader(group.date)}</span>
                </div>
                {group.messages.map((message) => {
                  const isOwnMessage = message.from === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`chat-message-bubble ${isOwnMessage ? "sent" : "received"}`}
                    >
                      <div className="chat-message-text">{message.text}</div>
                      <div className="chat-message-time">
                        {formatTime(message.timestamp)}
                        {isOwnMessage && (
                          <span className="message-read-status">
                            {message.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-container" onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder={`Message ${friendName}...`}
              maxLength={MAX_CHARS}
              disabled={sending}
            />
            <div className="char-counter">
              {charCount}/{MAX_CHARS}
            </div>
          </div>
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? "..." : "SEND"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FriendChat;
