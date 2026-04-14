// Login.js - Login page for user authentication with Firebase
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase";
import "./AuthPages.css";

const Login = () => {
  // State Variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [floatingLetters, setFloatingLetters] = useState([]);

  const navigate = useNavigate();

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

    for (let i = 0; i < 50; i++) {
      newLetters.push({
        id: i,
        letter: letters[Math.floor(Math.random() * letters.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 15 + Math.random() * 30,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 5,
      });
    }
    setFloatingLetters(newLetters);
  }, []);

  // Handle form submission - authenticate user with Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("Logged in:", userCredential.user.email);

      navigate("/");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Failed to log in: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Main Render
  return (
    <div className="auth-container">
      {/* Floating Keyboard Letters */}
      <div className="floating-letters-auth">
        {floatingLetters.map((item) => (
          <div
            key={item.id}
            className="floating-letter-auth"
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

      <div className="auth-card">
        <h2>Welcome Back to GearUp Typing</h2>
        <p className="auth-tagline">Ready to race?</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-redirect">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
