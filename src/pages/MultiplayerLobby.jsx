// MultiplayerLobby.js - Lobby for creating/joining multiplayer rooms with admin bypass and level restrictions
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, onValue, push, set, get } from "firebase/database";
import { getOnlineUsersCount } from "../services/presence";
import AdminBadge from "../components/AdminBadge";
import {
  getUsersAdminStatus,
  checkIfUserIsAdmin,
} from "../services/adminService";
import CarDisplay from "../components/CarDisplay";
import { getRegularCarForLevel } from "../services/carService";
import "./MultiplayerLobby.css";

const MultiplayerLobby = ({ user }) => {
  // State Variables
  const [rooms, setRooms] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  // User Level States
  const [userUnlockedLevels, setUserUnlockedLevels] = useState([1]);
  const [userHighestLevel, setUserHighestLevel] = useState(1);

  // Admin Status States
  const [hostsAdminStatus, setHostsAdminStatus] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [hostsCarInfo, setHostsCarInfo] = useState({});

  const navigate = useNavigate();

  // Create room form state
  const [roomName, setRoomName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [createError, setCreateError] = useState("");

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

  // Load user's unlocked levels
  useEffect(() => {
    const fetchUserLevels = async () => {
      if (!user) return;
      try {
        const userRef = ref(database, `users/${user.uid}/unlockedLevels`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const unlocked = snapshot.val();
          setUserUnlockedLevels(unlocked);
          const highest = Math.max(...unlocked);
          setUserHighestLevel(highest);
        } else {
          setUserUnlockedLevels([1]);
          setUserHighestLevel(1);
        }
      } catch (error) {
        console.error("Error fetching user levels:", error);
        setUserUnlockedLevels([1]);
        setUserHighestLevel(1);
      }
    };
    fetchUserLevels();
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

  // Load rooms from Firebase in real-time - FILTERED BY PLAYER'S LEVEL
  useEffect(() => {
    const roomsRef = ref(database, "multiplayer/rooms");

    const unsubscribe = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomsData = [];
        snapshot.forEach((child) => {
          roomsData.push({
            id: child.key,
            ...child.val(),
          });
        });

        // Filter rooms: only show rooms with level <= player's highest level
        // Admin sees all rooms
        const availableRooms = roomsData
          .filter((room) => room.players < 4 && room.status === "waiting")
          .filter((room) => isAdmin || room.level <= userHighestLevel)
          .sort((a, b) => b.createdAt - a.createdAt);

        setRooms(availableRooms);
      } else {
        setRooms([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userHighestLevel, isAdmin]);

  // Check which hosts are admins
  useEffect(() => {
    const checkHostsAdminStatus = async () => {
      if (!rooms.length) return;
      const hostIds = rooms.map((room) => room.host);
      const adminStatuses = await getUsersAdminStatus(hostIds, []);
      setHostsAdminStatus(adminStatuses);
    };
    checkHostsAdminStatus();
  }, [rooms]);

  // Get car info for each host based on room level
  useEffect(() => {
    const fetchHostsCarInfo = async () => {
      if (!rooms.length) return;
      const carInfo = {};
      rooms.forEach((room) => {
        const car = getRegularCarForLevel(room.level);
        carInfo[room.host] = {
          carType: car.id,
          displayName: car.displayName,
          icon: car.icon,
        };
      });
      setHostsCarInfo(carInfo);
    };
    fetchHostsCarInfo();
  }, [rooms]);

  // Get online users count from presence service
  useEffect(() => {
    const unsubscribe = getOnlineUsersCount((count) => {
      setOnlineCount(count);
    });
    return () => unsubscribe();
  }, []);

  // Create new room in Firebase
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setCreateError("Please enter a room name");
      return;
    }

    if (isPrivate && !password.trim()) {
      setCreateError("Please enter a password for private room");
      return;
    }

    // Check if player can create room at this level
    if (!isAdmin && selectedLevel > userHighestLevel) {
      setCreateError(
        `You cannot create a room at Level ${selectedLevel}. Your highest unlocked level is ${userHighestLevel}.`,
      );
      return;
    }

    try {
      const roomsRef = ref(database, "multiplayer/rooms");
      const newRoomRef = push(roomsRef);

      const roomData = {
        name: roomName,
        host: user.uid,
        hostName: displayName,
        level: selectedLevel,
        isPrivate: isPrivate,
        password: isPrivate ? password : "",
        players: 1,
        playersData: {
          [user.uid]: {
            name: displayName,
            ready: false,
            position: 1,
          },
        },
        status: "waiting",
        createdAt: Date.now(),
      };

      await set(newRoomRef, roomData);
      navigate(`/multiplayer/room/${newRoomRef.key}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setCreateError("Failed to create room. Please try again.");
    }
  };

  // Join an existing room with admin bypass and level check
  const handleJoinRoom = async (room) => {
    if (room.players >= 4) {
      alert("Room is full!");
      return;
    }

    // Level check for non-admin players
    if (!isAdmin && room.level > userHighestLevel) {
      alert(
        `You need to reach Level ${room.level} to join this room! Your highest unlocked level is ${userHighestLevel}.`,
      );
      return;
    }

    if (room.isPrivate) {
      if (isAdmin) {
        console.log("Admin bypass: Joining private room without password");
        navigate(`/multiplayer/room/${room.id}`);
        return;
      } else {
        const enteredPassword = prompt("Enter room password:");
        if (enteredPassword !== room.password) {
          alert("Incorrect password!");
          return;
        }
      }
    }

    navigate(`/multiplayer/room/${room.id}`);
  };

  // Quick join - includes private rooms for admins, respects level limits
  const handleQuickJoin = () => {
    if (isAdmin) {
      const availableRoom = rooms.find((r) => r.players < 4);
      if (availableRoom) {
        navigate(`/multiplayer/room/${availableRoom.id}`);
      } else {
        alert("No available rooms. Create one!");
      }
    } else {
      const availableRoom = rooms.find((r) => r.players < 4 && !r.isPrivate);
      if (availableRoom) {
        navigate(`/multiplayer/room/${availableRoom.id}`);
      } else {
        alert("No available public rooms. Create one!");
      }
    }
  };

  // Get level display text
  const getLevelDisplay = (level) => {
    return `Level ${level}`;
  };

  // Get room status badge text
  const getRoomStatus = (room) => {
    if (room.players === 4) return "full";
    if (room.status === "playing") return "in-game";
    return `${room.players}/4 players`;
  };

  // Main Render
  return (
    <div className="lobby-container">
      {/* Header with online counter */}
      <div className="lobby-header">
        <div className="lobby-title">
          <h1>MULTIPLAYER</h1>
          <p className="header-subtitle">Race against other players</p>
        </div>
        <div className="online-counter">
          <span className="online-dot"></span>
          <span className="online-text">{onlineCount} online</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="lobby-actions">
        <button
          className="create-room-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="btn-icon">+</span>
          CREATE ROOM
        </button>
        <button className="quick-join-btn" onClick={handleQuickJoin}>
          <span className="btn-icon">⚡</span>
          {isAdmin ? "ADMIN QUICK JOIN" : "QUICK JOIN"}
        </button>
      </div>

      {/* Admin Info Banner */}
      {isAdmin && (
        <div className="admin-info-banner">
          <span className="admin-icon">👑</span>
          <span className="admin-message">
            You have admin privileges: You can join any private room without a
            password and bypass level restrictions!
          </span>
        </div>
      )}

      {/* Rooms list */}
      <div className="rooms-section">
        <h2>AVAILABLE ROOMS</h2>
        {loading ? (
          <div className="loading-rooms">
            <div className="loading-spinner"></div>
            <p>Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
            <p>No rooms available</p>
            <span>
              {!isAdmin && userHighestLevel === 1
                ? "Complete more solo levels to unlock higher level rooms!"
                : "Create a new room to start racing!"}
            </span>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`room-card ${room.players === 4 ? "full" : ""} ${hostsAdminStatus[room.host] ? "admin-host" : ""}`}
                onClick={() => room.players < 4 && handleJoinRoom(room)}
              >
                <div className="room-header">
                  <h3>{room.name}</h3>
                  {room.isPrivate && (
                    <span className="private-badge">
                      🔒 {isAdmin ? "Admin Access" : "Private"}
                    </span>
                  )}
                </div>

                <div className="room-details">
                  <div className="room-host">
                    <span className="label">Host:</span>
                    <span className="value">
                      {room.hostName}
                      {hostsAdminStatus[room.host] && <AdminBadge />}
                      {hostsCarInfo[room.host] && (
                        <CarDisplay
                          userId={room.host}
                          size="small"
                          showName={true}
                        />
                      )}
                    </span>
                  </div>
                  <div className="room-level">
                    <span className="label">Level:</span>
                    <span className="value">{getLevelDisplay(room.level)}</span>
                    {!isAdmin && room.level > userHighestLevel && (
                      <span className="level-warning">🔒 Too high</span>
                    )}
                  </div>
                  <div className="room-players">
                    <span className="label">Players:</span>
                    <div className="player-indicators">
                      {[1, 2, 3, 4].map((pos) => (
                        <div
                          key={pos}
                          className={`player-dot ${pos <= room.players ? "filled" : ""}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="room-footer">
                  <span className={`room-status ${room.status}`}>
                    {getRoomStatus(room)}
                  </span>
                  {room.players < 4 && room.status === "waiting" && (
                    <button
                      className={`join-btn ${room.isPrivate && isAdmin ? "admin-join" : ""} ${!isAdmin && room.level > userHighestLevel ? "disabled" : ""}`}
                      disabled={!isAdmin && room.level > userHighestLevel}
                    >
                      {room.isPrivate && isAdmin
                        ? "👑 JOIN AS ADMIN"
                        : !isAdmin && room.level > userHighestLevel
                          ? `🔒 Level ${room.level} Required`
                          : "JOIN →"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-modal">
            <h2>CREATE NEW ROOM</h2>

            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              >
                {[...Array(isAdmin ? 24 : userHighestLevel)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Level {i + 1}
                  </option>
                ))}
              </select>
              {!isAdmin && (
                <span className="level-hint">
                  Max level you can create: {userHighestLevel}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private Room (requires password)
              </label>
            </div>

            {isPrivate && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                />
              </div>
            )}

            {createError && <div className="error-message">{createError}</div>}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setRoomName("");
                  setSelectedLevel(1);
                  setIsPrivate(false);
                  setPassword("");
                  setCreateError("");
                }}
              >
                CANCEL
              </button>
              <button className="create-btn" onClick={handleCreateRoom}>
                CREATE ROOM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerLobby;
