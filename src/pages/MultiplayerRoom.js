// MultiplayerRoom.js - Room waiting area with player slots, chat, ready system, and admin spectator mode
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import {
  ref,
  onValue,
  update,
  remove,
  push,
  set,
  get,
} from "firebase/database";
import { filterMessage } from "../utils/profanityFilter";
import AdminBadge from "../components/AdminBadge";
import {
  getUsersAdminStatus,
  checkIfUserIsAdmin,
} from "../services/adminService";
import CarDisplay from "../components/CarDisplay";
import { getRegularCarForLevel } from "../services/carService";
import "./MultiplayerRoom.css";

const MultiplayerRoom = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [playersCarInfo, setPlayersCarInfo] = useState({});
  const [playersAdminStatus, setPlayersAdminStatus] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showSpectateConfirm, setShowSpectateConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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
          const fallbackName = user.email?.split("@")[0] || "Player";
          setDisplayName(fallbackName);
        }
      } catch (error) {
        console.error("Error fetching display name:", error);
        setDisplayName(user.email?.split("@")[0] || "Player");
      }
    };

    fetchDisplayName();
  }, [user]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const adminStatus = await checkIfUserIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, [user]);

  // Load room data
  useEffect(() => {
    const roomRef = ref(database, `multiplayer/rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        setRoom(roomData);

        const playersArray = Object.entries(roomData.playersData || {})
          .map(([id, data]) => ({
            id,
            ...data,
            isSpectator: data.isSpectator || false,
          }))
          .sort((a, b) => {
            if (a.isSpectator && !b.isSpectator) return 1;
            if (!a.isSpectator && b.isSpectator) return -1;
            return (a.position || 999) - (b.position || 999);
          });

        setPlayers(playersArray);
        setIsHost(roomData.host === user.uid);

        if (roomData.playersData && roomData.playersData[user.uid]) {
          setPlayerReady(roomData.playersData[user.uid].ready || false);
          setIsSpectator(roomData.playersData[user.uid].isSpectator || false);
        }

        setLoading(false);
      } else {
        navigate("/multiplayer");
      }
    });

    return () => unsubscribe();
  }, [roomId, user.uid, navigate]);

  // Check which players are admins
  useEffect(() => {
    const checkPlayersAdminStatus = async () => {
      if (!players.length) return;
      const playerIds = players.map((p) => p.id);
      const adminStatuses = await getUsersAdminStatus(playerIds, []);
      setPlayersAdminStatus(adminStatuses);
    };
    checkPlayersAdminStatus();
  }, [players]);

  // Get car info for each player based on room level
  useEffect(() => {
    const fetchPlayersCarInfo = async () => {
      if (!players.length || !room) return;
      const carInfo = {};
      players.forEach((player) => {
        const car = getRegularCarForLevel(room.level);
        carInfo[player.id] = {
          carType: car.id,
          displayName: car.displayName,
          icon: car.icon,
        };
      });
      setPlayersCarInfo(carInfo);
    };
    fetchPlayersCarInfo();
  }, [players, room]);

  // Load chat messages
  useEffect(() => {
    const chatRef = ref(database, `multiplayer/rooms/${roomId}/chat`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = [];
        snapshot.forEach((child) => {
          chatData.push({
            id: child.key,
            ...child.val(),
          });
        });
        chatData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(chatData);

        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // When user joins room - handles regular players and spectators
  useEffect(() => {
    const addUserToRoom = async () => {
      if (!room || !user || !displayName) return;
      if (room.playersData && room.playersData[user.uid]) return;

      if (isAdmin && isSpectator) {
        await update(ref(database), {
          [`multiplayer/rooms/${roomId}/playersData/${user.uid}`]: {
            name: displayName,
            ready: false,
            isSpectator: true,
            position: null,
          },
        });
        return;
      }

      if (room.players >= 4) {
        alert("Room is full! You can join as spectator if you're an admin.");
        if (isAdmin) {
          if (window.confirm("Room is full. Join as spectator?")) {
            setIsSpectator(true);
            await update(ref(database), {
              [`multiplayer/rooms/${roomId}/playersData/${user.uid}`]: {
                name: displayName,
                ready: false,
                isSpectator: true,
                position: null,
              },
            });
          }
        }
        return;
      }

      const takenPositions = Object.values(room.playersData || {})
        .filter((p) => !p.isSpectator)
        .map((p) => p.position);

      let nextPosition = 1;
      while (takenPositions.includes(nextPosition)) {
        nextPosition++;
      }

      await update(ref(database), {
        [`multiplayer/rooms/${roomId}/playersData/${user.uid}`]: {
          name: displayName,
          ready: false,
          position: nextPosition,
          isSpectator: false,
        },
        [`multiplayer/rooms/${roomId}/players`]: room.players + 1,
      });
    };

    addUserToRoom();
  }, [room, user, displayName, roomId, navigate, isAdmin, isSpectator]);

  // Toggle spectator mode (admin only)
  const toggleSpectatorMode = async () => {
    if (!isAdmin) return;

    if (isSpectator) {
      if (room.players >= 4) {
        alert("Cannot switch to player - room is full!");
        return;
      }

      const takenPositions = players
        .filter((p) => !p.isSpectator)
        .map((p) => p.position);

      let nextPosition = 1;
      while (takenPositions.includes(nextPosition)) {
        nextPosition++;
      }

      await update(ref(database), {
        [`multiplayer/rooms/${roomId}/playersData/${user.uid}`]: {
          name: displayName,
          ready: false,
          position: nextPosition,
          isSpectator: false,
        },
        [`multiplayer/rooms/${roomId}/players`]: room.players + 1,
      });
    } else {
      await update(ref(database), {
        [`multiplayer/rooms/${roomId}/playersData/${user.uid}`]: {
          name: displayName,
          ready: false,
          isSpectator: true,
          position: null,
        },
        [`multiplayer/rooms/${roomId}/players`]: room.players - 1,
      });
    }

    setIsSpectator(!isSpectator);
  };

  // Send chat message with profanity filter
  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const filteredMessage = filterMessage(newMessage);

    const messageData = {
      userId: user.uid,
      username: displayName,
      message: filteredMessage,
      originalMessage: newMessage !== filteredMessage ? newMessage : null,
      timestamp: Date.now(),
      isSpectator: isSpectator,
    };

    const chatRef = ref(database, `multiplayer/rooms/${roomId}/chat`);
    const newMessageRef = push(chatRef);

    set(newMessageRef, messageData);
    setNewMessage("");
  };

  // Toggle ready status (disabled for spectators)
  const toggleReady = async () => {
    if (isSpectator) {
      alert("Spectators cannot ready up!");
      return;
    }

    const newReadyState = !playerReady;

    await update(ref(database), {
      [`multiplayer/rooms/${roomId}/playersData/${user.uid}/ready`]:
        newReadyState,
    });

    setPlayerReady(newReadyState);
  };

  // Start game (host only) - spectators don't count
  const startGame = async () => {
    if (!isHost) return;

    const racingPlayers = players.filter((p) => !p.isSpectator);
    const allReady = racingPlayers.every((p) => p.ready);

    if (!allReady) {
      alert("Not all players are ready!");
      return;
    }

    if (racingPlayers.length < 2) {
      alert("Need at least 2 players to start!");
      return;
    }

    await update(ref(database), {
      [`multiplayer/rooms/${roomId}/status`]: "playing",
    });

    navigate(`/multiplayer/game/${roomId}`);
  };

  // Leave room
  const leaveRoom = async () => {
    const playerRef = ref(
      database,
      `multiplayer/rooms/${roomId}/playersData/${user.uid}`,
    );
    await remove(playerRef);

    if (!isSpectator) {
      const newPlayerCount = players.filter((p) => !p.isSpectator).length - 1;
      await update(ref(database), {
        [`multiplayer/rooms/${roomId}/players`]: newPlayerCount,
      });
    }

    const remainingPlayers = players.filter((p) => p.id !== user.uid);
    if (remainingPlayers.length === 0) {
      await remove(ref(database, `multiplayer/rooms/${roomId}`));
    }

    if (isHost && remainingPlayers.length > 0) {
      const racingPlayers = remainingPlayers.filter((p) => !p.isSpectator);
      if (racingPlayers.length > 0) {
        const newHost = racingPlayers[0].id;
        const newHostName = racingPlayers[0].name;
        await update(ref(database), {
          [`multiplayer/rooms/${roomId}/host`]: newHost,
          [`multiplayer/rooms/${roomId}/hostName`]: newHostName,
        });
      }
    }

    navigate("/multiplayer");
  };

  // Get car color based on position
  const getCarColor = (position) => {
    switch (position) {
      case 1:
        return "#FFFFFF";
      case 2:
        return "#CCCCCC";
      case 3:
        return "#999999";
      case 4:
        return "#666666";
      default:
        return "#FFFFFF";
    }
  };

  // Get position label
  const getPositionLabel = (position, isSpectator) => {
    if (isSpectator) return "SPECTATOR";
    switch (position) {
      case 1:
        return "P1 (Host)";
      case 2:
        return "P2";
      case 3:
        return "P3";
      case 4:
        return "P4";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="loading-spinner"></div>
        <p>Loading room...</p>
      </div>
    );
  }

  const racingPlayers = players.filter((p) => !p.isSpectator);
  const spectators = players.filter((p) => p.isSpectator);

  return (
    <div className="room-container">
      {/* Room Header */}
      <div className="room-header">
        <div className="room-info">
          <h1>{room?.name}</h1>
          <div className="room-meta">
            <span className="room-level">Level {room?.level}</span>
            {room?.isPrivate && (
              <span className="private-badge">🔒 Private</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button
              className={`spectate-toggle-btn ${isSpectator ? "active" : ""}`}
              onClick={toggleSpectatorMode}
              title={
                isSpectator
                  ? "Switch to player mode"
                  : "Switch to spectator mode"
              }
            >
              {isSpectator ? "👁️ PLAYER MODE" : "👁️ SPECTATE"}
            </button>
          )}
          <button className="leave-btn" onClick={leaveRoom}>
            LEAVE ROOM
          </button>
        </div>
      </div>

      {/* Spectator Info Banner */}
      {isSpectator && (
        <div className="spectator-banner">
          <span className="spectator-icon">👁️</span>
          <span className="spectator-message">
            You are in spectator mode. You can watch the race but cannot play.
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="room-content">
        {/* Players Section */}
        <div className="players-section">
          <h2>RACING PLAYERS ({racingPlayers.length}/4)</h2>
          <div className="players-grid">
            {[1, 2, 3, 4].map((pos) => {
              const player = racingPlayers.find((p) => p.position === pos);

              return (
                <div
                  key={pos}
                  className={`player-slot ${player ? "filled" : "empty"} ${player && playersAdminStatus[player.id] ? "admin-slot" : ""}`}
                  style={{
                    borderColor: player
                      ? getCarColor(pos)
                      : "rgba(255,255,255,0.2)",
                  }}
                >
                  <div className="player-position">
                    {getPositionLabel(pos, false)}
                  </div>

                  {player ? (
                    <>
                      <div className="player-avatar">
                        <img
                          src={`https://ui-avatars.com/api/?name=${player.name}&background=666666&color=fff&bold=true`}
                          alt={player.name}
                        />
                        {playersAdminStatus[player.id] && (
                          <div className="avatar-admin-badge">
                            <AdminBadge />
                          </div>
                        )}
                      </div>
                      <div className="player-info">
                        <span className="player-name">
                          {player.id === user.uid ? "YOU" : player.name}
                          {playersAdminStatus[player.id] && <AdminBadge />}
                          {playersCarInfo[player.id] && (
                            <CarDisplay
                              userId={player.id}
                              size="small"
                              showName={true}
                            />
                          )}
                        </span>
                        <div className="player-status">
                          {player.ready ? (
                            <span className="ready-badge">READY ✓</span>
                          ) : (
                            <span className="not-ready-badge">NOT READY</span>
                          )}
                        </div>
                      </div>
                      <div
                        className="player-car"
                        style={{ color: getCarColor(pos) }}
                      >
                        🏎️
                      </div>
                    </>
                  ) : (
                    <div className="empty-slot">
                      <span>Waiting for player...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spectators Section */}
          {spectators.length > 0 && (
            <div className="spectators-section">
              <h3>SPECTATORS ({spectators.length})</h3>
              <div className="spectators-list">
                {spectators.map((spectator) => (
                  <div key={spectator.id} className="spectator-item">
                    <span className="spectator-icon">👁️</span>
                    <span className="spectator-name">
                      {spectator.id === user.uid ? "YOU" : spectator.name}
                      {playersAdminStatus[spectator.id] && <AdminBadge />}
                      {playersCarInfo[spectator.id] && (
                        <CarDisplay
                          userId={spectator.id}
                          size="small"
                          showName={true}
                        />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Actions */}
          <div className="room-actions">
            {!isSpectator && (
              <button
                className={`ready-btn ${playerReady ? "ready" : ""}`}
                onClick={toggleReady}
              >
                {playerReady ? "✓ READY" : "READY UP"}
              </button>
            )}

            {isHost && (
              <button
                className="start-btn"
                onClick={startGame}
                disabled={
                  racingPlayers.length < 2 ||
                  !racingPlayers.every((p) => p.ready)
                }
              >
                START RACE
              </button>
            )}
          </div>

          {/* Room Info Box */}
          <div className="room-info-box">
            <h3>Room Info</h3>
            <p>
              Room ID: <span className="room-id">{roomId}</span>
            </p>
            <p>Level: Level {room?.level}</p>
            <p>Host: {room?.hostName}</p>
            {room?.isPrivate && (
              <p>🔒 Private Room - Share password with friends</p>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <h2>CHAT</h2>

          <div className="chat-messages" ref={chatContainerRef}>
            {messages.map((msg) => {
              const isFiltered =
                msg.originalMessage && msg.originalMessage !== msg.message;
              const isAdmin = playersAdminStatus[msg.userId];
              const isSpectatorMsg = msg.isSpectator;

              return (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.userId === user.uid ? "own" : ""} ${isFiltered ? "filtered" : ""} ${isAdmin ? "admin-message" : ""} ${isSpectatorMsg ? "spectator-message" : ""}`}
                >
                  <span
                    className="chat-username"
                    style={{
                      color: players.find((p) => p.id === msg.userId)
                        ? getCarColor(
                            players.find((p) => p.id === msg.userId)?.position,
                          )
                        : "#cccccc",
                    }}
                  >
                    {isSpectatorMsg && (
                      <span className="spectator-indicator">👁️</span>
                    )}
                    {msg.username}:{isAdmin && <AdminBadge />}
                    {playersCarInfo[msg.userId] && (
                      <CarDisplay
                        userId={msg.userId}
                        size="small"
                        showName={false}
                      />
                    )}
                  </span>
                  <span className="chat-text">{msg.message}</span>
                  <span className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isSpectator
                  ? "Type a message as spectator..."
                  : "Type a message..."
              }
              maxLength={100}
            />
            <button type="submit">SEND</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerRoom;
