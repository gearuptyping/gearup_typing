// BlockedUsers.js - View and manage users you've blocked
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBlockedUsers, unblockUser } from "../services/reportService";
import "./BlockedUsers.css";

const BlockedUsers = ({ user }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null);
  const navigate = useNavigate();

  // Load blocked users list
  useEffect(() => {
    if (!user) return;

    const unsubscribe = getBlockedUsers(user.uid, (users) => {
      setBlockedUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle unblock user
  const handleUnblock = async (blockedUserId) => {
    if (!window.confirm("Are you sure you want to unblock this user?")) return;

    setUnblocking(blockedUserId);
    const result = await unblockUser(user.uid, blockedUserId);
    setUnblocking(null);

    if (result.success) {
      setBlockedUsers(blockedUsers.filter((u) => u.userId !== blockedUserId));
    } else {
      alert("Failed to unblock user: " + result.error);
    }
  };

  // Format blocked date
  const formatBlockedDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="blocked-loading">
        <div className="loading-spinner"></div>
        <p>Loading blocked users...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="blocked-container">
      {/* Header */}
      <div className="blocked-header">
        <button className="back-btn" onClick={() => navigate("/account")}>
          ← BACK
        </button>
        <h1>BLOCKED USERS</h1>
        <p className="blocked-count">{blockedUsers.length} blocked</p>
      </div>

      {/* Blocked Users List */}
      <div className="blocked-list">
        {blockedUsers.length === 0 ? (
          <div className="no-blocked">
            <div className="empty-icon">🔓</div>
            <h3>No blocked users</h3>
            <p>When you block someone, they'll appear here</p>
            <button
              className="goto-account-btn"
              onClick={() => navigate("/account")}
            >
              GO TO ACCOUNT
            </button>
          </div>
        ) : (
          blockedUsers.map((blockedUser) => (
            <div key={blockedUser.userId} className="blocked-card">
              <div className="blocked-user-info">
                <div className="blocked-avatar">
                  {blockedUser.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="blocked-details">
                  <span className="blocked-name">
                    {blockedUser.displayName}
                  </span>
                  <span className="blocked-date">
                    Blocked on {formatBlockedDate(blockedUser.blockedAt)}
                  </span>
                </div>
              </div>
              <button
                className="unblock-btn"
                onClick={() => handleUnblock(blockedUser.userId)}
                disabled={unblocking === blockedUser.userId}
              >
                {unblocking === blockedUser.userId ? "..." : "UNBLOCK"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlockedUsers;
