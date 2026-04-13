// AdminBans.js - Ban management page for admins to view, unban, and manage banned users
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "./AdminBans.css";
import {
  getBannedUsers,
  unbanUser,
  getCurrentUserAdminStatus,
  getUserWarnings,
} from "../services/adminService";

const AdminBans = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [filteredBans, setFilteredBans] = useState([]);
  const [selectedBan, setSelectedBan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userWarnings, setUserWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);

  // Check admin status and load bans on mount
  useEffect(() => {
    checkAdminAndLoadBans();
  }, []);

  // Filter bans when search or filter changes
  useEffect(() => {
    filterBans();
  }, [bannedUsers, filterDuration, searchTerm]);

  // Verify admin status and load data
  const checkAdminAndLoadBans = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const adminStatus = await getCurrentUserAdminStatus();
      if (!adminStatus) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadBannedUsers();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Load all banned users from database
  const loadBannedUsers = async () => {
    try {
      const bans = await getBannedUsers();
      setBannedUsers(bans);
    } catch (error) {
      console.error("Error loading banned users:", error);
    }
  };

  // Filter bans by search term and duration
  const filterBans = () => {
    let filtered = [...bannedUsers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ban) =>
          ban.userData?.displayName?.toLowerCase().includes(term) ||
          ban.userData?.email?.toLowerCase().includes(term) ||
          ban.reason?.toLowerCase().includes(term),
      );
    }

    if (filterDuration !== "all") {
      filtered = filtered.filter((ban) => ban.duration === filterDuration);
    }

    setFilteredBans(filtered);
  };

  // View ban details modal
  const handleViewBan = async (ban) => {
    try {
      setActionLoading(true);
      setSelectedBan(ban);

      if (ban.userId) {
        const warnings = await getUserWarnings(ban.userId);
        setUserWarnings(warnings);
      }

      setShowModal(true);
    } catch (error) {
      console.error("Error loading ban details:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Unban user and refresh list
  const handleUnban = async () => {
    if (!selectedBan) return;

    try {
      setActionLoading(true);
      await unbanUser(selectedBan.userId);
      await loadBannedUsers();
      setShowConfirmModal(false);
      setShowModal(false);
      setSelectedBan(null);
    } catch (error) {
      console.error("Error unbanning user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Calculate time remaining on temporary ban
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return "Permanent";

    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) return "Expired";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} remaining`;
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    }
  };

  // Get CSS class for duration badge
  const getDurationBadgeClass = (duration) => {
    switch (duration) {
      case "permanent":
        return "badge-permanent";
      case "1day":
      case "3days":
      case "1week":
        return "badge-temp";
      default:
        return "";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading banned users...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="admin-bans">
      {/* Header */}
      <div className="bans-header">
        <div>
          <h1>Ban Management</h1>
          <p>View and manage banned users</p>
        </div>
        <button className="refresh-btn" onClick={loadBannedUsers}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
          >
            <option value="all">All Durations</option>
            <option value="1day">1 Day</option>
            <option value="3days">3 Days</option>
            <option value="1week">1 Week</option>
            <option value="permanent">Permanent</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bans-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Bans</h3>
            <p className="stat-number">{bannedUsers.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Temporary</h3>
            <p className="stat-number">
              {bannedUsers.filter((b) => b.duration !== "permanent").length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <h3>Permanent</h3>
            <p className="stat-number">
              {bannedUsers.filter((b) => b.duration === "permanent").length}
            </p>
          </div>
        </div>
      </div>

      {/* Bans Table */}
      <div className="bans-table-container">
        <table className="bans-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Reason</th>
              <th>Banned By</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBans.length > 0 ? (
              filteredBans.map((ban) => (
                <tr key={ban.userId}>
                  <td className="user-cell">
                    <div className="user-avatar-small">
                      {ban.userData?.displayName?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                    <span>{ban.userData?.displayName || "Unknown"}</span>
                  </td>
                  <td>{ban.userData?.email || "N/A"}</td>
                  <td className="reason-cell">{ban.reason}</td>
                  <td>{ban.bannedBy || "System"}</td>
                  <td>{formatDate(ban.bannedAt)}</td>
                  <td>
                    <span
                      className={`duration-badge ${getDurationBadgeClass(ban.duration)}`}
                    >
                      {ban.duration === "permanent"
                        ? "Permanent"
                        : ban.duration === "1day"
                          ? "1 Day"
                          : ban.duration === "3days"
                            ? "3 Days"
                            : "1 Week"}
                    </span>
                  </td>
                  <td>
                    {ban.expiresAt ? (
                      ban.expiresAt < Date.now() ? (
                        <span className="status-badge expired">Expired</span>
                      ) : (
                        <span className="status-badge active">Active</span>
                      )
                    ) : (
                      <span className="status-badge permanent">Permanent</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewBan(ban)}
                      disabled={actionLoading}
                    >
                      View
                    </button>
                    {ban.expiresAt && ban.expiresAt < Date.now() ? (
                      <button
                        className="remove-btn"
                        onClick={() => {
                          setSelectedBan(ban);
                          setShowConfirmModal(true);
                        }}
                        disabled={actionLoading}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        className="unban-btn-small"
                        onClick={() => {
                          setSelectedBan(ban);
                          setShowConfirmModal(true);
                        }}
                        disabled={actionLoading}
                      >
                        Unban
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">
                  No banned users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ban Details Modal */}
      {showModal && selectedBan && (
        <div className="modal-overlay">
          <div className="modal-content ban-modal">
            <div className="modal-header">
              <h2>Ban Details</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBan(null);
                  setShowWarnings(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* User Info */}
              <div className="user-info-section">
                <div className="user-avatar-large">
                  {selectedBan.userData?.displayName?.charAt(0).toUpperCase() ||
                    "?"}
                </div>
                <div className="user-details">
                  <h3>{selectedBan.userData?.displayName || "Unknown User"}</h3>
                  <p>{selectedBan.userData?.email || "No email"}</p>
                  <p className="user-id">ID: {selectedBan.userId}</p>
                </div>
              </div>

              {/* Ban Info Grid */}
              <div className="ban-info-grid">
                <div className="info-card">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <h4>Ban Date</h4>
                    <p>{formatDate(selectedBan.bannedAt)}</p>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">⏱️</div>
                  <div className="info-content">
                    <h4>Duration</h4>
                    <p className={selectedBan.duration}>
                      {selectedBan.duration === "permanent"
                        ? "Permanent"
                        : selectedBan.duration === "1day"
                          ? "1 Day"
                          : selectedBan.duration === "3days"
                            ? "3 Days"
                            : "1 Week"}
                    </p>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">⌛</div>
                  <div className="info-content">
                    <h4>Time Remaining</h4>
                    <p>{getTimeRemaining(selectedBan.expiresAt)}</p>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">👮</div>
                  <div className="info-content">
                    <h4>Banned By</h4>
                    <p>{selectedBan.bannedBy || "System"}</p>
                  </div>
                </div>
              </div>

              {/* Ban Reason */}
              <div className="ban-reason-section">
                <h3>Ban Reason</h3>
                <div className="reason-box">
                  <p>{selectedBan.reason}</p>
                </div>
              </div>

              {/* User Warnings Toggle */}
              <div className="warnings-section">
                <button
                  className="toggle-warnings-btn"
                  onClick={() => setShowWarnings(!showWarnings)}
                >
                  {showWarnings
                    ? "Hide Warning History"
                    : "Show Warning History"}
                  ({userWarnings.length})
                </button>

                {showWarnings && (
                  <div className="warnings-list">
                    {userWarnings.length > 0 ? (
                      userWarnings.map((warning) => (
                        <div key={warning.id} className="warning-item">
                          <div className="warning-header">
                            <span className="warning-id">
                              #{warning.id.slice(-6)}
                            </span>
                            <span
                              className={`warning-status ${warning.status}`}
                            >
                              {warning.status}
                            </span>
                          </div>
                          <p className="warning-reason">{warning.reason}</p>
                          <p className="warning-date">
                            Issued: {formatDate(warning.issuedAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="no-warnings">
                        No warning history for this user
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {selectedBan.userData && (
                <div className="additional-info">
                  <h3>User Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Level</span>
                      <span className="stat-value">
                        {selectedBan.userData.level || 1}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Score</span>
                      <span className="stat-value">
                        {selectedBan.userData.totalScore || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Games Played</span>
                      <span className="stat-value">
                        {selectedBan.userData.gamesPlayed || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Account Age</span>
                      <span className="stat-value">
                        {selectedBan.userData.createdAt
                          ? Math.floor(
                              (Date.now() - selectedBan.userData.createdAt) /
                                (1000 * 60 * 60 * 24),
                            ) + " days"
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBan(null);
                }}
              >
                Close
              </button>
              <button
                className="unban-btn"
                onClick={() => setShowConfirmModal(true)}
                disabled={actionLoading}
              >
                {selectedBan.expiresAt && selectedBan.expiresAt < Date.now()
                  ? "Remove from Ban List"
                  : "Unban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Unban Modal */}
      {showConfirmModal && selectedBan && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h2>Confirm Action</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  if (!showModal) setSelectedBan(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-icon">⚠️</div>
              <h3>Are you sure?</h3>
              <p>
                {selectedBan.expiresAt && selectedBan.expiresAt < Date.now()
                  ? `This will remove ${selectedBan.userData?.displayName || "this user"} from the ban list.`
                  : `This will unban ${selectedBan.userData?.displayName || "this user"} and restore their access to the game.`}
              </p>
              {selectedBan.duration === "permanent" && (
                <p className="warning-text">
                  This is a permanent ban. Please ensure you want to reverse
                  this decision.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleUnban}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBans;
