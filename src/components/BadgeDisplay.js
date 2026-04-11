// BadgeDisplay.js - Shows badge icon next to username with hover tooltip
import React, { useState, useEffect } from "react";
import { getHighestBadge } from "../services/badgeService";
import "./BadgeDisplay.css";

const BadgeDisplay = ({
  userId,
  showTooltip = true,
  size = "medium",
  className = "",
}) => {
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Fetch user's highest badge
  useEffect(() => {
    const fetchBadge = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const highestBadge = await getHighestBadge(userId);
        setBadge(highestBadge);
      } catch (error) {
        console.error("Error fetching badge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, [userId]);

  // Hide if loading or no badge
  if (loading || !badge) {
    return null;
  }

  // Size classes
  const sizeClass = `badge-${size}`;

  return (
    <div
      className={`badge-container ${sizeClass} ${className}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
      style={{ display: "inline-block" }}
    >
      <span
        className="badge-icon"
        style={{
          color: badge.color,
          textShadow: `0 0 5px ${badge.glowColor}`,
        }}
      >
        {badge.icon}
      </span>

      {showTooltip && showTooltipState && (
        <div className="badge-tooltip">
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">
            <div className="tooltip-badge-name">
              <span className="tooltip-icon" style={{ color: badge.color }}>
                {badge.icon}
              </span>
              <span className="tooltip-name">{badge.name}</span>
            </div>
            <div className="tooltip-description">{badge.description}</div>
            <div className="tooltip-levels">
              Levels {badge.levelRange[0]} - {badge.levelRange[1]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
