// OnlineStatus.js - Shows green dot for online users with real-time Firebase presence
import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import "./OnlineStatus.css";

const OnlineStatus = ({
  userId,
  showLastSeen = false,
  showDot = true,
  showText = false,
  className = "",
}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's online status in Firebase
  useEffect(() => {
    if (!userId) return;

    const statusRef = ref(database, `/status/${userId}`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.val());
      } else {
        setStatus({
          state: "offline",
          lastOnline: null,
          username: "Unknown",
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Format last seen time to human-readable string
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Never";

    const lastSeen = new Date(timestamp);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

    return lastSeen.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <span className={`online-status-container ${className}`}>
        {showDot && <span className="status-dot loading" />}
        {showText && <span className="status-text">Loading...</span>}
      </span>
    );
  }

  const isOnline = status?.state === "online";

  return (
    <div className={`online-status-container ${className}`}>
      {/* Status Dot */}
      {showDot && (
        <span
          className={`status-dot ${isOnline ? "online" : "offline"}`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}

      {/* Online/Offline Text */}
      {showText && (
        <span className="status-text">{isOnline ? "Online" : "Offline"}</span>
      )}

      {/* Last Seen Text */}
      {showLastSeen && !isOnline && status?.lastOnline && (
        <span className="last-seen">
          Last seen {formatLastSeen(status.lastOnline)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
