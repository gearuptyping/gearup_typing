// MessageBadge.js - Shows number of unread messages in navbar
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUnreadCount } from "../services/messaging";
import "./MessageBadge.css";

const MessageBadge = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for unread message count
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getUnreadCount(userId, (count) => {
      setUnreadCount(count);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle click - navigate to messages page
  const handleClick = () => {
    navigate("/messages");
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
