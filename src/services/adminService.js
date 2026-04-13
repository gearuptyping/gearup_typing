// adminService.js - Admin functions for user management, reports, warnings, bans, and moderation
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  remove,
} from "firebase/database";
import { getAuth } from "firebase/auth";

// Admin emails from .env file
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .filter((email) => email);
console.log("✅ Admin emails loaded from .env:", ADMIN_EMAILS);

// Get admin list (emails and UIDs)
export const getAdminList = async () => {
  try {
    const db = getDatabase();
    const adminsRef = ref(db, "admins");
    const snapshot = await get(adminsRef);

    if (!snapshot.exists()) return { emails: ADMIN_EMAILS, uids: [] };

    const admins = snapshot.val();
    const adminUIDs = [];

    Object.keys(admins).forEach((key) => {
      if (!key.includes("@")) {
        adminUIDs.push(key);
      }
    });

    return { emails: ADMIN_EMAILS, uids: adminUIDs };
  } catch (error) {
    console.error("Error getting admin list:", error);
    return { emails: ADMIN_EMAILS, uids: [] };
  }
};

// Check if user is admin by UID or email
export const checkIfUserIsAdmin = async (userId, userEmail) => {
  try {
    const db = getDatabase();
    const adminRef = ref(db, `admins/${userId}`);
    const snapshot = await get(adminRef);

    if (snapshot.exists()) {
      return true;
    }

    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
      try {
        const uidAdminRef = ref(db, `admins/${userId}`);
        await set(uidAdminRef, true);
        console.log(`✅ Added UID for admin email: ${userEmail}`);
      } catch (e) {
        console.log("Note: Could not add UID to Firebase");
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Get current user's admin status
export const getCurrentUserAdminStatus = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return false;

  return await checkIfUserIsAdmin(user.uid, user.email);
};

// Check if multiple users are admins
export const getUsersAdminStatus = async (userIds = [], userEmails = []) => {
  try {
    const db = getDatabase();
    const adminsRef = ref(db, "admins");
    const snapshot = await get(adminsRef);

    if (!snapshot.exists()) return {};

    const admins = snapshot.val();
    const adminStatus = {};

    userIds.forEach((uid) => {
      adminStatus[uid] = admins[uid] === true;
    });

    userEmails.forEach((email) => {
      adminStatus[email] = admins[email] === true;
    });

    return adminStatus;
  } catch (error) {
    console.error("Error getting admin statuses:", error);
    return {};
  }
};

// Get all reports with optional filters
export const getReports = async (filters = {}) => {
  try {
    const db = getDatabase();
    const reportsRef = ref(db, "reports");
    const snapshot = await get(reportsRef);

    if (!snapshot.exists()) return [];

    let reports = [];
    snapshot.forEach((childSnapshot) => {
      reports.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    if (filters.status) {
      reports = reports.filter((r) => r.status === filters.status);
    }
    if (filters.type) {
      reports = reports.filter((r) => r.type === filters.type);
    }

    return reports.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
};

// Get single report by ID
export const getReportById = async (reportId) => {
  try {
    const db = getDatabase();
    const reportRef = ref(db, `reports/${reportId}`);
    const snapshot = await get(reportRef);

    if (snapshot.exists()) {
      return {
        id: reportId,
        ...snapshot.val(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
};

// Update report status
export const updateReportStatus = async (reportId, status, adminNote = "") => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) throw new Error("Not authenticated");

    const db = getDatabase();
    const reportRef = ref(db, `reports/${reportId}`);

    await update(reportRef, {
      status: status,
      resolvedBy: user.uid,
      resolvedAt: Date.now(),
      adminNote: adminNote,
    });

    return true;
  } catch (error) {
    console.error("Error updating report:", error);
    return false;
  }
};

// Issue warning to user
export const issueWarning = async (userId, reason, issuedBy) => {
  try {
    const db = getDatabase();
    const warningRef = ref(db, `warnings/${userId}`);
    const newWarningRef = push(warningRef);

    const warningData = {
      id: newWarningRef.key,
      reason: reason,
      issuedBy: issuedBy,
      issuedAt: Date.now(),
      status: "active",
    };

    await set(newWarningRef, warningData);

    const warningsSnapshot = await get(warningRef);
    let activeWarnings = 0;
    warningsSnapshot.forEach((childSnapshot) => {
      if (childSnapshot.val().status === "active") {
        activeWarnings++;
      }
    });

    if (activeWarnings >= 3) {
      await banUser(userId, "Automatically banned after 3 warnings", issuedBy);
    }

    return newWarningRef.key;
  } catch (error) {
    console.error("Error issuing warning:", error);
    throw error;
  }
};

// Get user's warnings
export const getUserWarnings = async (userId) => {
  try {
    const db = getDatabase();
    const warningsRef = ref(db, `warnings/${userId}`);
    const snapshot = await get(warningsRef);

    if (!snapshot.exists()) return [];

    const warnings = [];
    snapshot.forEach((childSnapshot) => {
      warnings.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return warnings.sort((a, b) => b.issuedAt - a.issuedAt);
  } catch (error) {
    console.error("Error fetching warnings:", error);
    return [];
  }
};

// Ban user
export const banUser = async (
  userId,
  reason,
  bannedBy,
  duration = "permanent",
) => {
  try {
    const db = getDatabase();
    const banRef = ref(db, `bans/${userId}`);

    const banData = {
      reason: reason,
      bannedBy: bannedBy,
      bannedAt: Date.now(),
      duration: duration,
      expiresAt:
        duration === "permanent" ? null : Date.now() + getDurationMs(duration),
    };

    await set(banRef, banData);

    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      banned: true,
      banReason: reason,
      bannedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Error banning user:", error);
    return false;
  }
};

// Convert duration string to milliseconds
const getDurationMs = (duration) => {
  const durations = {
    "1day": 24 * 60 * 60 * 1000,
    "3days": 3 * 24 * 60 * 60 * 1000,
    "1week": 7 * 24 * 60 * 60 * 1000,
    permanent: null,
  };
  return durations[duration] || 24 * 60 * 60 * 1000;
};

// Check if user is banned
export const isUserBanned = async (userId) => {
  try {
    const db = getDatabase();
    const banRef = ref(db, `bans/${userId}`);
    const snapshot = await get(banRef);

    if (!snapshot.exists()) return { banned: false };

    const banData = snapshot.val();

    if (banData.expiresAt && banData.expiresAt < Date.now()) {
      await remove(banRef);
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, { banned: false });
      return { banned: false };
    }

    return {
      banned: true,
      reason: banData.reason,
      expiresAt: banData.expiresAt,
      duration: banData.duration,
    };
  } catch (error) {
    console.error("Error checking ban status:", error);
    return { banned: false };
  }
};

// Unban user
export const unbanUser = async (userId) => {
  try {
    const db = getDatabase();
    const banRef = ref(db, `bans/${userId}`);
    await remove(banRef);

    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { banned: false });

    return true;
  } catch (error) {
    console.error("Error unbanning user:", error);
    return false;
  }
};

// Get all banned users
export const getBannedUsers = async () => {
  try {
    const db = getDatabase();
    const bansRef = ref(db, "bans");
    const snapshot = await get(bansRef);

    if (!snapshot.exists()) return [];

    const bans = [];
    snapshot.forEach((childSnapshot) => {
      bans.push({
        userId: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    const bannedUsers = await Promise.all(
      bans.map(async (ban) => {
        const userRef = ref(db, `users/${ban.userId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          return {
            ...ban,
            userData: userSnapshot.val(),
          };
        }
        return ban;
      }),
    );

    return bannedUsers.sort((a, b) => b.bannedAt - a.bannedAt);
  } catch (error) {
    console.error("Error fetching banned users:", error);
    return [];
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) return [];

    const users = [];
    snapshot.forEach((childSnapshot) => {
      users.push({
        uid: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    const allUsers = await getAllUsers();
    return allUsers.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

// Add admin note
export const addAdminNote = async (userId, note, addedBy) => {
  try {
    const db = getDatabase();
    const notesRef = ref(db, `adminNotes/${userId}`);
    const newNoteRef = push(notesRef);

    await set(newNoteRef, {
      note: note,
      addedBy: addedBy,
      addedAt: Date.now(),
    });

    return newNoteRef.key;
  } catch (error) {
    console.error("Error adding admin note:", error);
    throw error;
  }
};

// Get admin notes
export const getAdminNotes = async (userId) => {
  try {
    const db = getDatabase();
    const notesRef = ref(db, `adminNotes/${userId}`);
    const snapshot = await get(notesRef);

    if (!snapshot.exists()) return [];

    const notes = [];
    snapshot.forEach((childSnapshot) => {
      notes.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return notes.sort((a, b) => b.addedAt - a.addedAt);
  } catch (error) {
    console.error("Error fetching admin notes:", error);
    return [];
  }
};

// Get moderation statistics
export const getModerationStats = async () => {
  try {
    const db = getDatabase();
    const reportsRef = ref(db, "reports");
    const reportsSnapshot = await get(reportsRef);
    const bansRef = ref(db, "bans");
    const bansSnapshot = await get(bansRef);
    const warningsRef = ref(db, "warnings");
    const warningsSnapshot = await get(warningsRef);

    let totalReports = 0;
    let pendingReports = 0;
    let resolvedReports = 0;
    let dismissedReports = 0;

    if (reportsSnapshot.exists()) {
      reportsSnapshot.forEach((childSnapshot) => {
        totalReports++;
        const status = childSnapshot.val().status;
        if (status === "pending") pendingReports++;
        else if (status === "resolved") resolvedReports++;
        else if (status === "dismissed") dismissedReports++;
      });
    }

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      totalBans: bansSnapshot.exists() ? bansSnapshot.size : 0,
      totalWarnings: warningsSnapshot.exists() ? warningsSnapshot.size : 0,
    };
  } catch (error) {
    console.error("Error getting moderation stats:", error);
    return {
      totalReports: 0,
      pendingReports: 0,
      resolvedReports: 0,
      dismissedReports: 0,
      totalBans: 0,
      totalWarnings: 0,
    };
  }
};
