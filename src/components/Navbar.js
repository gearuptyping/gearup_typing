// Navbar.js - Navigation bar with logo, links, user info, badges, and admin dropdown
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, signOut, database } from "../firebase";
import { ref, get } from "firebase/database";
import FriendRequestBadge from "./FriendRequestBadge";
import MessageBadge from "./MessageBadge";
import AdminBadge from "./AdminBadge";
import { getCurrentUserAdminStatus } from "../services/adminService";
import "./Navbar.css";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Fetch user's display name from Firebase
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

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      const adminStatus = await getCurrentUserAdminStatus();
      setIsAdmin(adminStatus);
    };

    checkAdminStatus();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Toggle admin dropdown
  const toggleAdminDropdown = () => {
    setShowAdminDropdown(!showAdminDropdown);
  };

  // Main Render
  return (
    <nav className="navbar">
      {/* Brand/Logo Section */}
      <div className="nav-brand">
        <Link to="/">
          <img
            src="/images/logo.png"
            alt="GearUp Typing"
            className="nav-logo"
          />
          <span className="brand-text">GEARUP TYPING</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <ul className="nav-links">
        <li>
          <Link to="/">HOME</Link>
        </li>
        <li>
          <Link to="/levels">GAME</Link>
        </li>
        <li>
          <Link to="/account">ACCOUNT</Link>
        </li>
        <li>
          <Link to="/leaderboard">LEADERBOARD</Link>
        </li>
        <li>
          <Link to="/about">ABOUT</Link>
        </li>
        <li>
          <Link to="/contact">CONTACT</Link>
        </li>
      </ul>

      {/* User Section - Shows when logged in */}
      <div className="nav-user">
        {user && (
          <>
            {/* Friend Request Badge - Red, shows pending friend requests */}
            <FriendRequestBadge userId={user.uid} />

            {/* Message Badge - Blue, shows unread messages */}
            <MessageBadge userId={user.uid} />

            {/* Admin Dropdown - Only shows for admins */}
            {isAdmin && (
              <div className="admin-dropdown-container">
                <button
                  className="admin-nav-btn"
                  onClick={toggleAdminDropdown}
                  title="Admin Panel"
                >
                  👑 Admin
                </button>
                {showAdminDropdown && (
                  <div className="admin-dropdown-menu">
                    <Link
                      to="/admin"
                      onClick={() => setShowAdminDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/reports"
                      onClick={() => setShowAdminDropdown(false)}
                    >
                      Reports
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setShowAdminDropdown(false)}
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/bans"
                      onClick={() => setShowAdminDropdown(false)}
                    >
                      Bans
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Display Name with Admin Badge */}
            <span className="user-name">
              {displayName}
              {isAdmin && <AdminBadge />}
            </span>

            {/* Logout Button */}
            <button onClick={handleLogout} className="logout-nav-btn">
              LOGOUT
            </button>
          </>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showAdminDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowAdminDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
