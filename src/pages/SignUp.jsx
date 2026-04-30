// SignUp.js - Sign up page for new user registration with Firebase
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, createUserWithEmailAndPassword } from "../firebase";
import "./AuthPages.css";

// Password input component with eye toggle
const PasswordInput = ({
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  setShowPassword,
  id,
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          id={id}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
};

const SignUp = () => {
  // State Variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [floatingLetters, setFloatingLetters] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Handle form submission - creates new user account with Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password should be at least 6 characters");
    }

    try {
      setError("");
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("User created:", userCredential.user.email);

      // TODO: Add welcome email functionality here later
      // Options: Firebase Extensions, EmailJS, or SendGrid

      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email already in use. Please try logging in.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to create account: " + error.message);
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
        <h2>Sign Up for GearUp Typing</h2>
        <p className="auth-tagline">Join the racing typing community</p>

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

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 6 characters)"
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            id="password"
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            id="confirmPassword"
          />

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-redirect">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
