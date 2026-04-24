// MessageBadge.js - Shows number of unread private messages from friends in navbar
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTotalUnreadFriendMessages } from "../services/chatService";
import "./MessageBadge.css";

const MessageBadge = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for unread message count from private friend chat
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getTotalUnreadFriendMessages(userId, (count) => {
      setUnreadCount(count);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle click - navigate to Account page (where friend chat is)
  const handleClick = () => {
    navigate("/account");
  };

  // Don't show anything if no unread messages
  if (loading || unreadCount === 0) {
    return null;
  }

  return (
    <button
      className="message-badge"
      onClick={handleClick}
      title={`${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`}
    >
      <span className="badge-icon">💬</span>
      <span className="badge-count">{unreadCount}</span>
    </button>
  );
};

export default MessageBadge;
