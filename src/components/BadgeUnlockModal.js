// BadgeUnlockModal.js - Shows celebration modal when player unlocks a new badge
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBadges } from "../services/badgeService";
import BadgeToast from "./BadgeToast";
import "./BadgeUnlockModal.css";

const BadgeUnlockModal = ({
  badge,
  onClose,
  onCollect,
  userId,
  showConfetti = true,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [nextBadge, setNextBadge] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Find next badge to unlock
  useEffect(() => {
    if (!badge) return;

    const allBadges = getAllBadges();
    const currentIndex = allBadges.findIndex((b) => b.id === badge.id);

    if (currentIndex < allBadges.length - 1) {
      setNextBadge(allBadges[currentIndex + 1]);
    }
  }, [badge]);

  // Confetti effect on mount
  useEffect(() => {
    if (!showConfetti) return;

    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = [badge.color, "#ffd700", "#ff6b6b", "#4aa3ff", "#44ff44"];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 5 + 2,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += 1;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animation);
    };
  }, [badge, showConfetti]);

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

  // Handle Collect button click
  const handleCollect = () => {
    setToastMessage(`✅ ${badge.name} badge collected!`);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (onCollect) {
        onCollect();
      } else {
        onClose();
      }
    }, 1500);
  };

  // Handle View All button click
  const handleViewAll = () => {
    onClose();
    navigate("/account", { state: { scrollToBadges: true } });
  };

  // Calculate progress percentage to next badge
  const calculateProgress = () => {
    if (!nextBadge) return 100;

    const currentLevel = badge.level || badge.levelRange[1];
    const nextLevel = nextBadge.levelRange[0];
    const overallProgress = Math.min(100, (currentLevel / nextLevel) * 100);

    return {
      overall: Math.min(100, overallProgress),
    };
  };

  const progress = calculateProgress();

  // Main Render
  return (
    <>
      {/* Confetti Canvas */}
      {showConfetti && (
        <canvas
          id="confetti-canvas"
          className="confetti-canvas"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1999,
          }}
        />
      )}

      {/* Modal Overlay */}
      <div className="badge-unlock-overlay">
        <div
          ref={modalRef}
          className="badge-unlock-modal"
          style={{
            borderColor: badge.color,
            boxShadow: `0 0 30px ${badge.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="unlock-header">
            <span className="unlock-emoji">🎉</span>
            <h2>CONGRATULATIONS!</h2>
            <span className="unlock-emoji">🎉</span>
          </div>

          {/* Badge Icon */}
          <div
            className="unlock-badge-icon"
            style={{
              color: badge.color,
              textShadow: `0 0 20px ${badge.glowColor}`,
            }}
          >
            {badge.icon}
          </div>

          {/* New Badge Text */}
          <div className="unlock-new-badge">★ NEW BADGE! ★</div>

          {/* Badge Name */}
          <div className="unlock-badge-name">【 {badge.name} BADGE 】</div>

          {/* Description */}
          <div className="unlock-description">"{badge.description}"</div>

          {/* Progress Section */}
          <div className="unlock-progress-section">
            <div className="progress-header">
              <span>
                Progress: {badge.level || badge.levelRange[1]}/50 Levels
              </span>
              <span>{Math.round(progress.overall)}%</span>
            </div>
            <div className="progress-bar-unlock">
              <div
                className="progress-fill-unlock"
                style={{
                  width: `${progress.overall}%`,
                  background: `linear-gradient(90deg, ${badge.color}, ${badge.glowColor})`,
                }}
              ></div>
            </div>

            {nextBadge && (
              <div className="next-badge-info">
                <span className="next-label">Next:</span>
                <span className="next-badge">
                  {nextBadge.icon} {nextBadge.name} (Level{" "}
                  {nextBadge.levelRange[0]})
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="unlock-actions">
            <button
              className="collect-btn"
              onClick={handleCollect}
              style={{
                background: badge.color,
                color: badge.name === "Immortal" ? "white" : "black",
                borderColor: badge.color,
              }}
            >
              COLLECT
            </button>
            <button className="view-all-btn" onClick={handleViewAll}>
              VIEW ALL
            </button>
          </div>

          {/* Hint Text */}
          <div className="unlock-hint">
            Click COLLECT to continue, VIEW ALL to see all badges
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <BadgeToast
          message={toastMessage}
          duration={1500}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default BadgeUnlockModal;
