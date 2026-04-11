// AdminDashboard.js - Main admin panel with overview stats, reports, users, and bans tabs
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./AdminDashboard.css";
import {
  getModerationStats,
  getReports,
  getBannedUsers,
  getAllUsers,
  getCurrentUserAdminStatus,
} from "../services/adminService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    dismissedReports: 0,
    totalBans: 0,
    totalWarnings: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentBans, setRecentBans] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin status and load data on mount
  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  // Verify admin and load dashboard data
  const checkAdminAndLoadData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      console.log("Checking admin status for:", user.email);
      const adminStatus = await getCurrentUserAdminStatus();

      if (!adminStatus) {
        console.log("Not an admin, redirecting to home");
        navigate("/");
        return;
      }

      console.log("✅ Admin verified! Loading dashboard...");
      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Load all dashboard statistics
  const loadDashboardData = async () => {
    try {
      const moderationStats = await getModerationStats();
      setStats(moderationStats);

      const reports = await getReports({ status: "pending" });
      setRecentReports(reports.slice(0, 5));

      const bans = await getBannedUsers();
      setRecentBans(bans.slice(0, 5));

      const users = await getAllUsers();
      setTotalUsers(users.length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Handle admin logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Main Render
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p>Moderation & User Management</p>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`tab-btn ${activeTab === "bans" ? "active" : ""}`}
          onClick={() => setActiveTab("bans")}
        >
          Bans
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-tab">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">{totalUsers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Reports</h3>
                  <p className="stat-number">{stats.totalReports}</p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Reports</h3>
                  <p className="stat-number">{stats.pendingReports}</p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Resolved</h3>
                  <p className="stat-number">{stats.resolvedReports}</p>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon">🚫</div>
                <div className="stat-info">
                  <h3>Total Bans</h3>
                  <p className="stat-number">{stats.totalBans}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <h3>Active Warnings</h3>
                  <p className="stat-number">{stats.totalWarnings}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity Grid */}
            <div className="recent-activity-grid">
              {/* Recent Reports */}
              <div className="recent-section">
                <div className="section-header">
                  <h2>Recent Pending Reports</h2>
                  <button
                    className="view-all-btn"
                    onClick={() => setActiveTab("reports")}
                  >
                    View All
                  </button>
                </div>
                <div className="recent-list">
                  {recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <div key={report.id} className="recent-item">
                        <div className="item-icon">📄</div>
                        <div className="item-details">
                          <p className="item-title">
                            Report #{report.id.slice(-6)}
                          </p>
                          <p className="item-subtitle">
                            Type: {report.type} • {formatDate(report.timestamp)}
                          </p>
                        </div>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-items">No pending reports</p>
                  )}
                </div>
              </div>

              {/* Recent Bans */}
              <div className="recent-section">
                <div className="section-header">
                  <h2>Recent Bans</h2>
                  <button
                    className="view-all-btn"
                    onClick={() => setActiveTab("bans")}
                  >
                    View All
                  </button>
                </div>
                <div className="recent-list">
                  {recentBans.length > 0 ? (
                    recentBans.map((ban) => (
                      <div key={ban.userId} className="recent-item">
                        <div className="item-icon">🚫</div>
                        <div className="item-details">
                          <p className="item-title">
                            {ban.userData?.displayName || "Unknown User"}
                          </p>
                          <p className="item-subtitle">
                            Reason: {ban.reason} • {formatDate(ban.bannedAt)}
                          </p>
                        </div>
                        <span className={`duration-badge ${ban.duration}`}>
                          {ban.duration}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-items">No recent bans</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions - REMOVED "Add Admin" button */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button
                  className="action-btn"
                  onClick={() => setActiveTab("reports")}
                >
                  <span>📋</span>
                  Review Reports
                </button>
                <button
                  className="action-btn"
                  onClick={() => setActiveTab("users")}
                >
                  <span>👥</span>
                  Manage Users
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    alert("Export logs feature coming soon!");
                  }}
                >
                  <span>📊</span>
                  Export Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab - Placeholder */}
        {activeTab === "reports" && (
          <div className="reports-tab">
            <h2>Report Management</h2>
            <p>This section will display all reports with filtering options.</p>
          </div>
        )}

        {/* Users Tab - Placeholder */}
        {activeTab === "users" && (
          <div className="users-tab">
            <h2>User Management</h2>
            <p>
              This section will display all users with search and moderation
              options.
            </p>
          </div>
        )}

        {/* Bans Tab - Placeholder */}
        {activeTab === "bans" && (
          <div className="bans-tab">
            <h2>Ban Management</h2>
            <p>
              This section will display all banned users with unban options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
