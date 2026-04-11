// Leaderboard.js - Weekly leaderboard page with global rankings, friend rankings, and player details
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  getWeeklyLeaderboard,
  getFriendLeaderboard,
  getUserRankInfo,
  getTimeUntilNextReset,
  getLastResetInfo,
} from "../services/leaderboardService";
import CarDisplay from "../components/CarDisplay";
import "./Leaderboard.css";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendLeaderboard, setFriendLeaderboard] = useState([]);
  const [userRankInfo, setUserRankInfo] = useState(null);
  const [viewMode, setViewMode] = useState("global");
  const [timeUntilReset, setTimeUntilReset] = useState(null);
  const [lastResetInfo, setLastResetInfo] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // Check authentication and load data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
      await loadLeaderboardData(currentUser.uid);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load all leaderboard data
  const loadLeaderboardData = async (userId) => {
    try {
      setLoading(true);

      const globalData = await getWeeklyLeaderboard(50);
      setLeaderboard(globalData);

      const friendData = await getFriendLeaderboard(userId);
      setFriendLeaderboard(friendData);

      const rankInfo = await getUserRankInfo(userId);
      setUserRankInfo(rankInfo);

      setTimeUntilReset(getTimeUntilNextReset());
      const lastReset = await getLastResetInfo();
      setLastResetInfo(lastReset);
    } catch (error) {
      console.error("Error loading leaderboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    if (user) {
      loadLeaderboardData(user.uid);
    }
  };

  // Toggle between global and friends view
  const handleViewToggle = (mode) => {
    setViewMode(mode);
  };

  // Handle player click - show profile modal
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  // Close player modal
  const handleCloseModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayer(null);
  };

  // Get medal icon for top 3
  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <span className="medal gold">🥇</span>;
      case 2:
        return <span className="medal silver">🥈</span>;
      case 3:
        return <span className="medal bronze">🥉</span>;
      default:
        return <span className="rank-number">#{rank}</span>;
    }
  };

  // Format time until reset
  const formatTimeUntilReset = () => {
    if (!timeUntilReset) return "Loading...";

    const { days, hours, minutes } = timeUntilReset;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get current display data based on view mode
  const getCurrentDisplayData = () => {
    return viewMode === "global" ? leaderboard : friendLeaderboard;
  };

  // Loading State
  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  const currentData = getCurrentDisplayData();

  // Main Render
  return (
    <div className="leaderboard-container">
      {/* Header Section */}
      <div className="leaderboard-header">
        <div className="header-left">
          <h1>🏆 WEEKLY LEADERBOARD</h1>
          <p className="header-subtitle">Top racers this week</p>
        </div>
        <div className="header-right">
          <div className="reset-timer">
            <span className="timer-label">Resets in:</span>
            <span className="timer-value">{formatTimeUntilReset()}</span>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === "global" ? "active" : ""}`}
          onClick={() => handleViewToggle("global")}
        >
          🌍 GLOBAL
        </button>
        <button
          className={`toggle-btn ${viewMode === "friends" ? "active" : ""}`}
          onClick={() => handleViewToggle("friends")}
        >
          👥 FRIENDS
        </button>
      </div>

      {/* Your Rank Card */}
      {userRankInfo && (
        <div className="your-rank-card">
          <div className="rank-info">
            <span className="rank-label">YOUR RANK</span>
            {userRankInfo.rank ? (
              <span className="rank-value">#{userRankInfo.rank}</span>
            ) : (
              <span className="rank-value">Not in top 100</span>
            )}
          </div>
          <div className="score-info">
            <span className="score-label">Weekly Score</span>
            <span className="score-value">{userRankInfo.weeklyScore}</span>
          </div>
          {userRankInfo.pointsToNext && (
            <div className="next-rank-info">
              <span className="next-label">
                {userRankInfo.pointsToNext} pts to rank #{userRankInfo.nextRank}
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (userRankInfo.weeklyScore / (userRankInfo.weeklyScore + userRankInfo.pointsToNext)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {currentData.length === 0 ? (
          <div className="empty-leaderboard">
            {viewMode === "global" ? (
              <>
                <p>No scores yet this week</p>
                <span>Play games to earn points and appear here!</span>
              </>
            ) : (
              <>
                <p>No friends on leaderboard yet</p>
                <span>Add friends and race together to see them here!</span>
              </>
            )}
          </div>
        ) : (
          <>
            {/* List Headers */}
            <div className="list-header">
              <div className="col-rank">RANK</div>
              <div className="col-player">PLAYER</div>
              <div className="col-car">CAR</div>
              <div className="col-level">LEVEL</div>
              <div className="col-score">SCORE</div>
            </div>

            {/* List Items */}
            {currentData.map((player) => (
              <div
                key={player.userId}
                className={`list-item ${player.userId === user?.uid ? "current-user" : ""}`}
                onClick={() => handlePlayerClick(player)}
              >
                <div className="col-rank">{getMedalIcon(player.rank)}</div>
                <div className="col-player">
                  <span className="player-name">{player.displayName}</span>
                  {player.userId === user?.uid && (
                    <span className="you-badge">(YOU)</span>
                  )}
                </div>
                <div className="col-car">
                  <CarDisplay
                    userId={player.userId}
                    size="small"
                    showName={true}
                  />
                </div>
                <div className="col-level">Level {player.level}</div>
                <div className="col-score">
                  {player.weeklyScore.toLocaleString()}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Last Reset Info */}
      {lastResetInfo && (
        <div className="last-reset-info">
          <span>
            Last reset: {new Date(lastResetInfo.timestamp).toLocaleString()}
          </span>
          {lastResetInfo.weekInfo && (
            <span>
              Week {lastResetInfo.weekInfo.week}, {lastResetInfo.weekInfo.year}
            </span>
          )}
        </div>
      )}

      {/* Player Details Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="player-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseModal}>
              ✕
            </button>

            <div className="player-modal-header">
              <div className="player-avatar">
                {selectedPlayer.displayName?.charAt(0).toUpperCase()}
              </div>
              <h2>{selectedPlayer.displayName}</h2>
              {selectedPlayer.userId === user?.uid && (
                <span className="you-badge-large">YOU</span>
              )}
            </div>

            <div className="player-modal-stats">
              <div className="stat-row">
                <span className="stat-label">Current Rank</span>
                <span className="stat-value">#{selectedPlayer.rank}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Weekly Score</span>
                <span className="stat-value">
                  {selectedPlayer.weeklyScore.toLocaleString()}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Level</span>
                <span className="stat-value">{selectedPlayer.level}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Current Car</span>
                <span className="stat-value">
                  <CarDisplay
                    userId={selectedPlayer.userId}
                    size="medium"
                    showName={true}
                  />
                </span>
              </div>
            </div>

            {/* Top 3 Badge for winners */}
            {selectedPlayer.rank <= 3 && (
              <div className="winner-badge">
                {selectedPlayer.rank === 1 && "🥇 WEEKLY CHAMPION"}
                {selectedPlayer.rank === 2 && "🥈 WEEKLY RUNNER-UP"}
                {selectedPlayer.rank === 3 && "🥉 WEEKLY TOP 3"}
              </div>
            )}

            <button className="close-bottom-btn" onClick={handleCloseModal}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
