// ReportModal.js - Popup for reporting users with reason selection
import React, { useState } from "react";
import { REPORT_REASONS, submitReport } from "../services/reportService";
import "./ReportModal.css";

const ReportModal = ({ isOpen, onClose, reporterId, reportedUser }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      alert("Please select a reason");
      return;
    }

    setSubmitting(true);

    const result = await submitReport(
      reporterId,
      reportedUser.userId,
      selectedReason,
      details,
    );

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setSelectedReason("");
        setDetails("");
      }, 2000);
    } else {
      alert("Failed to submit report: " + result.error);
    }
  };

  // Handle modal close with reset
  const handleClose = () => {
    setSelectedReason("");
    setDetails("");
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          ✕
        </button>

        {submitted ? (
          <div className="report-success">
            <div className="success-icon">✓</div>
            <h3>Report Submitted</h3>
            <p>Thank you for helping keep the community safe!</p>
          </div>
        ) : (
          <>
            <h2>Report User</h2>
            <p className="report-user-name">
              Reporting: {reportedUser.displayName}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Reason for report *</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  required
                  className="reason-select"
                >
                  <option value="">Select a reason</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Additional details (optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional information that might help..."
                  rows="4"
                  className="details-input"
                  maxLength="500"
                />
                <span className="char-count">{details.length}/500</span>
              </div>

              <div className="report-warning">
                <p>
                  ⚠️ False reports may result in action against your account.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || !selectedReason}
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT REPORT"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
