// AdminReports.js - Report management page for admins to review and handle user reports
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "./AdminReports.css";
import {
  getReports,
  getReportById,
  updateReportStatus,
  getCurrentUserAdminStatus,
  getUserWarnings,
  issueWarning,
  banUser,
} from "../services/adminService";

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [userWarnings, setUserWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);

  // Check admin status and load reports on mount
  useEffect(() => {
    checkAdminAndLoadReports();
  }, []);

  // Filter reports when filters change
  useEffect(() => {
    filterReports();
  }, [reports, filterStatus, filterType, searchTerm]);

  // Verify admin and load reports data
  const checkAdminAndLoadReports = async () => {
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
      await loadReports();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Load all reports from database
  const loadReports = async () => {
    try {
      const allReports = await getReports();
      setReports(allReports);
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  };

  // Apply filters to reports list
  const filterReports = () => {
    let filtered = [...reports];

    if (filterStatus !== "all") {
      filtered = filtered.filter((report) => report.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((report) => report.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.reportedUser?.toLowerCase().includes(term) ||
          report.reportedBy?.toLowerCase().includes(term) ||
          report.reason?.toLowerCase().includes(term),
      );
    }

    setFilteredReports(filtered);
  };

  // View report details modal
  const handleViewReport = async (reportId) => {
    try {
      setActionLoading(true);
      const report = await getReportById(reportId);
      setSelectedReport(report);
      setShowModal(true);

      if (report.reportedUserId) {
        const warnings = await getUserWarnings(report.reportedUserId);
        setUserWarnings(warnings);
      }
    } catch (error) {
      console.error("Error loading report details:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Update report status (resolve/dismiss)
  const handleUpdateStatus = async (status, adminNote = "") => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      await updateReportStatus(selectedReport.id, status, adminNote);
      await loadReports();
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Issue warning to reported user
  const handleIssueWarning = async () => {
    if (!selectedReport || !actionReason) return;

    try {
      setActionLoading(true);
      const auth = getAuth();
      await issueWarning(
        selectedReport.reportedUserId,
        actionReason,
        auth.currentUser.uid,
      );

      await handleUpdateStatus("resolved", `Warning issued: ${actionReason}`);
      setShowActionModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error issuing warning:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Ban reported user
  const handleBanUser = async (duration) => {
    if (!selectedReport || !actionReason) return;

    try {
      setActionLoading(true);
      const auth = getAuth();
      await banUser(
        selectedReport.reportedUserId,
        actionReason,
        auth.currentUser.uid,
        duration,
      );

      await handleUpdateStatus(
        "resolved",
        `User banned (${duration}): ${actionReason}`,
      );

      setShowActionModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Get CSS class for status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "badge-pending";
      case "resolved":
        return "badge-resolved";
      case "dismissed":
        return "badge-dismissed";
      default:
        return "";
    }
  };

  // Get icon for report type
  const getTypeIcon = (type) => {
    switch (type) {
      case "harassment":
        return "👤";
      case "cheating":
        return "🎮";
      case "spam":
        return "📧";
      case "offensive":
        return "💬";
      case "other":
        return "❓";
      default:
        return "📄";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="admin-reports">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1>Report Management</h1>
          <p>Review and manage user reports</p>
        </div>
        <button className="refresh-btn" onClick={loadReports}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by user or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="harassment">Harassment</option>
            <option value="cheating">Cheating</option>
            <option value="spam">Spam</option>
            <option value="offensive">Offensive</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Reported User</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr key={report.id} className={report.status}>
                  <td className="type-cell">
                    <span className="type-icon">
                      {getTypeIcon(report.type)}
                    </span>
                    {report.type}
                  </td>
                  <td>{report.reportedUser || "Unknown"}</td>
                  <td>{report.reportedBy || "Unknown"}</td>
                  <td className="reason-cell">{report.reason}</td>
                  <td>{formatDate(report.timestamp)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(report.status)}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewReport(report.id)}
                      disabled={actionLoading}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content report-modal">
            <div className="modal-header">
              <h2>Report Details</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedReport(null);
                  setShowWarnings(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="report-details-grid">
                <div className="detail-item">
                  <label>Report ID:</label>
                  <span>{selectedReport.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span className="report-type">{selectedReport.type}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span
                    className={`status-badge ${getStatusBadgeClass(selectedReport.status)}`}
                  >
                    {selectedReport.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Date Reported:</label>
                  <span>{formatDate(selectedReport.timestamp)}</span>
                </div>
              </div>

              <div className="report-users-section">
                <div className="user-card">
                  <h3>Reported User</h3>
                  <p>
                    <strong>Username:</strong> {selectedReport.reportedUser}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedReport.reportedUserId}
                  </p>
                  <button
                    className="view-warnings-btn"
                    onClick={() => setShowWarnings(!showWarnings)}
                  >
                    {showWarnings ? "Hide Warnings" : "View Warnings"}
                  </button>

                  {showWarnings && (
                    <div className="warnings-list">
                      <h4>Warning History</h4>
                      {userWarnings.length > 0 ? (
                        userWarnings.map((warning) => (
                          <div key={warning.id} className="warning-item">
                            <p>
                              <strong>Reason:</strong> {warning.reason}
                            </p>
                            <p>
                              <strong>Date:</strong>{" "}
                              {formatDate(warning.issuedAt)}
                            </p>
                            <p>
                              <strong>Status:</strong> {warning.status}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="no-warnings">No warnings found</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="user-card">
                  <h3>Reported By</h3>
                  <p>
                    <strong>Username:</strong> {selectedReport.reportedBy}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedReport.reportedById}
                  </p>
                </div>
              </div>

              <div className="report-details">
                <h3>Report Details</h3>
                <div className="details-box">
                  <p>
                    <strong>Reason:</strong> {selectedReport.reason}
                  </p>
                  {selectedReport.description && (
                    <p>
                      <strong>Description:</strong> {selectedReport.description}
                    </p>
                  )}
                </div>
              </div>

              {selectedReport.evidence && (
                <div className="report-evidence">
                  <h3>Evidence</h3>
                  <div className="evidence-box">
                    <p>{selectedReport.evidence}</p>
                  </div>
                </div>
              )}

              {selectedReport.adminNote && (
                <div className="admin-note">
                  <h3>Admin Note</h3>
                  <div className="note-box">
                    <p>{selectedReport.adminNote}</p>
                    <p className="note-meta">
                      By: {selectedReport.resolvedBy} •{" "}
                      {formatDate(selectedReport.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedReport.status === "pending" && (
              <div className="modal-footer">
                <div className="action-buttons">
                  <button
                    className="dismiss-btn"
                    onClick={() =>
                      handleUpdateStatus(
                        "dismissed",
                        "Report dismissed after review",
                      )
                    }
                    disabled={actionLoading}
                  >
                    Dismiss Report
                  </button>

                  <button
                    className="warning-btn"
                    onClick={() => {
                      setActionType("warning");
                      setShowActionModal(true);
                    }}
                    disabled={actionLoading}
                  >
                    Issue Warning
                  </button>

                  <div className="ban-dropdown">
                    <button className="ban-btn">Ban User ▼</button>
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal for warning reason */}
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

export default AdminReports;
