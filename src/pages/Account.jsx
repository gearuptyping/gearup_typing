// Account.js - User account page with profile, stats, friends, and garage
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, database } from "../firebase";
import { ref, set, get, update } from "firebase/database";
import {
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
  searchUsers,
  removeFriend,
} from "../services/friendService";
import { blockUser } from "../services/reportService";
import {
  issueWarning,
  banUser,
  getUserWarnings,
  unbanUser,
  isUserBanned,
} from "../services/adminService";
import ReportModal from "../components/ReportModal";
import OnlineStatus from "../components/OnlineStatus";
import AdminBadge from "../components/AdminBadge";
import Garage from "../components/Garage";
import FriendChat from "../components/FriendChat";
import {
  checkIfUserIsAdmin,
  getUsersAdminStatus,
} from "../services/adminService";
import "./Account.css";

const Account = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // State Variables
  const [displayName, setDisplayName] = useState("");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Admin Status States
  const [isAdmin, setIsAdmin] = useState(false);
  const [friendsAdminStatus, setFriendsAdminStatus] = useState({});

  // Admin Action States
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [showAdminActionModal, setShowAdminActionModal] = useState(false);
  const [adminActionType, setAdminActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [banDuration, setBanDuration] = useState("1day");
  const [actionLoading, setActionLoading] = useState(false);
  const [userWarnings, setUserWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [userBanStatus, setUserBanStatus] = useState({ banned: false });
  const [expandedUser, setExpandedUser] = useState(null);

  // Level Scores State
  const [levelScores, setLevelScores] = useState({});
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [nextLevelRequirement, setNextLevelRequirement] = useState("");

  // Friend Request States
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  // Report/Block States
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [blockingId, setBlockingId] = useState(null);

  // Chat States
  const [chatFriend, setChatFriend] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Three-dot menu state
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // Load User Data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        setDisplayName(data.displayName || user.email.split("@")[0]);
        setScore(data.score || 0);
        setFriends(data.friends || []);

        const unlocked = data.unlockedLevels || [1];
        setUnlockedLevels(unlocked);

        const highestLevel = Math.max(...unlocked);
        setLevel(highestLevel);

        setLevelScores(data.levelScores || {});

        if (highestLevel < 24) {
          setNextLevelRequirement(
            `Complete Level ${highestLevel} with >80% accuracy`,
          );
        } else {
          setNextLevelRequirement("Max level reached!");
        }
      } else {
        const initialName = user.email.split("@")[0];
        const newUser = {
          email: user.email,
          displayName: initialName,
          level: 1,
          score: 0,
          friends: [],
          unlockedLevels: [1],
          levelScores: {},
          createdAt: new Date().toISOString(),
        };
        await set(userRef, newUser);

        setDisplayName(initialName);
        setLevel(1);
        setUnlockedLevels([1]);
        setLevelScores({});
        setNextLevelRequirement("Complete Level 1 with >80% accuracy");
      }
    };

    loadUserData();
  }, [user]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const adminStatus = await checkIfUserIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, [user]);

  // Check which friends are admins
  useEffect(() => {
    const checkFriendsAdminStatus = async () => {
      if (!friends.length) return;

      const friendIds = friends.map((f) => f.userId);
      const adminStatuses = await getUsersAdminStatus(friendIds, []);

      const statusMap = {};
      friendIds.forEach((uid) => {
        statusMap[uid] = adminStatuses[uid] || false;
      });
      setFriendsAdminStatus(statusMap);
    };
    checkFriendsAdminStatus();
  }, [friends]);

  // Load Pending Friend Requests
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getPendingRequests(user.uid, (requests) => {
      setPendingRequests(requests);
    });
    return () => unsubscribe();
  }, [user]);

  // Load Sent Friend Requests
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getSentRequests(user.uid, (requests) => {
      setSentRequests(requests);
    });
    return () => unsubscribe();
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuFor(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle Display Name Update
  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) return;

    try {
      setLoading(true);
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, { displayName });
      setEditing(false);
      alert("Display name updated!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update display name.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Users
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    const results = await searchUsers(searchTerm, user.uid);
    setSearchResults(results);
    setSearching(false);
  };

  // Handle Send Friend Request
  const handleSendRequest = async (targetDisplayName) => {
    const result = await sendFriendRequest(
      user.uid,
      displayName,
      targetDisplayName,
    );

    if (result.success) {
      alert(`Friend request sent to ${targetDisplayName}!`);
      setSearchTerm("");
      setSearchResults([]);
      setShowSearch(false);
    } else {
      alert(result.error || "Failed to send friend request");
    }
  };

  // Handle Accept Friend Request
  const handleAcceptRequest = async (requestId, fromUserId) => {
    const result = await acceptFriendRequest(requestId, fromUserId, user.uid);
    if (result.success) {
      alert("Friend request accepted!");
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setFriends(snapshot.val().friends || []);
      }
    }
  };

  // Handle Decline Friend Request
  const handleDeclineRequest = async (requestId) => {
    const result = await declineFriendRequest(requestId);
    if (result.success) {
      alert("Friend request declined");
    }
  };

  // Handle Remove Friend
  const handleRemoveFriend = async (friendId, friendName) => {
    setOpenMenuFor(null);
    if (
      !window.confirm(
        `Are you sure you want to remove ${friendName} from your friends?`,
      )
    )
      return;

    const result = await removeFriend(user.uid, friendId);
    if (result.success) {
      setFriends(friends.filter((f) => f.userId !== friendId));
      alert("Friend removed");
    }
  };

  // Handle Report User
  const handleReportUser = (friend) => {
    setOpenMenuFor(null);
    setSelectedFriend(friend);
    setShowReportModal(true);
  };

  // Handle Block User
  const handleBlockUser = async (friend) => {
    setOpenMenuFor(null);
    if (
      !window.confirm(
        `Are you sure you want to block ${friend.displayName}? They will be removed from your friends list and cannot message you.`,
      )
    ) {
      return;
    }

    setBlockingId(friend.userId);
    const result = await blockUser(user.uid, friend.userId);
    setBlockingId(null);

    if (result.success) {
      setFriends(friends.filter((f) => f.userId !== friend.userId));
      alert(`${friend.displayName} has been blocked`);
    } else {
      alert("Failed to block user: " + result.error);
    }
  };

  // Handle Chat with Friend
  const handleChatFriend = (friend) => {
    setOpenMenuFor(null);
    setChatFriend(friend);
    setShowChatModal(true);
  };

  // Admin Action Handlers
  const handleAdminAction = async (user) => {
    setSelectedUserForAction(user);
    const banStatus = await isUserBanned(user.userId || user.uid);
    setUserBanStatus(banStatus);
    const warnings = await getUserWarnings(user.userId || user.uid);
    setUserWarnings(warnings);
    setShowAdminActionModal(true);
  };

  const toggleWarnings = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setShowWarnings(false);
    } else {
      const warnings = await getUserWarnings(userId);
      setUserWarnings(warnings);
      setExpandedUser(userId);
      setShowWarnings(true);
    }
  };

  const handleIssueWarning = async () => {
    if (!selectedUserForAction || !actionReason.trim()) return;

    setActionLoading(true);
    try {
      await issueWarning(
        selectedUserForAction.userId || selectedUserForAction.uid,
        actionReason,
        user.uid,
      );
      alert(`Warning issued to ${selectedUserForAction.displayName}`);
      const warnings = await getUserWarnings(
        selectedUserForAction.userId || selectedUserForAction.uid,
      );
      setUserWarnings(warnings);
      setShowAdminActionModal(false);
      setActionReason("");
      setSelectedUserForAction(null);
    } catch (error) {
      console.error("Error issuing warning:", error);
      alert("Failed to issue warning");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserForAction || !actionReason.trim()) return;

    setActionLoading(true);
    try {
      await banUser(
        selectedUserForAction.userId || selectedUserForAction.uid,
        actionReason,
        user.uid,
        banDuration,
      );
      alert(
        `${selectedUserForAction.displayName} has been banned (${banDuration})`,
      );
      const banStatus = await isUserBanned(
        selectedUserForAction.userId || selectedUserForAction.uid,
      );
      setUserBanStatus(banStatus);
      setShowAdminActionModal(false);
      setActionReason("");
      setSelectedUserForAction(null);
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUserForAction) return;

    setActionLoading(true);
    try {
      await unbanUser(
        selectedUserForAction.userId || selectedUserForAction.uid,
      );
      alert(`${selectedUserForAction.displayName} has been unbanned`);
      const banStatus = await isUserBanned(
        selectedUserForAction.userId || selectedUserForAction.uid,
      );
      setUserBanStatus(banStatus);
      setShowAdminActionModal(false);
      setSelectedUserForAction(null);
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Failed to unban user");
    } finally {
      setActionLoading(false);
    }
  };

  // Navigate to Blocked Users Page
  const goToBlockedUsers = () => {
    navigate("/blocked");
  };

  // Get Initials for Avatar
  const getInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  // Calculate progress to next level
  const calculateLevelProgress = () => {
    if (level >= 24) return 100;
    const levelsUnlocked = unlockedLevels.length;
    const progressToNext = (levelsUnlocked % 1) * 100;
    return progressToNext;
  };

  // Main Render
  return (
    <div className="account-container">
      {/* Header Section */}
      <div className="account-header">
        <h1>MY ACCOUNT</h1>
        <div className="header-line"></div>
      </div>

      {/* Main Grid Layout */}
      <div className="account-grid">
        {/* Left Column - Profile Section */}
        <div className="profile-section">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-pic-container">
              <div className="profile-pic-initials">{getInitials()}</div>
              <p className="initials-note"></p>
              {isAdmin && (
                <div className="profile-admin-badge">
                  <AdminBadge />
                  <span>ADMIN</span>
                </div>
              )}
            </div>

            <div className="profile-info">
              {editing ? (
                <div className="edit-username">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="username-input"
                    maxLength={20}
                  />
                  <div className="edit-buttons">
                    <button
                      onClick={handleUpdateDisplayName}
                      className="save-btn"
                      disabled={loading}
                    >
                      {loading ? "SAVING..." : "SAVE"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        const loadOriginal = async () => {
                          const userRef = ref(database, `users/${user.uid}`);
                          const snapshot = await get(userRef);
                          if (snapshot.exists()) {
                            setDisplayName(
                              snapshot.val().displayName ||
                                user.email.split("@")[0],
                            );
                          }
                        };
                        loadOriginal();
                      }}
                      className="cancel-btn"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-username">
                  <h2>{displayName}</h2>
                  <button onClick={() => setEditing(true)} className="edit-btn">
                    ✎ EDIT
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="stats-card">
            <h3>RACING STATS</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{level}</span>
                <span className="stat-label">LEVEL</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{score}</span>
                <span className="stat-label">TOTAL SCORE</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{friends.length}</span>
                <span className="stat-label">FRIENDS</span>
              </div>
            </div>

            <div className="level-progress">
              <div className="level-info">
                <span>Level {level}</span>
                <span>
                  {level < 24 ? `Next: Level ${level + 1}` : "MAX LEVEL"}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${calculateLevelProgress()}%` }}
                ></div>
              </div>
              <p className="next-level-requirement">{nextLevelRequirement}</p>
            </div>

            {/* Best Scores Section */}
            {Object.keys(levelScores).length > 0 && (
              <div className="best-scores">
                <h4>BEST SCORES</h4>
                <div className="scores-list">
                  {Object.entries(levelScores)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .slice(0, 5)
                    .map(([lvl, scr]) => (
                      <div key={lvl} className="score-item">
                        <span>Level {lvl}</span>
                        <span>{scr} pts</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Garage Section - Car Collection */}
          <div className="garage-section">
            <Garage userId={user.uid} userLevel={level} />
          </div>
        </div>

        {/* Right Column - Friends Section */}
        <div className="friends-section">
          {/* Friends Header */}
          <div className="friends-header">
            <h3>FRIENDS</h3>

            {/* Search Toggle Button */}
            <button
              className="search-toggle-btn"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? "CANCEL" : "+ ADD FRIEND"}
            </button>

            {/* Blocked Users Link */}
            <button className="blocked-users-link" onClick={goToBlockedUsers}>
              🔒 BLOCKED USERS
            </button>

            {/* Search Form */}
            {showSearch && (
              <div className="search-form">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter display name to search"
                  className="search-input"
                />
                <button
                  onClick={handleSearch}
                  className="search-btn"
                  disabled={searching}
                >
                  {searching ? "SEARCHING..." : "SEARCH"}
                </button>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result) => (
                      <div key={result.userId} className="search-result-item">
                        <div className="result-info">
                          <div className="result-avatar">
                            {result.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="result-name">
                            {result.displayName}
                          </span>
                        </div>
                        <div className="result-actions">
                          <button
                            className="add-friend-small-btn"
                            onClick={() =>
                              handleSendRequest(result.displayName)
                            }
                          >
                            ADD
                          </button>
                          {isAdmin && result.userId !== user.uid && (
                            <button
                              className="admin-action-small-btn"
                              onClick={() => handleAdminAction(result)}
                              title="Admin Actions"
                            >
                              👑
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && !searching && (
                  <div className="no-results">No users found</div>
                )}
              </div>
            )}
          </div>

          {/* Pending Friend Requests */}
          {pendingRequests.length > 0 && (
            <div className="pending-requests">
              <h4>FRIEND REQUESTS ({pendingRequests.length})</h4>
              <div className="requests-list">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <div className="request-avatar">
                        {request.fromName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="request-name">{request.fromName}</span>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() =>
                          handleAcceptRequest(request.id, request.from)
                        }
                        title="Accept"
                      >
                        ✓
                      </button>
                      <button
                        className="decline-btn"
                        onClick={() => handleDeclineRequest(request.id)}
                        title="Decline"
                      >
                        ✕
                      </button>
                      {isAdmin && (
                        <button
                          className="admin-action-small-btn"
                          onClick={() =>
                            handleAdminAction({
                              userId: request.from,
                              displayName: request.fromName,
                            })
                          }
                          title="Admin Actions"
                        >
                          👑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Friend Requests */}
          {sentRequests.length > 0 && (
            <div className="pending-requests">
              <h4>SENT REQUESTS ({sentRequests.length})</h4>
              <div className="requests-list">
                {sentRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <div className="request-avatar">
                        {request.toName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="request-name">{request.toName}</span>
                    </div>
                    <span className="request-status">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List with Three-Dot Menu */}
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="no-friends">
                <p>No friends yet. Add some to race together!</p>
              </div>
            ) : (
              friends.map((friend, index) => (
                <div key={index} className="friend-card">
                  <div className="friend-avatar">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">
                      {friend.displayName}
                      {friendsAdminStatus[friend.userId] && <AdminBadge />}
                      <OnlineStatus userId={friend.userId} />
                    </span>
                    <span className="friend-added">
                      Added: {new Date(friend.addedAt).toLocaleDateString()}
                    </span>

                    {userBanStatus.banned &&
                      userBanStatus.userId === friend.userId && (
                        <span className="banned-indicator">🚫 BANNED</span>
                      )}
                  </div>

                  {/* Three-Dot Menu Button */}
                  <div className="friend-actions">
                    <button
                      className="three-dot-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuFor(
                          openMenuFor === friend.userId ? null : friend.userId,
                        );
                      }}
                      title="Actions"
                    >
                      ⋯
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuFor === friend.userId && (
                      <div
                        className="three-dot-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="menu-item chat"
                          onClick={() => handleChatFriend(friend)}
                        >
                          💬 Chat
                        </button>
                        <button
                          className="menu-item block"
                          onClick={() => handleBlockUser(friend)}
                        >
                          🚫 Block
                        </button>
                        <button
                          className="menu-item report"
                          onClick={() => handleReportUser(friend)}
                        >
                          ⚠️ Report
                        </button>
                        <button
                          className="menu-item remove"
                          onClick={() =>
                            handleRemoveFriend(
                              friend.userId,
                              friend.displayName,
                            )
                          }
                        >
                          ❌ Remove Friend
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedFriend && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedFriend(null);
          }}
          reporterId={user.uid}
          reportedUser={selectedFriend}
        />
      )}

      {/* Friend Chat Modal */}
      {showChatModal && chatFriend && (
        <FriendChat
          currentUserId={user.uid}
          friend={chatFriend}
          onClose={() => {
            setShowChatModal(false);
            setChatFriend(null);
          }}
        />
      )}

      {/* Admin Action Modal */}
      {showAdminActionModal && selectedUserForAction && (
        <div className="modal-overlay">
          <div className="admin-action-modal">
            <div className="modal-header">
              <h2>
                Admin Actions: {selectedUserForAction.displayName}
                {userBanStatus.banned && (
                  <span className="banned-badge"> (BANNED)</span>
                )}
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAdminActionModal(false);
                  setSelectedUserForAction(null);
                  setActionReason("");
                  setUserWarnings([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Warning History */}
              {userWarnings.length > 0 && (
                <div className="warnings-history">
                  <h3>Warning History ({userWarnings.length})</h3>
                  <div className="warnings-list">
                    {userWarnings.map((warning) => (
                      <div key={warning.id} className="warning-item">
                        <p className="warning-reason">{warning.reason}</p>
                        <p className="warning-date">
                          {new Date(warning.issuedAt).toLocaleString()}
                        </p>
                        <span className={`warning-status ${warning.status}`}>
                          {warning.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Type Selection */}
              <div className="action-type-selector">
                <button
                  className={`action-type-btn ${adminActionType === "warn" ? "active" : ""}`}
                  onClick={() => setAdminActionType("warn")}
                >
                  ⚠️ Issue Warning
                </button>
                <button
                  className={`action-type-btn ${adminActionType === "ban" ? "active" : ""}`}
                  onClick={() => setAdminActionType("ban")}
                >
                  🚫 Ban User
                </button>
                {userBanStatus.banned && (
                  <button
                    className="action-type-btn unban"
                    onClick={handleUnbanUser}
                    disabled={actionLoading}
                  >
                    🔓 Unban User
                  </button>
                )}
              </div>

              {/* Warning Form */}
              {adminActionType === "warn" && (
                <div className="action-form">
                  <label htmlFor="warningReason">Warning Reason:</label>
                  <textarea
                    id="warningReason"
                    rows="3"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason for warning..."
                    className="action-input"
                  />
                  <button
                    className="action-submit-btn warn"
                    onClick={handleIssueWarning}
                    disabled={!actionReason.trim() || actionLoading}
                  >
                    {actionLoading ? "Processing..." : "ISSUE WARNING"}
                  </button>
                </div>
              )}

              {/* Ban Form */}
              {adminActionType === "ban" && (
                <div className="action-form">
                  <label htmlFor="banReason">Ban Reason:</label>
                  <textarea
                    id="banReason"
                    rows="3"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason for ban..."
                    className="action-input"
                  />

                  <label htmlFor="banDuration">Ban Duration:</label>
                  <select
                    id="banDuration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="action-select"
                  >
                    <option value="1day">1 Day</option>
                    <option value="3days">3 Days</option>
                    <option value="1week">1 Week</option>
                    <option value="permanent">Permanent</option>
                  </select>

                  <button
                    className="action-submit-btn ban"
                    onClick={handleBanUser}
                    disabled={!actionReason.trim() || actionLoading}
                  >
                    {actionLoading ? "Processing..." : "BAN USER"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
