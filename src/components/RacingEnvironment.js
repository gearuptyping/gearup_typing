// RacingEnvironment.js - Complete racing track with cars, scenery, weather, and multiplayer support
import React, { useEffect, useState } from "react";
import "./RacingEnvironment.css";

// Car Imports - Regular cars (10 total)
import car1 from "../assets/cars/car-1.png";
import car2 from "../assets/cars/car-2.png";
import car3 from "../assets/cars/car-3.png";
import car4 from "../assets/cars/car-4.png";
import car5 from "../assets/cars/car-5.png";
import car6 from "../assets/cars/car-6.png";
import car7 from "../assets/cars/car-7.png";
import car8 from "../assets/cars/car-8.png";
import car9 from "../assets/cars/car-9.png";
import car10 from "../assets/cars/car-10.png";

// Leaderboard cars (3 total)
import golden from "../assets/cars/golden.png";
import silver from "../assets/cars/silver.png";
import bronze from "../assets/cars/bronze.png";

// Import Car Service for Display Names
import { getCarDisplayName } from "../services/carService";

const RacingEnvironment = ({
  players = [],
  wpm = 0,
  accuracy = 100,
  isRacing = false,
  showCountdown = false,
  countdown = null,
  level = 1,
  isMultiplayer = false,
}) => {
  const [environment, setEnvironment] = useState("day");
  const [weather, setWeather] = useState("clear");

  // Leaderboard cars list
  const leaderboardCars = ["golden", "silver", "bronze"];

  // Random day/night and weather on each level
  useEffect(() => {
    const environments = ["day", "sunset", "night", "dawn"];
    const weathers = ["clear", "rain", "fog"];

    let randomEnv =
      environments[Math.floor(Math.random() * environments.length)];
    let randomWeather = weathers[Math.floor(Math.random() * weathers.length)];

    // Prevent rain during evening (sunset/dawn)
    if (
      (randomEnv === "sunset" || randomEnv === "dawn") &&
      randomWeather === "rain"
    ) {
      randomWeather = "clear";
    }

    setEnvironment(randomEnv);
    setWeather(randomWeather);
  }, [level]);

  // Returns the correct car image based on carType
  const getCarImage = (carType) => {
    switch (carType) {
      case "car1":
        return car1;
      case "car2":
        return car2;
      case "car3":
        return car3;
      case "car4":
        return car4;
      case "car5":
        return car5;
      case "car6":
        return car6;
      case "car7":
        return car7;
      case "car8":
        return car8;
      case "car9":
        return car9;
      case "car10":
        return car10;
      case "golden":
        return golden;
      case "silver":
        return silver;
      case "bronze":
        return bronze;
      default:
        return car1;
    }
  };

  // Car size config - Regular cars: 70x35 | Leaderboard cars: 90x100
  const getCarSize = (carType) => {
    const regularSize = { width: 70, height: 35 };
    const leaderboardSize = { width: 90, height: 100 };

    if (leaderboardCars.includes(carType)) {
      return leaderboardSize;
    }
    return regularSize;
  };

  // Username color - White for all
  const getCarColor = () => {
    return "#ffffff";
  };

  // Car position calculation based on progress
  const startPosition = 120;
  const endPosition = window.innerWidth > 1200 ? 1100 : 800;
  const trackLength = endPosition - startPosition;

  const getCarLeft = (progress) => {
    return startPosition + trackLength * (progress / 100);
  };

  // Vertical positioning - Solo mode: 95px (middle)
  // Multiplayer: Position 1 (HOST): 125px, Position 2: 95px, Position 3: 65px, Position 4: 35px
  const getVerticalPosition = (position, index, isMultiplayerMode) => {
    if (!isMultiplayerMode) return 95;
    switch (position) {
      case 1:
        return 125;
      case 2:
        return 95;
      case 3:
        return 65;
      case 4:
        return 35;
      default:
        return 95;
    }
  };

  // Birds rendering - Eagles at sunset/dawn, doves during day
  const renderBirds = () => {
    if (environment === "night") return null;

    const birds = [];
    const isEvening = environment === "sunset" || environment === "dawn";

    if (isEvening) {
      birds.push(
        <div
          key="eagle1"
          className="bird-group"
          style={{
            top: "8%",
            animationDuration: "32s",
            animationDelay: "0s",
            left: "100%",
          }}
        >
          <span className="bird eagle">🦅</span>
        </div>,
        <div
          key="eagle2"
          className="bird-group"
          style={{
            top: "14%",
            animationDuration: "28s",
            animationDelay: "5s",
            left: "100%",
          }}
        >
          <span className="bird eagle">🦅</span>
        </div>,
        <div
          key="doves1"
          className="bird-group"
          style={{
            top: "28%",
            animationDuration: "35s",
            animationDelay: "2s",
            left: "100%",
          }}
        >
          <span className="bird dove">🕊️</span>
          <span className="bird dove">🕊️</span>
        </div>,
        <div
          key="doves2"
          className="bird-group"
          style={{
            top: "32%",
            animationDuration: "30s",
            animationDelay: "8s",
            left: "100%",
          }}
        >
          <span className="bird dove">🕊️</span>
          <span className="bird dove">🕊️</span>
        </div>,
      );
    } else {
      birds.push(
        <div
          key="doves-day1"
          className="bird-group"
          style={{
            top: "25%",
            animationDuration: "38s",
            animationDelay: "0s",
            left: "100%",
          }}
        >
          <span className="bird dove">🕊️</span>
          <span className="bird dove">🕊️</span>
        </div>,
        <div
          key="doves-day2"
          className="bird-group"
          style={{
            top: "30%",
            animationDuration: "42s",
            animationDelay: "12s",
            left: "100%",
          }}
        >
          <span className="bird dove">🕊️</span>
          <span className="bird dove">🕊️</span>
        </div>,
      );
    }
    return <div className="birds">{birds}</div>;
  };

  // Background scenery - Buildings (night/day) and Mountains (sunset/dawn)
  const renderScenery = () => {
    const scenery = [];

    if (environment === "night") {
      const nightElements = [
        {
          type: "building",
          variant: "skyscraper",
          color: "blue",
          height: 90,
          width: 35,
        },
        {
          type: "building",
          variant: "office",
          color: "silver",
          height: 70,
          width: 40,
        },
        {
          type: "building",
          variant: "apartment",
          color: "red",
          height: 60,
          width: 50,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "factory",
          color: "dark-grey",
          height: 55,
          width: 45,
        },
        {
          type: "building",
          variant: "department",
          color: "orange",
          height: 65,
          width: 55,
        },
        {
          type: "building",
          variant: "school",
          color: "yellow",
          height: 50,
          width: 48,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "hotel",
          color: "blue",
          height: 75,
          width: 40,
        },
        {
          type: "building",
          variant: "house",
          color: "yellow",
          height: 40,
          width: 35,
        },
        {
          type: "building",
          variant: "skyscraper",
          color: "black",
          height: 95,
          width: 35,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "office",
          color: "light-blue",
          height: 68,
          width: 40,
        },
        {
          type: "building",
          variant: "apartment",
          color: "beige",
          height: 62,
          width: 48,
        },
        {
          type: "building",
          variant: "factory",
          color: "brown",
          height: 58,
          width: 42,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
      ];

      let leftPos = 2;
      nightElements.forEach((item, index) => {
        if (item.type === "space") {
          leftPos += 3;
          return;
        }
        const left = leftPos + "%";
        if (item.type === "building") {
          scenery.push(
            <div
              key={`night-${index}`}
              className={`building building-${item.variant} ${item.color}`}
              style={{
                left,
                height: `${item.height}px`,
                width: `${item.width}px`,
                zIndex: 3,
              }}
            />,
          );
          leftPos += item.width / 8;
        } else if (item.type === "tree") {
          scenery.push(
            <div
              key={`night-tree-${index}`}
              className="tree-oak"
              style={{ left, bottom: "0", zIndex: 3 }}
            />,
          );
          leftPos += 5;
        }
      });
    } else if (environment === "sunset" || environment === "dawn") {
      const mountainPositions = [8, 23, 38, 53, 68, 83];
      mountainPositions.forEach((pos, index) => {
        const size = 70 + index * 7;
        scenery.push(
          <div
            key={`mountain-${index}`}
            className="mountain"
            style={{
              left: pos + "%",
              borderLeftWidth: "45px",
              borderRightWidth: "45px",
              borderBottomWidth: `${size}px`,
              zIndex: 2,
            }}
          />,
        );
      });

      const firstMountain = mountainPositions[0];
      scenery.push(
        <div
          key="left-bush-1"
          className="bush"
          style={{ left: "2%", bottom: "0", zIndex: 3 }}
        />,
      );
      const leftTreePos = 2 + (firstMountain - 2) * 0.25;
      scenery.push(
        <div
          key="left-tree"
          className="tree-oak"
          style={{
            left: leftTreePos + "%",
            bottom: "0",
            zIndex: 3,
            transform: "scale(0.7)",
            transformOrigin: "bottom center",
          }}
        />,
      );
      const leftBush2Pos = 2 + (firstMountain - 2) * 0.45;
      scenery.push(
        <div
          key="left-bush-2"
          className="bush small"
          style={{ left: leftBush2Pos + "%", bottom: "0", zIndex: 3 }}
        />,
      );

      for (let i = 0; i < mountainPositions.length - 1; i++) {
        const currentMountain = mountainPositions[i];
        const nextMountain = mountainPositions[i + 1];
        const startPos = currentMountain + 2;
        const endPos = nextMountain - 2;
        const availableSpace = endPos - startPos;
        const maxElements = Math.floor(availableSpace / 1.8);
        if (availableSpace > 3) {
          const step = availableSpace / (maxElements + 1);
          if (maxElements >= 7) {
            const positions = [];
            for (let j = 1; j <= 7; j++) positions.push(startPos + step * j);
            scenery.push(
              <div
                key={`between-tree1-${i}`}
                className="tree-oak"
                style={{
                  left: positions[0] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush1-${i}`}
                className="bush"
                style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree2-${i}`}
                className="tree-oak"
                style={{
                  left: positions[2] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush2-${i}`}
                className="bush small"
                style={{ left: positions[3] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree3-${i}`}
                className="tree-oak"
                style={{
                  left: positions[4] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush3-${i}`}
                className="bush"
                style={{ left: positions[5] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree4-${i}`}
                className="tree-oak"
                style={{
                  left: positions[6] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
          } else if (maxElements >= 5) {
            const positions = [];
            for (let j = 1; j <= 5; j++)
              positions.push(startPos + step * (j + 1));
            scenery.push(
              <div
                key={`between-tree1-${i}`}
                className="tree-oak"
                style={{
                  left: positions[0] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush1-${i}`}
                className="bush"
                style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree2-${i}`}
                className="tree-oak"
                style={{
                  left: positions[2] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush2-${i}`}
                className="bush small"
                style={{ left: positions[3] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree3-${i}`}
                className="tree-oak"
                style={{
                  left: positions[4] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
          } else {
            const positions = [];
            for (let j = 1; j <= 3; j++)
              positions.push(startPos + step * (j + 2));
            scenery.push(
              <div
                key={`between-tree1-${i}`}
                className="tree-oak"
                style={{
                  left: positions[0] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
            scenery.push(
              <div
                key={`between-bush1-${i}`}
                className="bush"
                style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
              />,
            );
            scenery.push(
              <div
                key={`between-tree2-${i}`}
                className="tree-oak"
                style={{
                  left: positions[2] + "%",
                  bottom: "0",
                  zIndex: 3,
                  transform: "scale(0.7)",
                  transformOrigin: "bottom center",
                }}
              />,
            );
          }
        }
      }

      const lastMountain = mountainPositions[mountainPositions.length - 1];
      const rightStart = lastMountain + 2;
      const rightEnd = 95;
      const rightSpace = rightEnd - rightStart;
      if (rightSpace > 3) {
        const maxElements = Math.floor(rightSpace / 1.8);
        const step = rightSpace / (maxElements + 1);
        if (maxElements >= 7) {
          const positions = [];
          for (let j = 1; j <= 7; j++) positions.push(rightStart + step * j);
          scenery.push(
            <div
              key="right-tree-1"
              className="tree-oak"
              style={{
                left: positions[0] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-1"
              className="bush large"
              style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-tree-2"
              className="tree-oak"
              style={{
                left: positions[2] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-2"
              className="bush"
              style={{ left: positions[3] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-tree-3"
              className="tree-oak"
              style={{
                left: positions[4] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-3"
              className="bush small"
              style={{ left: positions[5] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-4"
              className="bush"
              style={{ left: positions[6] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
        } else if (maxElements >= 5) {
          const positions = [];
          for (let j = 1; j <= 5; j++)
            positions.push(rightStart + step * (j + 1));
          scenery.push(
            <div
              key="right-tree-1"
              className="tree-oak"
              style={{
                left: positions[0] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-1"
              className="bush large"
              style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-tree-2"
              className="tree-oak"
              style={{
                left: positions[2] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-2"
              className="bush"
              style={{ left: positions[3] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-tree-3"
              className="tree-oak"
              style={{
                left: positions[4] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
        } else {
          const positions = [];
          for (let j = 1; j <= 3; j++)
            positions.push(rightStart + step * (j + 2));
          scenery.push(
            <div
              key="right-tree-1"
              className="tree-oak"
              style={{
                left: positions[0] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
          scenery.push(
            <div
              key="right-bush-1"
              className="bush large"
              style={{ left: positions[1] + "%", bottom: "0", zIndex: 3 }}
            />,
          );
          scenery.push(
            <div
              key="right-tree-2"
              className="tree-oak"
              style={{
                left: positions[2] + "%",
                bottom: "0",
                zIndex: 3,
                transform: "scale(0.7)",
                transformOrigin: "bottom center",
              }}
            />,
          );
        }
      }
    } else {
      const dayElements = [
        {
          type: "building",
          variant: "skyscraper",
          color: "blue",
          height: 90,
          width: 35,
        },
        {
          type: "building",
          variant: "office",
          color: "silver",
          height: 70,
          width: 40,
        },
        {
          type: "building",
          variant: "apartment",
          color: "red",
          height: 60,
          width: 50,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "factory",
          color: "dark-grey",
          height: 55,
          width: 45,
        },
        {
          type: "building",
          variant: "department",
          color: "orange",
          height: 65,
          width: 55,
        },
        {
          type: "building",
          variant: "school",
          color: "yellow",
          height: 50,
          width: 48,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "hotel",
          color: "blue",
          height: 75,
          width: 40,
        },
        {
          type: "building",
          variant: "house",
          color: "yellow",
          height: 40,
          width: 35,
        },
        {
          type: "building",
          variant: "skyscraper",
          color: "black",
          height: 95,
          width: 35,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
        { type: "space" },
        {
          type: "building",
          variant: "office",
          color: "light-blue",
          height: 68,
          width: 40,
        },
        {
          type: "building",
          variant: "apartment",
          color: "beige",
          height: 62,
          width: 48,
        },
        {
          type: "building",
          variant: "factory",
          color: "brown",
          height: 58,
          width: 42,
        },
        { type: "space" },
        { type: "tree", size: "normal" },
      ];

      let leftPos = 2;
      dayElements.forEach((item, index) => {
        if (item.type === "space") {
          leftPos += 3;
          return;
        }
        const left = leftPos + "%";
        if (item.type === "building") {
          scenery.push(
            <div
              key={`day-${index}`}
              className={`building building-${item.variant} ${item.color}`}
              style={{
                left,
                height: `${item.height}px`,
                width: `${item.width}px`,
                zIndex: 3,
              }}
            />,
          );
          leftPos += item.width / 8;
        } else if (item.type === "tree") {
          scenery.push(
            <div
              key={`day-tree-${index}`}
              className="tree-oak"
              style={{ left, bottom: "0", zIndex: 3 }}
            />,
          );
          leftPos += 5;
        }
      });
    }
    return scenery;
  };

  // Rain effect
  const renderRain = () => {
    if (weather !== "rain") return null;
    const drops = [];
    for (let i = 0; i < 70; i++) {
      drops.push(
        <div
          key={`drop-${i}`}
          className="raindrop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random()}s`,
            animationDuration: `${0.3 + Math.random() * 0.4}s`,
          }}
        />,
      );
    }
    return <div className="rain">{drops}</div>;
  };

  // Checkerboard pattern for start and finish lines
  const renderCheckerboard = (type) => {
    const cells = [];
    const rows = 12;
    const cols = 3;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isBlack = (row + col) % 2 === 0;
        cells.push(
          <div
            key={`${type}-cell-${row}-${col}`}
            style={{
              position: "absolute",
              left: `${(col / cols) * 100}%`,
              top: `${(row / rows) * 100}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              backgroundColor: isBlack ? "#000000" : "#ffffff",
              zIndex: 16,
              border: "none",
            }}
          />,
        );
      }
    }
    return cells;
  };

  const cloudClass = weather === "rain" ? "cloud rain-cloud" : "cloud";

  // Main Render
  return (
    <div className="racing-environment">
      {/* Sky Layer - Clouds, Sun, Moon, Stars, Birds */}
      <div className={`sky-layer ${environment}`}>
        <div className={`${cloudClass} cloud1`}></div>
        <div className={`${cloudClass} cloud2`}></div>
        <div className={`${cloudClass} cloud3`}></div>
        <div className={`${cloudClass} cloud4`}></div>
        <div className={`${cloudClass} cloud5`}></div>

        {environment === "day" && <div className="sun"></div>}
        {environment === "sunset" && (
          <div className="sun" style={{ filter: "hue-rotate(-20deg)" }}></div>
        )}
        {environment === "night" && <div className="moon"></div>}
        {environment === "dawn" && (
          <div
            className="sun"
            style={{ filter: "hue-rotate(20deg)", opacity: 0.7 }}
          ></div>
        )}

        {environment === "night" && (
          <>
            <div className="star" style={{ top: "10%", left: "20%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "25%", left: "40%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "15%", left: "60%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "30%", left: "80%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "20%", left: "90%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "35%", left: "15%" }}>
              ✨
            </div>
            <div className="star" style={{ top: "40%", left: "45%" }}>
              ✨
            </div>
          </>
        )}

        {renderBirds()}
      </div>

      {/* Scenery Layer - Buildings, Mountains, Trees */}
      <div className="scenery-layer">{renderScenery()}</div>

      {/* Track Layer - Asphalt, Lanes, Start/Finish */}
      <div className="track-layer">
        <div className="track-surface"></div>
        <div className="lanes">
          <div className="lane"></div>
          <div className="lane"></div>
          <div className="lane"></div>
          <div className="lane"></div>
        </div>
        <div className="start-line">{renderCheckerboard("start")}</div>
        <div className="finish-line">{renderCheckerboard("finish")}</div>
        <div className="start-text">START</div>
        <div className="finish-text">FINISH</div>
      </div>

      {/* Cars Layer - All player cars */}
      <div className="cars-container">
        {players.map((player, index) => {
          const carLeft = getCarLeft(player.progress);
          const carImage = getCarImage(player.carType);
          const carSize = getCarSize(player.carType);
          const isLeaderboard = leaderboardCars.includes(player.carType);
          const carDisplayName = getCarDisplayName(player.carType);

          let verticalPosition = 95;
          if (isMultiplayer) {
            if (player.position === 1) verticalPosition = 125;
            else if (player.position === 2) verticalPosition = 95;
            else if (player.position === 3) verticalPosition = 65;
            else if (player.position === 4) verticalPosition = 35;
          }

          return (
            <div
              key={player.id || index}
              className="car-container"
              style={{
                position: "absolute",
                left: `${carLeft}px`,
                bottom: `${verticalPosition}px`,
                zIndex: 25,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: "translateX(-50%)",
              }}
            >
              <span
                className="username"
                style={{
                  color: getCarColor(),
                  position: "absolute",
                  top: isLeaderboard ? "-35px" : "-25px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  background: "rgba(0, 0, 0, 0.6)",
                  padding: isLeaderboard ? "4px 12px" : "2px 8px",
                  borderRadius: "12px",
                  fontSize: isLeaderboard ? "14px" : "12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  zIndex: 26,
                }}
              >
                {player.name}
              </span>
              <img
                src={carImage}
                alt={`${player.carType} car`}
                style={{
                  width: `${carSize.width}px`,
                  height: `${carSize.height}px`,
                  objectFit: "contain",
                }}
              />
              {player.boost && (
                <div
                  className="boost-effect"
                  style={{
                    position: "absolute",
                    right: "-25px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: "3px",
                  }}
                >
                  <div className="boost-line"></div>
                  <div className="boost-line"></div>
                  <div className="boost-line"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weather Effects */}
      {weather === "rain" && renderRain()}
      {weather === "fog" && <div className="fog"></div>}

      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="countdown-overlay">
          {countdown === "GO" ? "GO!" : countdown}
        </div>
      )}
    </div>
  );
};

export default RacingEnvironment;
