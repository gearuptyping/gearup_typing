// App.js - Main application with routing, authentication, and user presence
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "./firebase";
import { initPresence } from "./services/presence";

// Page Imports
import Levels from "./pages/Levels.jsx";
import Game from "./pages/Game.jsx";
import MultiplayerLobby from "./pages/MultiplayerLobby.jsx";
import MultiplayerRoom from "./pages/MultiplayerRoom.jsx";
import MultiplayerGame from "./pages/MultiplayerGame.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Account from "./pages/Account.jsx";
import BlockedUsers from "./pages/BlockedUsers.jsx";
import Messages from "./pages/Messages.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminBans from "./pages/AdminBans.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      if (user) {
        const username =
          user.displayName || user.email?.split("@")[0] || "Player";
        initPresence(user.uid, username);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading GearUp Typing...</p>
      </div>
    );
  }

  // Main Routes
  return (
    <BrowserRouter>
      <div className="App">
        {user && <Navbar user={user} />}

        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <SignUp />}
          />

          {/* Main Routes */}
          <Route
            path="/"
            element={user ? <Home user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/about"
            element={user ? <About /> : <Navigate to="/login" />}
          />
          <Route
            path="/contact"
            element={user ? <Contact /> : <Navigate to="/login" />}
          />
          <Route
            path="/account"
            element={user ? <Account user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/levels"
            element={user ? <Levels user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/game/:levelId"
            element={user ? <Game user={user} /> : <Navigate to="/login" />}
          />

          {/* Multiplayer Routes */}
          <Route
            path="/multiplayer"
            element={
              user ? <MultiplayerLobby user={user} /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/multiplayer/room/:roomId"
            element={
              user ? <MultiplayerRoom user={user} /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/multiplayer/game/:roomId"
            element={
              user ? <MultiplayerGame user={user} /> : <Navigate to="/login" />
            }
          />

          {/* Messages Route */}
          <Route
            path="/messages"
            element={user ? <Messages user={user} /> : <Navigate to="/login" />}
          />

          {/* Blocked Users Route */}
          <Route
            path="/blocked"
            element={
              user ? <BlockedUsers user={user} /> : <Navigate to="/login" />
            }
          />

          {/* Leaderboard Route */}
          <Route
            path="/leaderboard"
            element={user ? <Leaderboard /> : <Navigate to="/login" />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={user ? <AdminDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/reports"
            element={user ? <AdminReports /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/users"
            element={user ? <AdminUsers /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/bans"
            element={user ? <AdminBans /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
