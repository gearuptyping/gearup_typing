// CarDisplay.js - Shows car icon/name next to username in Navbar, Chat, Multiplayer, Leaderboard
import React, { useState, useEffect } from "react";
import {
  getCurrentActiveCar,
  getCarDisplayName,
  getCarIcon,
} from "../services/carService";
import "./CarDisplay.css";

const CarDisplay = ({
  userId,
  userLevel,
  size = "small",
  showIcon = true,
  showName = true,
  showTooltip = true,
  className = "",
}) => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Fetch user's current active car
  useEffect(() => {
    const fetchCar = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const activeCar = await getCurrentActiveCar(userId, userLevel || 1);
        setCar(activeCar);
      } catch (error) {
        console.error("Error fetching car:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [userId, userLevel]);

  // Hide if loading or no car (don't break the UI)
  if (loading || !car) {
    return null;
  }

  // Size classes for styling
  const sizeClass = `car-${size}`;

  // Special car badge text for weekly winners
  const getSpecialBadge = () => {
    if (!car.isSpecial) return null;

    if (car.rank === 1) return "🥇 WEEKLY CHAMPION";
    if (car.rank === 2) return "🥈 WEEKLY RUNNER-UP";
    if (car.rank === 3) return "🥉 WEEKLY TOP 3";
    return null;
  };

  return (
    <div
      className={`car-display-container ${sizeClass} ${className} ${car.isSpecial ? "special-car" : ""}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {/* Car Icon */}
      {showIcon && (
        <span
          className="car-icon"
          style={{
            color: car.isSpecial ? car.color : "inherit",
            textShadow: car.isSpecial ? `0 0 5px ${car.glowColor}` : "none",
          }}
        >
          {car.icon}
        </span>
      )}

      {/* Car Name */}
      {showName && (
        <span
          className="car-name"
          style={{
            color: car.isSpecial ? car.color : "inherit",
            fontWeight: car.isSpecial ? 600 : 400,
          }}
        >
          {car.displayName}
        </span>
      )}

      {/* Tooltip on hover */}
      {showTooltip && showTooltipState && (
        <div className="car-tooltip">
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-icon">{car.icon}</span>
              <span className="tooltip-name">{car.displayName}</span>
            </div>

            <div className="tooltip-description">
              {car.description ||
                (car.isSpecial
                  ? `Weekly ${car.rank === 1 ? "Champion" : car.rank === 2 ? "Runner-up" : "Top 3"} car`
                  : "Regular car")}
            </div>

            {/* Special Car Info */}
            {car.isSpecial && (
              <>
                <div className="tooltip-special-badge">{getSpecialBadge()}</div>
                {car.expiresAt && (
                  <div className="tooltip-expiry">
                    Expires: {new Date(car.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </>
            )}

            {/* Regular Car Info */}
            {!car.isSpecial && car.levelRequired && (
              <div className="tooltip-level">
                Unlocks at Level {car.levelRequired}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDisplay;
