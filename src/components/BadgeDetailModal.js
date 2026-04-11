// BadgeDetailModal.js - Shows detailed badge info with unlock status and next badge requirements
import React, { useEffect, useRef } from "react";
import "./BadgeDetailModal.css";

const BadgeDetailModal = ({ badge, isUnlocked, onClose }) => {
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  // Format unlock date
  const formatUnlockDate = (timestamp) => {
    if (!timestamp) return "Not unlocked yet";

    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get next badge info (for locked badges)
  const getNextBadgeInfo = () => {
    if (isUnlocked) return null;

    const nextLevel = badge.levelRange[0];
    return `Reach Level ${nextLevel} to unlock`;
  };

  // Main Render
  return (
    <div className="badge-detail-modal-overlay">
      <div
        ref={modalRef}
        className="badge-detail-modal"
        style={{
          borderColor: isUnlocked ? badge.color : "rgba(255,255,255,0.2)",
          boxShadow: isUnlocked ? `0 0 30px ${badge.glowColor}` : "none",
        }}
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Badge Icon - Large */}
        <div
          className="modal-badge-icon"
          style={{
            color: isUnlocked ? badge.color : "rgba(255,255,255,0.3)",
            textShadow: isUnlocked ? `0 0 20px ${badge.glowColor}` : "none",
          }}
        >
          {badge.icon}
        </div>

        {/* Badge Name */}
        <h2 className="modal-badge-name">{badge.name} BADGE</h2>

        {/* Level Range */}
        <div className="modal-level-range">
          Levels {badge.levelRange[0]} - {badge.levelRange[1]}
        </div>

        {/* Decorative Line */}
        <div className="modal-divider"></div>

        {/* Description */}
        <div className="modal-description">{badge.description}</div>

        {/* Status Section */}
        <div className="modal-status-section">
          {isUnlocked ? (
            <>
              <div className="status-badge unlocked">
                <span className="status-dot-large"></span>
                UNLOCKED
              </div>
              {badge.unlockedAt && (
                <div className="unlock-date">
                  Unlocked on {formatUnlockDate(badge.unlockedAt)}
                </div>
              )}
              {badge.level && (
                <div className="unlock-level">
                  Achieved at Level {badge.level}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="status-badge locked">
                <span className="lock-icon-large">🔒</span>
                LOCKED
              </div>
              <div className="next-requirement">{getNextBadgeInfo()}</div>
              <div className="progress-hint">
                Keep typing to unlock this badge!
              </div>
            </>
          )}
        </div>

        {/* Close Button at Bottom */}
        <button className="modal-close-bottom" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default BadgeDetailModal;
