// BadgeCollection.js - Displays all badges in a grid with unlock status on Account page
import React, { useState, useEffect } from "react";
import { getAllBadges, getUserBadgeProgress } from "../services/badgeService";
import BadgeDetailModal from "./BadgeDetailModal";
import "./BadgeCollection.css";

const BadgeCollection = ({ userId }) => {
  const [badges, setBadges] = useState([]);
  const [unlockedBadges, setUnlockedBadges] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load all badges and user's unlocked badges
  useEffect(() => {
    const loadBadgeData = async () => {
      if (!userId) return;

      try {
        const allBadges = getAllBadges();
        setBadges(allBadges);

        const progress = await getUserBadgeProgress(userId);

        const unlockedMap = {};
        progress.unlocked.forEach((badge) => {
          unlockedMap[badge.id] = badge;
        });

        setUnlockedBadges(unlockedMap);
        setTotalUnlocked(progress.totalUnlocked);
      } catch (error) {
        console.error("Error loading badge data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeData();
  }, [userId]);

  // Handle badge click - show detail modal
  const handleBadgeClick = (badge) => {
    setSelectedBadge({
      ...badge,
      ...unlockedBadges[badge.id],
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBadge(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="badge-collection-loading">
        <div className="loading-spinner-small"></div>
        <p>Loading badges...</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="badge-collection-container">
      {/* Header with progress */}
      <div className="badge-collection-header">
        <h3>YOUR BADGES</h3>
        <div className="badge-progress">
          <span className="progress-text">
            {totalUnlocked} of {badges.length} unlocked
          </span>
          <div className="progress-bar-small">
            <div
              className="progress-fill-small"
              style={{ width: `${(totalUnlocked / badges.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="badge-grid">
        {badges.map((badge) => {
          const isUnlocked = unlockedBadges[badge.id];

          return (
            <div
              key={badge.id}
              className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`}
              onClick={() => handleBadgeClick(badge)}
              style={{
                borderColor: isUnlocked ? badge.color : "rgba(255,255,255,0.1)",
                boxShadow: isUnlocked ? `0 0 15px ${badge.glowColor}` : "none",
              }}
            >
              {/* Badge Icon */}
              <div
                className="badge-card-icon"
                style={{
                  color: isUnlocked ? badge.color : "rgba(255,255,255,0.3)",
                  textShadow: isUnlocked
                    ? `0 0 10px ${badge.glowColor}`
                    : "none",
                }}
              >
                {badge.icon}
              </div>

              {/* Badge Name */}
              <div className="badge-card-name">{badge.name}</div>

              {/* Level Range */}
              <div className="badge-card-levels">
                Lvl {badge.levelRange[0]}-{badge.levelRange[1]}
              </div>

              {/* Unlocked Status */}
              {isUnlocked ? (
                <div className="badge-card-status unlocked">
                  <span className="status-dot"></span>
                  Unlocked
                </div>
              ) : (
                <div className="badge-card-status locked">
                  <span className="lock-icon">🔒</span>
                  Locked
                </div>
              )}

              {/* Unlock Date (if unlocked) */}
              {isUnlocked && isUnlocked.unlockedAt && (
                <div className="badge-card-date">
                  {new Date(isUnlocked.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {showModal && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          isUnlocked={!!unlockedBadges[selectedBadge.id]}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default BadgeCollection;
