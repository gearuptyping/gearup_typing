// Garage.js - Shows user's car collection and current special car on Account page
import React, { useState, useEffect } from "react";
import {
  getAllCarsWithStatus,
  getCurrentSpecialCar,
  REGULAR_CARS,
} from "../services/carService";
import { getUserWeeklyHistory } from "../services/leaderboardService";
// Import all car images
import car1Img from "../assets/cars/car-1.png";
import car2Img from "../assets/cars/car-2.png";
import car3Img from "../assets/cars/car-3.png";
import car4Img from "../assets/cars/car-4.png";
import car5Img from "../assets/cars/car-5.png";
import car6Img from "../assets/cars/car-6.png";
import car7Img from "../assets/cars/car-7.png";
import car8Img from "../assets/cars/car-8.png";
import car9Img from "../assets/cars/car-9.png";
import car10Img from "../assets/cars/car-10.png";
import goldenImg from "../assets/cars/golden.png";
import silverImg from "../assets/cars/silver.png";
import bronzeImg from "../assets/cars/bronze.png";

import "./Garage.css";

const Garage = ({ userId, userLevel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carData, setCarData] = useState({
    regularCars: [],
    specialCar: null,
  });
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarDetail, setShowCarDetail] = useState(false);

  // Helper function to get car image based on car ID
  const getCarImage = (carId, isSpecial = false) => {
    if (isSpecial) {
      switch (carId) {
        case "golden":
          return goldenImg;
        case "silver":
          return silverImg;
        case "bronze":
          return bronzeImg;
        default:
          return goldenImg;
      }
    } else {
      switch (carId) {
        case "car1":
          return car1Img;
        case "car2":
          return car2Img;
        case "car3":
          return car3Img;
        case "car4":
          return car4Img;
        case "car5":
          return car5Img;
        case "car6":
          return car6Img;
        case "car7":
          return car7Img;
        case "car8":
          return car8Img;
        case "car9":
          return car9Img;
        case "car10":
          return car10Img;
        default:
          return car1Img;
      }
    }
  };

  // Get car icon based on car ID
  const getCarIcon = (carId) => {
    const icons = {
      car1: "🚗",
      car2: "🏎️",
      car3: "🏁",
      car4: "⚡",
      car5: "💫",
      car6: "👑",
      car7: "🌟",
      car8: "🔥",
      car9: "💎",
      car10: "🏆",
      golden: "👑",
      silver: "🥈",
      bronze: "🥉",
    };
    return icons[carId] || "🚗";
  };

  // Load garage data on mount
  useEffect(() => {
    const loadGarageData = async () => {
      if (!userId) return;

      try {
        const data = await getAllCarsWithStatus(userId);
        setCarData(data);

        const history = await getUserWeeklyHistory(userId);
        setWeeklyHistory(history);
      } catch (error) {
        console.error("Error loading garage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGarageData();
  }, [userId]);

  // Calculate time remaining for special car
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  // Handle car click - show details
  const handleCarClick = (car) => {
    setSelectedCar(car);
    setShowCarDetail(true);
  };

  // Close car detail
  const handleCloseDetail = () => {
    setShowCarDetail(false);
    setSelectedCar(null);
  };

  // Toggle garage expansion
  const toggleGarage = () => {
    setIsExpanded(!isExpanded);
  };

  // Loading state
  if (loading) {
    return (
      <div className="garage-container">
        <div className="garage-header" onClick={toggleGarage}>
          <span className="garage-icon">🏎️</span>
          <h3>GARAGE</h3>
          <span className="garage-toggle">▼</span>
        </div>
        <div className="garage-loading">
          <div className="loading-spinner-small"></div>
          <p>Loading garage...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="garage-container">
      {/* Garage Header - Always visible */}
      <div className="garage-header" onClick={toggleGarage}>
        <span className="garage-icon">🏎️</span>
        <h3>GARAGE</h3>
        <span className="garage-badge">
          {carData.regularCars.filter((c) => c.unlocked).length}/
          {carData.regularCars.length}
        </span>
        <span className={`garage-toggle ${isExpanded ? "expanded" : ""}`}>
          {isExpanded ? "▼" : "▶"}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="garage-content">
          {/* CURRENT SPECIAL CAR SECTION */}
          {carData.specialCar && (
            <div className="special-car-section">
              <h4>⭐ CURRENT SPECIAL CAR ⭐</h4>
              <div
                className="special-car-card"
                style={{
                  borderColor:
                    carData.specialCar.id === "golden"
                      ? "#FFD700"
                      : carData.specialCar.id === "silver"
                        ? "#C0C0C0"
                        : "#CD7F32",
                  boxShadow: `0 0 20px ${
                    carData.specialCar.id === "golden"
                      ? "rgba(255,215,0,0.5)"
                      : carData.specialCar.id === "silver"
                        ? "rgba(192,192,192,0.5)"
                        : "rgba(205,127,50,0.5)"
                  }`,
                }}
                onClick={() =>
                  handleCarClick({ ...carData.specialCar, isSpecial: true })
                }
              >
                <div className="special-car-icon">
                  <img
                    src={getCarImage(carData.specialCar.id, true)}
                    alt={carData.specialCar.displayName}
                    className="car-image-special"
                  />
                </div>
                <div className="special-car-info">
                  <div className="special-car-name">
                    {carData.specialCar.displayName}
                  </div>
                  <div className="special-car-rank">
                    {carData.specialCar.rank === 1 && "🥇 Weekly Champion"}
                    {carData.specialCar.rank === 2 && "🥈 Weekly Runner-up"}
                    {carData.specialCar.rank === 3 && "🥉 Weekly Top 3"}
                  </div>
                  <div className="special-car-timer">
                    ⏳ {getTimeRemaining(carData.specialCar.expiresAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGULAR CAR COLLECTION */}
          <div className="car-collection-section">
            <h4>YOUR CAR COLLECTION</h4>
            <div className="car-grid">
              {carData.regularCars.map((car) => (
                <div
                  key={car.id}
                  className={`car-grid-item ${car.unlocked ? "unlocked" : "locked"}`}
                  onClick={() =>
                    car.unlocked && handleCarClick({ ...car, isSpecial: false })
                  }
                  style={{
                    borderColor: car.unlocked
                      ? "#41588a"
                      : "rgba(255,255,255,0.2)",
                    opacity: car.unlocked ? 1 : 0.5,
                  }}
                >
                  <div className="car-grid-image">
                    <img
                      src={getCarImage(car.id)}
                      alt={car.displayName}
                      className={`car-image-grid ${car.unlocked ? "" : "grayscale"}`}
                    />
                  </div>
                  <div className="car-grid-name">{car.displayName}</div>
                  <div className="car-grid-level">Lvl {car.levelRequired}</div>
                  <div className="car-grid-icon">{getCarIcon(car.id)}</div>
                  {!car.unlocked && <div className="car-grid-lock">🔒</div>}
                </div>
              ))}
            </div>
          </div>

          {/* PAST ACHIEVEMENTS SECTION */}
          {weeklyHistory.length > 0 && (
            <div className="achievements-section">
              <h4>🏆 PAST ACHIEVEMENTS 🏆</h4>
              <div className="achievements-list">
                {weeklyHistory.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <span className="achievement-rank">
                      {achievement.rank === 1 && "🥇"}
                      {achievement.rank === 2 && "🥈"}
                      {achievement.rank === 3 && "🥉"}
                    </span>
                    <span className="achievement-week">
                      Week {achievement.week}, {achievement.year}
                    </span>
                    <span className="achievement-score">
                      {achievement.weeklyScore} pts
                    </span>
                    <span className="achievement-date">
                      {new Date(achievement.endedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No cars message */}
          {carData.regularCars.filter((c) => c.unlocked).length === 0 &&
            !carData.specialCar && (
              <div className="garage-empty">
                <p>No cars unlocked yet</p>
                <span>Complete levels to unlock cars!</span>
              </div>
            )}
        </div>
      )}

      {/* CAR DETAIL MODAL */}
      {showCarDetail && selectedCar && (
        <div className="car-detail-overlay" onClick={handleCloseDetail}>
          <div
            className="car-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={handleCloseDetail}>
              ✕
            </button>

            <div className="car-detail-header">
              <div className="car-detail-image">
                <img
                  src={getCarImage(selectedCar.id, selectedCar.isSpecial)}
                  alt={selectedCar.displayName}
                  className="car-image-large"
                />
              </div>
              <h2>
                {selectedCar.displayName}
                <span className="car-detail-icon">
                  {getCarIcon(selectedCar.id)}
                </span>
              </h2>
            </div>

            <div className="car-detail-body">
              {/* Special car details */}
              {selectedCar.isSpecial && (
                <>
                  <div className="car-detail-rank">
                    {selectedCar.rank === 1 && "🥇 Weekly Champion"}
                    {selectedCar.rank === 2 && "🥈 Weekly Runner-up"}
                    {selectedCar.rank === 3 && "🥉 Weekly Top 3"}
                  </div>
                  <p className="car-detail-description">
                    {selectedCar.description ||
                      "Weekly top 3 award car - Exclusive limited edition!"}
                  </p>
                  <div className="car-detail-color">
                    <strong>Color:</strong>{" "}
                    {selectedCar.id === "golden" && "✨ Golden ✨"}
                    {selectedCar.id === "silver" && "⚪ Silver ⚪"}
                    {selectedCar.id === "bronze" && "🟤 Bronze 🟤"}
                  </div>
                  {selectedCar.expiresAt && (
                    <div className="car-detail-expiry">
                      <strong>Expires:</strong>{" "}
                      {new Date(selectedCar.expiresAt).toLocaleString()}
                      <br />
                      <small>({getTimeRemaining(selectedCar.expiresAt)})</small>
                    </div>
                  )}
                </>
              )}

              {/* Regular car details */}
              {!selectedCar.isSpecial && (
                <>
                  <p className="car-detail-description">
                    {selectedCar.description ||
                      "Regular car unlocked by leveling up"}
                  </p>
                  <div className="car-detail-level">
                    <strong>Unlocks at:</strong> Level{" "}
                    {selectedCar.levelRequired}
                  </div>
                  <div className="car-detail-status">
                    <strong>Status:</strong>{" "}
                    {selectedCar.unlocked ? (
                      <span className="status-unlocked">✅ Unlocked</span>
                    ) : (
                      <span className="status-locked">
                        🔒 Locked (Reach Level {selectedCar.levelRequired})
                      </span>
                    )}
                  </div>
                  {selectedCar.unlocked && selectedCar.unlockedAt && (
                    <div className="car-detail-date">
                      <strong>Unlocked:</strong>{" "}
                      {new Date(selectedCar.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </>
              )}
            </div>

            <button className="close-bottom-btn" onClick={handleCloseDetail}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Garage;
