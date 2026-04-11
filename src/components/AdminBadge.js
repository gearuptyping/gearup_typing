// AdminBadge.js - Displays crown icon for admin users
import React from "react";
import "./AdminBadge.css";

const AdminBadge = ({ showTooltip = true }) => {
  return (
    <span className="admin-badge" title={showTooltip ? "Admin" : ""}>
      👑
    </span>
  );
};

export default AdminBadge;
