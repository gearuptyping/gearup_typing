// FriendRequestBadge.js - Shows number of pending friend requests in navbar
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import "./FriendRequestBadge.css";

const FriendRequestBadge = ({ userId }) => {
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for pending friend requests
  useEffect(() => {
    if (!userId) return;

    const requestsRef = ref(database, "friendRequests");
    const requestsQuery = query(
      requestsRef,
      orderByChild("to"),
      equalTo(userId),
    );

    const unsubscribe = onValue(requestsQuery, (snapshot) => {
      let count = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const request = child.val();
          if (request.status === "pending") {
            count++;
          }
        });
      }
      setRequestCount(count);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle click - navigate to account page
  const handleClick = () => {
    navigate("/account");
  };

  // Don't show anything if no requests
  if (loading || requestCount === 0) {
    return null;
  }

  return (
    <button
      className="request-badge"
      onClick={handleClick}
      title={`${requestCount} pending friend request${requestCount > 1 ? "s" : ""}`}
    >
      <span className="badge-icon">👥</span>
      <span className="badge-count">{requestCount}</span>
    </button>
  );
};

export default FriendRequestBadge;
