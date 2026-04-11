// BadgeToast.js - Shows temporary notification at bottom of screen for badge unlocks
import React, { useEffect, useState } from "react";
import "./BadgeToast.css";

const BadgeToast = ({
  message,
  duration = 3000,
  type = "success",
  onClose,
  icon = "✅",
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-close after duration with progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = Math.max(0, (remaining / duration) * 100);
      setProgress(newProgress);

      if (remaining <= 0) {
        clearInterval(progressInterval);
      }
    }, 10);

    // Auto close timer
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  // Get toast style based on type
  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          background: "rgba(68, 255, 68, 0.15)",
          borderColor: "#44ff44",
          iconColor: "#44ff44",
        };
      case "info":
        return {
          background: "rgba(74, 163, 255, 0.15)",
          borderColor: "#4aa3ff",
          iconColor: "#4aa3ff",
        };
      case "warning":
        return {
          background: "rgba(255, 170, 0, 0.15)",
          borderColor: "#ffaa00",
          iconColor: "#ffaa00",
        };
      default:
        return {
          background: "rgba(68, 255, 68, 0.15)",
          borderColor: "#44ff44",
          iconColor: "#44ff44",
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <div className="toast-container">
      <div
        className="toast-message"
        style={{
          background: toastStyle.background,
          borderColor: toastStyle.borderColor,
        }}
      >
        {/* Icon */}
        <span className="toast-icon" style={{ color: toastStyle.iconColor }}>
          {icon}
        </span>

        {/* Message */}
        <span className="toast-text">{message}</span>

        {/* Close Button */}
        <button className="toast-close" onClick={handleClose}>
          ✕
        </button>

        {/* Progress Bar */}
        <div
          className="toast-progress"
          style={{
            width: `${progress}%`,
            backgroundColor: toastStyle.borderColor,
          }}
        />
      </div>
    </div>
  );
};

export default BadgeToast;
