// AdminUsers.js - User management page for admins to view, warn, ban, and manage users
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { database } from "../firebase";
import { ref, onValue, get } from "firebase/database";
import "./AdminUsers.css";
import {
  getAllUsers,
  searchUsers,
  getCurrentUserAdminStatus,
  getUserWarnings,
  getAdminNotes,
  addAdminNote,
  issueWarning,
  banUser,
  unbanUser,
  isUserBanned,
} from "../services/adminService";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [userWarnings, setUserWarnings] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [userBanStatus, setUserBanStatus] = useState(null);

  // Check admin status and load users on mount
  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  // Filter users when search or filter changes
  useEffect(() => {
    filterUsers();
  }, [users, filterStatus, searchTerm]);

  // Real-time listener for online status updates
  useEffect(() => {
    if (!users.length) return;

    const unsubscribes = [];

    users.forEach((user) => {
      const statusRef = ref(database, `/status/${user.uid}/state`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const isOnline = snapshot.val() === "online";
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === user.uid ? { ...u, online: isOnline } : u,
          ),
        );
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [users.length]);

  // Verify admin and load users data
  const checkAdminAndLoadUsers = async () => {
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
      await loadUsers();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Load all users with ban status AND online status
  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();

      const usersWithStatus = await Promise.all(
        allUsers.map(async (user) => {
          const banStatus = await isUserBanned(user.uid);

          // Get online status from presence service
          const statusRef = ref(database, `/status/${user.uid}/state`);
          const statusSnapshot = await get(statusRef);
          const isOnline = statusSnapshot.val() === "online";

          return {
            ...user,
            isBanned: banStatus.banned,
            banInfo: banStatus.banned ? banStatus : null,
            online: isOnline,
          };
        }),
      );

      setUsers(usersWithStatus);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  // Apply search and status filters
  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.uid?.toLowerCase().includes(term),
      );
    }

    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "online":
          filtered = filtered.filter((user) => user.online === true);
          break;
        case "offline":
          filtered = filtered.filter((user) => user.online === false);
          break;
        case "banned":
          filtered = filtered.filter((user) => user.isBanned === true);
          break;
        case "active":
          filtered = filtered.filter((user) => user.isBanned === false);
          break;
        default:
          break;
      }
    }

    setFilteredUsers(filtered);
  };

  // View user details modal
  const handleViewUser = async (user) => {
    try {
      setActionLoading(true);
      setSelectedUser(user);

      const warnings = await getUserWarnings(user.uid);
      setUserWarnings(warnings);

      const notes = await getAdminNotes(user.uid);
      setAdminNotes(notes);

      const banStatus = await isUserBanned(user.uid);
      setUserBanStatus(banStatus);

      setShowModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Add admin note to user
  const handleAddNote = async () => {
    if (!selectedUser || !newNote.trim()) return;

    try {
      setActionLoading(true);
      const auth = getAuth();
      await addAdminNote(
        selectedUser.uid,
        newNote.trim(),
        auth.currentUser.uid,
      );

      const notes = await getAdminNotes(selectedUser.uid);
      setAdminNotes(notes);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Issue warning to user
  const handleIssueWarning = async () => {
    if (!selectedUser || !actionReason) return;

    try {
      setActionLoading(true);
      const auth = getAuth();
      await issueWarning(selectedUser.uid, actionReason, auth.currentUser.uid);

      const warnings = await getUserWarnings(selectedUser.uid);
      setUserWarnings(warnings);

      setShowActionModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error issuing warning:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Ban user with duration
  const handleBanUser = async (duration) => {
    if (!selectedUser || !actionReason) return;

    try {
      setActionLoading(true);
      const auth = getAuth();
      await banUser(
        selectedUser.uid,
        actionReason,
        auth.currentUser.uid,
        duration,
      );

      const banStatus = await isUserBanned(selectedUser.uid);
      setUserBanStatus(banStatus);

      await loadUsers();

      setShowActionModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Unban user
  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await unbanUser(selectedUser.uid);

      setUserBanStatus({ banned: false });
      await loadUsers();
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

  // Calculate level progress percentage
  const getLevelProgress = (user) => {
    if (!user.level) return 0;
    return ((user.level % 5) / 5) * 100;
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="admin-users">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage all users</p>
        </div>
        <button className="refresh-btn" onClick={loadUsers}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="users-grid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              className={`user-card ${user.isBanned ? "banned" : ""}`}
            >
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="user-status">
                  <span
                    className={`status-dot ${user.online ? "online" : "offline"}`}
                  ></span>
                  {user.online ? "Online" : "Offline"}
                </div>
              </div>

              <div className="user-card-body">
                <h3>{user.displayName || "Unknown User"}</h3>
                <p className="user-email">{user.email}</p>

                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-label">Level</span>
                    <span className="stat-value">{user.level || 1}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{user.totalScore || 0}</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getLevelProgress(user)}%` }}
                  ></div>
                </div>

                {user.isBanned && <div className="banned-badge">🚫 Banned</div>}
              </div>

              <div className="user-card-footer">
                <button
                  className="view-user-btn"
                  onClick={() => handleViewUser(user)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content user-modal">
            <div className="modal-header">
              <h2>User Details</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setShowWarnings(false);
                  setShowNotes(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* User Info */}
              <div className="user-profile-header">
                <div className="profile-avatar large">
                  {selectedUser.displayName
                    ? selectedUser.displayName.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="profile-info">
                  <h2>{selectedUser.displayName || "Unknown User"}</h2>
                  <p>{selectedUser.email}</p>
                  <p className="user-id">ID: {selectedUser.uid}</p>
                </div>
                <div className="profile-status">
                  <span
                    className={`status-badge ${selectedUser.online ? "online" : "offline"}`}
                  >
                    {selectedUser.online ? "🟢 Online" : "⚫ Offline"}
                  </span>
                  {userBanStatus?.banned && (
                    <span className="status-badge banned">🚫 Banned</span>
                  )}
                </div>
              </div>

              {/* User Stats Grid */}
              <div className="user-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h4>Level</h4>
                    <p className="stat-value">{selectedUser.level || 1}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <h4>Total Score</h4>
                    <p className="stat-value">{selectedUser.totalScore || 0}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h4>Joined</h4>
                    <p className="stat-value">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <h4>Last Active</h4>
                    <p className="stat-value">
                      {formatDate(selectedUser.lastActive)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="user-tabs">
                <button
                  className={`tab-btn ${!showWarnings && !showNotes ? "active" : ""}`}
                  onClick={() => {
                    setShowWarnings(false);
                    setShowNotes(false);
                  }}
                >
                  Overview
                </button>
                <button
                  className={`tab-btn ${showWarnings ? "active" : ""}`}
                  onClick={() => {
                    setShowWarnings(true);
                    setShowNotes(false);
                  }}
                >
                  Warnings ({userWarnings.length})
                </button>
                <button
                  className={`tab-btn ${showNotes ? "active" : ""}`}
                  onClick={() => {
                    setShowWarnings(false);
                    setShowNotes(true);
                  }}
                >
                  Admin Notes ({adminNotes.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Overview Tab */}
                {!showWarnings && !showNotes && (
                  <div className="overview-tab">
                    <h3>User Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Account Created:</label>
                        <span>{formatDate(selectedUser.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        <label>Last Login:</label>
                        <span>{formatDate(selectedUser.lastLogin)}</span>
                      </div>
                      <div className="info-item">
                        <label>Last Active:</label>
                        <span>{formatDate(selectedUser.lastActive)}</span>
                      </div>
                      <div className="info-item">
                        <label>Games Played:</label>
                        <span>{selectedUser.gamesPlayed || 0}</span>
                      </div>
                    </div>

                    {userBanStatus?.banned && (
                      <div className="ban-info">
                        <h3>Ban Information</h3>
                        <div className="ban-details">
                          <p>
                            <strong>Reason:</strong> {userBanStatus.reason}
                          </p>
                          <p>
                            <strong>Duration:</strong> {userBanStatus.duration}
                          </p>
                          {userBanStatus.expiresAt && (
                            <p>
                              <strong>Expires:</strong>{" "}
                              {formatDate(userBanStatus.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings Tab */}
                {showWarnings && (
                  <div className="warnings-tab">
                    <h3>Warning History</h3>
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
                          <p className="warning-reason">
                            <strong>Reason:</strong> {warning.reason}
                          </p>
                          <p className="warning-date">
                            <strong>Issued:</strong>{" "}
                            {formatDate(warning.issuedAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="no-items">
                        No warnings found for this user
                      </p>
                    )}
                  </div>
                )}

                {/* Admin Notes Tab */}
                {showNotes && (
                  <div className="notes-tab">
                    <h3>Admin Notes</h3>

                    {/* Add Note Form */}
                    <div className="add-note-form">
                      <textarea
                        placeholder="Add a new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows="3"
                      ></textarea>
                      <button
                        className="add-note-btn"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || actionLoading}
                      >
                        {actionLoading ? "Adding..." : "Add Note"}
                      </button>
                    </div>

                    {/* Notes List */}
                    <div className="notes-list">
                      {adminNotes.length > 0 ? (
                        adminNotes.map((note) => (
                          <div key={note.id} className="note-item">
                            <p className="note-content">{note.note}</p>
                            <p className="note-meta">
                              Added by Admin • {formatDate(note.addedAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="no-items">No admin notes for this user</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="modal-footer">
              {userBanStatus?.banned ? (
                <button
                  className="unban-btn"
                  onClick={handleUnbanUser}
                  disabled={actionLoading}
                >
                  🔓 Unban User
                </button>
              ) : (
                <>
                  <button
                    className="warning-btn"
                    onClick={() => {
                      setActionType("warning");
                      setShowActionModal(true);
                    }}
                    disabled={actionLoading}
                  >
                    ⚠️ Issue Warning
                  </button>

                  <div className="ban-dropdown">
                    <button className="ban-btn">🚫 Ban User ▼</button>
                    <div className="ban-options">
                      <button
                        onClick={() => {
                          setActionType("ban");
                          setActionReason("1 day ban");
                          handleBanUser("1day");
                        }}
                      >
                        1 Day
                      </button>
                      <button
                        onClick={() => {
                          setActionType("ban");
                          setActionReason("3 days ban");
                          handleBanUser("3days");
                        }}
                      >
                        3 Days
                      </button>
                      <button
                        onClick={() => {
                          setActionType("ban");
                          setActionReason("1 week ban");
                          handleBanUser("1week");
                        }}
                      >
                        1 Week
                      </button>
                      <button
                        onClick={() => {
                          setActionType("ban");
                          setActionReason("Permanent ban");
                          handleBanUser("permanent");
                        }}
                      >
                        Permanent
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-content action-modal">
            <div className="modal-header">
              <h2>{actionType === "warning" ? "Issue Warning" : "Ban User"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowActionModal(false);
                  setActionReason("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <label htmlFor="reason">Reason:</label>
              <textarea
                id="reason"
                rows="4"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
              ></textarea>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowActionModal(false);
                  setActionReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={
                  actionType === "warning"
                    ? handleIssueWarning
                    : () => handleBanUser("permanent")
                }
                disabled={!actionReason || actionLoading}
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

export default AdminUsers;
