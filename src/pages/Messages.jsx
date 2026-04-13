// Messages.js - Private messages page with conversations, real-time chat, and admin actions
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../services/messaging";
import OnlineStatus from "../components/OnlineStatus";
import AdminBadge from "../components/AdminBadge";
import {
  getUsersAdminStatus,
  checkIfUserIsAdmin,
  issueWarning,
  banUser,
  getUserWarnings,
  unbanUser,
  isUserBanned,
} from "../services/adminService";
import "./Messages.css";

const Messages = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserData, setOtherUserData] = useState(null);

  // Admin Status States
  const [conversationAdminStatus, setConversationAdminStatus] = useState({});
  const [selectedUserAdminStatus, setSelectedUserAdminStatus] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin Action States
  const [showAdminActionModal, setShowAdminActionModal] = useState(false);
  const [adminActionType, setAdminActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [banDuration, setBanDuration] = useState("1day");
  const [actionLoading, setActionLoading] = useState(false);
  const [userWarnings, setUserWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [userBanStatus, setUserBanStatus] = useState({ banned: false });
  const [targetUserForAction, setTargetUserForAction] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const adminStatus = await checkIfUserIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, [user]);

  // Load user's conversations
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Check which conversation partners are admins
  useEffect(() => {
    const checkConversationAdminStatus = async () => {
      if (!conversations.length) return;
      const otherUserIds = conversations.map((conv) => conv.withUserId);
      const adminStatuses = await getUsersAdminStatus(otherUserIds, []);
      setConversationAdminStatus(adminStatuses);
    };
    checkConversationAdminStatus();
  }, [conversations]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!user || !selectedConversation) return;

    markMessagesAsRead(user.uid, selectedConversation.withUserId);

    const fetchOtherUser = async () => {
      const userRef = ref(database, `users/${selectedConversation.withUserId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setOtherUserData(snapshot.val());
        const adminStatuses = await getUsersAdminStatus(
          [selectedConversation.withUserId],
          [],
        );
        setSelectedUserAdminStatus(
          adminStatuses[selectedConversation.withUserId] || false,
        );
        const banStatus = await isUserBanned(selectedConversation.withUserId);
        setUserBanStatus(banStatus);
      }
    };
    fetchOtherUser();

    const unsubscribe = getMessages(
      user.uid,
      selectedConversation.withUserId,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
    );

    return () => unsubscribe();
  }, [user, selectedConversation]);

  // Admin Action Handlers
  const handleAdminAction = async (targetUser) => {
    setTargetUserForAction(targetUser);
    const banStatus = await isUserBanned(
      targetUser.userId || targetUser.withUserId,
    );
    setUserBanStatus(banStatus);
    const warnings = await getUserWarnings(
      targetUser.userId || targetUser.withUserId,
    );
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
    if (!targetUserForAction || !actionReason.trim()) return;

    setActionLoading(true);
    try {
      await issueWarning(
        targetUserForAction.userId || targetUserForAction.withUserId,
        actionReason,
        user.uid,
      );
      alert(
        `Warning issued to ${targetUserForAction.displayName || targetUserForAction.otherUserName}`,
      );
      const warnings = await getUserWarnings(
        targetUserForAction.userId || targetUserForAction.withUserId,
      );
      setUserWarnings(warnings);
      setShowAdminActionModal(false);
      setActionReason("");
      setTargetUserForAction(null);
    } catch (error) {
      console.error("Error issuing warning:", error);
      alert("Failed to issue warning");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!targetUserForAction || !actionReason.trim()) return;

    setActionLoading(true);
    try {
      await banUser(
        targetUserForAction.userId || targetUserForAction.withUserId,
        actionReason,
        user.uid,
        banDuration,
      );
      alert(
        `${targetUserForAction.displayName || targetUserForAction.otherUserName} has been banned (${banDuration})`,
      );
      const banStatus = await isUserBanned(
        targetUserForAction.userId || targetUserForAction.withUserId,
      );
      setUserBanStatus(banStatus);
      setShowAdminActionModal(false);
      setActionReason("");
      setTargetUserForAction(null);
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!targetUserForAction) return;

    setActionLoading(true);
    try {
      await unbanUser(
        targetUserForAction.userId || targetUserForAction.withUserId,
      );
      alert(
        `${targetUserForAction.displayName || targetUserForAction.otherUserName} has been unbanned`,
      );
      const banStatus = await isUserBanned(
        targetUserForAction.userId || targetUserForAction.withUserId,
      );
      setUserBanStatus(banStatus);
      setShowAdminActionModal(false);
      setTargetUserForAction(null);
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Failed to unban user");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const result = await sendMessage(
      user.uid,
      selectedConversation.withUserId,
      newMessage,
    );

    if (result.success) {
      setNewMessage("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      alert("Failed to send message: " + result.error);
    }
    setSending(false);
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Format conversation last message time
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setSelectedConversation(null);
    setOtherUserData(null);
    setSelectedUserAdminStatus(false);
    setUserBanStatus({ banned: false });
  };

  // Loading State
  if (loading) {
    return (
      <div className="messages-loading">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="messages-container">
      {/* Conversations Sidebar */}
      <div
        className={`conversations-sidebar ${selectedConversation ? "hidden-mobile" : ""}`}
      >
        <div className="sidebar-header">
          <h2>MESSAGES</h2>
          <p className="conversation-count">
            {conversations.length} conversations
          </p>
        </div>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <span>Add friends and start chatting!</span>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversationId}
                className={`conversation-item ${selectedConversation?.conversationId === conv.conversationId ? "active" : ""} ${conversationAdminStatus[conv.withUserId] ? "admin-conversation" : ""}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="conv-avatar">
                  {conv.otherUserName?.charAt(0).toUpperCase()}
                  {conversationAdminStatus[conv.withUserId] && (
                    <div className="avatar-admin-indicator">
                      <AdminBadge />
                    </div>
                  )}
                </div>
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">
                      {conv.otherUserName}
                      {conversationAdminStatus[conv.withUserId] && (
                        <AdminBadge />
                      )}
                    </span>
                    <span className="conv-time">
                      {formatLastMessageTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="conv-preview">
                    <span
                      className={`preview-text ${conv.unreadCount > 0 ? "unread" : ""}`}
                    >
                      {conv.lastMessageSender === user.uid ? "You: " : ""}
                      {conv.lastMessage?.substring(0, 30)}
                      {conv.lastMessage?.length > 30 ? "..." : ""}
                    </span>
                    <div className="conv-actions">
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                      {isAdmin && (
                        <button
                          className="admin-action-small-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminAction({
                              withUserId: conv.withUserId,
                              otherUserName: conv.otherUserName,
                            });
                          }}
                          title="Admin Actions"
                        >
                          👑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`chat-area ${!selectedConversation ? "empty" : ""}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={handleBackToList}>
                ←
              </button>
              <div className="chat-user-info">
                <div className="chat-user-avatar">
                  {otherUserData?.displayName?.charAt(0).toUpperCase()}
                  {selectedUserAdminStatus && (
                    <div className="avatar-admin-indicator">
                      <AdminBadge />
                    </div>
                  )}
                </div>
                <div className="chat-user-details">
                  <span className="chat-user-name">
                    {otherUserData?.displayName}
                    {selectedUserAdminStatus && <AdminBadge />}
                  </span>
                  <OnlineStatus
                    userId={selectedConversation.withUserId}
                    showText={true}
                    size="small"
                  />
                  {userBanStatus.banned && (
                    <span className="banned-indicator-small">🚫 BANNED</span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="admin-actions-dropdown">
                  <button
                    className="admin-actions-btn"
                    onClick={() => {
                      const userInfo = {
                        withUserId: selectedConversation.withUserId,
                        otherUserName: selectedConversation.otherUserName,
                        displayName: otherUserData?.displayName,
                      };
                      toggleWarnings(selectedConversation.withUserId);
                      handleAdminAction(userInfo);
                    }}
                    title="Admin Actions"
                  >
                    👑
                  </button>
                  {expandedUser === selectedConversation.withUserId &&
                    showWarnings && (
                      <div className="admin-dropdown-content">
                        <button
                          className="admin-action-item warn"
                          onClick={() => {
                            setAdminActionType("warn");
                            setShowAdminActionModal(true);
                          }}
                        >
                          ⚠️ Issue Warning
                        </button>
                        <button
                          className="admin-action-item ban"
                          onClick={() => {
                            setAdminActionType("ban");
                            setShowAdminActionModal(true);
                          }}
                        >
                          🚫 Ban User
                        </button>
                        <button
                          className="admin-action-item view-warnings"
                          onClick={() =>
                            toggleWarnings(selectedConversation.withUserId)
                          }
                        >
                          📋 View Warnings ({userWarnings.length})
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Messages List */}
            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <span>Send a message to start chatting!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isFromOther = msg.from !== user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`message-item ${msg.from === user.uid ? "own" : "other"} ${isFromOther && selectedUserAdminStatus ? "admin-message" : ""}`}
                    >
                      <div className="message-bubble">
                        {isFromOther && selectedUserAdminStatus && (
                          <div className="message-admin-indicator">
                            <AdminBadge />
                          </div>
                        )}
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">
                          {formatMessageTime(msg.timestamp)}
                          {msg.from === user.uid && (
                            <span className="message-status">
                              {msg.read ? " ✓✓" : " ✓"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  userBanStatus.banned
                    ? "This user is banned. You cannot message them."
                    : "Type a message..."
                }
                className="message-input"
                disabled={sending || userBanStatus.banned}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={sending || !newMessage.trim() || userBanStatus.banned}
              >
                {sending ? "..." : "SEND"}
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">
            <div className="empty-state-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a friend from the list to start chatting</p>
          </div>
        )}
      </div>

      {/* Admin Action Modal */}
      {showAdminActionModal && targetUserForAction && (
        <div className="modal-overlay">
          <div className="admin-action-modal">
            <div className="modal-header">
              <h2>
                Admin Actions:{" "}
                {targetUserForAction.otherUserName ||
                  targetUserForAction.displayName}
                {userBanStatus.banned && (
                  <span className="banned-badge"> (BANNED)</span>
                )}
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAdminActionModal(false);
                  setTargetUserForAction(null);
                  setActionReason("");
                  setUserWarnings([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
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

              <div className="action-type-selector">
                <button
                  className={`action-type-btn ${adminActionType === "warn" ? "active warn" : ""}`}
                  onClick={() => setAdminActionType("warn")}
                >
                  ⚠️ Issue Warning
                </button>
                <button
                  className={`action-type-btn ${adminActionType === "ban" ? "active ban" : ""}`}
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

export default Messages;
