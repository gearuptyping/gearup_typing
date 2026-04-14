// Home.js - Landing page with hero section, features, and call to action
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import "./Home.css";

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [floatingLetters, setFloatingLetters] = useState([]);

  const featuresRef = useRef([]);
  const ctaRef = useRef(null);

  const fullTagline = "Shift Gears. Type Fast. Own the Track.";

  // Generate random floating letters
  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#ffeaa7",
      "#dfe6e9",
      "#fdcb6e",
      "#e17055",
      "#74b9ff",
      "#a29bfe",
    ];
    const newLetters = [];

    for (let i = 0; i < 60; i++) {
      newLetters.push({
        id: i,
        letter: letters[Math.floor(Math.random() * letters.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 15 + Math.random() * 35,
        duration: 6 + Math.random() * 15,
        delay: Math.random() * 8,
      });
    }
    setFloatingLetters(newLetters);
  }, []);

  // Fetch user's display name
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

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullTagline.length) {
        setTypedText(fullTagline.slice(0, index + 1));
        index++;
      } else {
        setIsTypingComplete(true);
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Scroll-triggered fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    featuresRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>

        {/* Floating Keyboard Letters */}
        <div className="floating-letters">
          {floatingLetters.map((item) => (
            <div
              key={item.id}
              className="floating-letter"
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
                color: item.color,
                fontSize: `${item.size}px`,
                animationDuration: `${item.duration}s`,
                animationDelay: `${item.delay}s`,
              }}
            >
              {item.letter}
            </div>
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-logo-container"></div>

          {user && (
            <div className="welcome-message">
              <span className="welcome-text">Welcome back,</span>
              <span className="welcome-name">{displayName}</span>
            </div>
          )}

          <h1 className="hero-title">GEARUP TYPING</h1>

          <div className="tagline-container">
            <p className="hero-tagline">
              {typedText}
              {!isTypingComplete && <span className="cursor-blink">|</span>}
            </p>
          </div>

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

      {/* Features Section - WITH FLOATING DOTS */}
      <div className="features-section">
        {/* FLOATING GLOWING DOTS - ADD THESE */}
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>

        <h2 className="section-title">DOMINATE THE RACE</h2>
        <div className="features-grid">
          <div
            className="feature-card fade-up"
            ref={(el) => (featuresRef.current[0] = el)}
          >
            <div className="feature-icon">⚡</div>
            <h3>SPEED TRAINING</h3>
            <p>
              Push your limits with precision typing drills designed for
              champions.
            </p>
          </div>

          <div
            className="feature-card fade-up"
            ref={(el) => (featuresRef.current[1] = el)}
          >
            <div className="feature-icon">🏆</div>
            <h3>COMPETITIVE RACING</h3>
            <p>
              Challenge 2-4 players in real-time. Every keystroke fuels your
              victory.
            </p>
          </div>

          <div
            className="feature-card fade-up"
            ref={(el) => (featuresRef.current[2] = el)}
          >
            <div className="feature-icon">📈</div>
            <h3>ELITE LEADERBOARDS</h3>
            <p>
              Climb the ranks and prove you're the fastest typer on the track.
            </p>
          </div>

          <div
            className="feature-card fade-up"
            ref={(el) => (featuresRef.current[3] = el)}
          >
            <div className="feature-icon">🎯</div>
            <h3>PRECISION PROGRESSION</h3>
            <p>
              Unlock new challenges and master your craft across multiple tiers.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section - WITH FLOATING DOTS */}
      <div className="cta-section fade-up" ref={ctaRef}>
        {/* FLOATING GLOWING DOTS - ADD THESE */}
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>
        <div className="floating-dot"></div>

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
