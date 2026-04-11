// Home.js - Landing page with hero section, features, and call to action
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import "./Home.css";

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");

  // Fetch user's display name from Firebase for personalized welcome
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const userRef = ref(database, `users/${user.uid}/displayName`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setDisplayName(snapshot.val());
        } else {
          setDisplayName(user.email?.split("@")[0] || "Player");
        }
      } catch (error) {
        console.error("Error fetching display name:", error);
        setDisplayName(user.email?.split("@")[0] || "Player");
      }
    };

    fetchDisplayName();
  }, [user]);

  // Main Render
  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-logo-container"></div>

          {user && (
            <div className="welcome-message">
              <span className="welcome-text">Welcome back,</span>
              <span className="welcome-name">{displayName}</span>
            </div>
          )}

          <h1 className="hero-title">GEARUP TYPING</h1>
          <p className="hero-tagline">Shift Gears. Type Fast. Own the Track.</p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/levels")}>
              PLAY NOW
            </button>
            <button
              className="secondary-btn"
              onClick={() => navigate("/about")}
            >
              LEARN MORE
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">DOMINATE THE RACE</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>SPEED TRAINING</h3>
            <p>
              Push your limits with precision typing drills designed for
              champions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>COMPETITIVE RACING</h3>
            <p>
              Challenge 2-4 players in real-time. Every keystroke fuels your
              victory.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>ELITE LEADERBOARDS</h3>
            <p>
              Climb the ranks and prove you're the fastest typer on the track.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>PRECISION PROGRESSION</h3>
            <p>
              Unlock new challenges and master your craft across multiple tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Section - Placeholder for future video */}
      <div className="preview-section">
        <h2 className="section-title">IN ACTION</h2>
        <div className="preview-container">
          <div className="preview-image">
            <div className="preview-overlay">
              <span className="preview-text">PREVIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>READY TO DOMINATE?</h2>
        <p>Join thousands of racers pushing their limits.</p>
        <button className="cta-button" onClick={() => navigate("/levels")}>
          START YOUR ENGINE
        </button>
      </div>
    </div>
  );
};

export default Home;
