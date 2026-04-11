// reportService.js - Report and block system for user moderation
import { database } from "../firebase";
import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";

// Report reasons for users to select from
export const REPORT_REASONS = [
  { id: "spam", label: "Spam or advertising" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "cheating", label: "Cheating or exploiting" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "hate_speech", label: "Hate speech" },
  { id: "other", label: "Other" },
];

// Submit a report against a user
export const submitReport = async (
  reporterId,
  reportedUserId,
  reason,
  details = "",
) => {
  try {
    const reportsRef = ref(database, "reports");
    const newReportRef = push(reportsRef);

    const reportData = {
      reporterId: reporterId,
      reportedUserId: reportedUserId,
      reason: reason,
      details: details,
      status: "pending",
      timestamp: Date.now(),
      reviewedAt: null,
      reviewedBy: null,
    };

    await set(newReportRef, reportData);

    const userReportRef = ref(
      database,
      `userReports/${reporterId}/${newReportRef.key}`,
    );
    await set(userReportRef, {
      reportedUserId: reportedUserId,
      reason: reason,
      timestamp: Date.now(),
    });

    return { success: true, reportId: newReportRef.key };
  } catch (error) {
    console.error("Error submitting report:", error);
    return { success: false, error: error.message };
  }
};

// Block a user
export const blockUser = async (userId, userToBlockId) => {
  try {
    if (userId === userToBlockId) {
      return { success: false, error: "You cannot block yourself" };
    }

    const blockRef = ref(database, `blocks/${userId}/${userToBlockId}`);

    await set(blockRef, {
      blockedUserId: userToBlockId,
      blockedAt: Date.now(),
    });

    const userRef = ref(database, `users/${userId}/friends`);
    const userSnapshot = await get(userRef);
    const userFriends = userSnapshot.val() || [];
    const updatedFriends = userFriends.filter(
      (f) => f.userId !== userToBlockId,
    );
    await set(userRef, updatedFriends);

    const otherUserRef = ref(database, `users/${userToBlockId}/friends`);
    const otherSnapshot = await get(otherUserRef);
    const otherFriends = otherSnapshot.val() || [];
    const updatedOtherFriends = otherFriends.filter((f) => f.userId !== userId);
    await set(otherUserRef, updatedOtherFriends);

    return { success: true };
  } catch (error) {
    console.error("Error blocking user:", error);
    return { success: false, error: error.message };
  }
};

// Unblock a user
export const unblockUser = async (userId, userToUnblockId) => {
  try {
    const blockRef = ref(database, `blocks/${userId}/${userToUnblockId}`);
    await set(blockRef, null);
    return { success: true };
  } catch (error) {
    console.error("Error unblocking user:", error);
    return { success: false, error: error.message };
  }
};

// Check if a user is blocked
export const isUserBlocked = async (userId, otherUserId) => {
  try {
    const blockRef = ref(database, `blocks/${userId}/${otherUserId}`);
    const snapshot = await get(blockRef);
    return snapshot.exists();
  } catch (error) {
    console.error("Error checking block status:", error);
    return false;
  }
};

// Get all users blocked by current user
export const getBlockedUsers = (userId, callback) => {
  const blocksRef = ref(database, `blocks/${userId}`);

  return onValue(blocksRef, async (snapshot) => {
    const blockedUsers = [];

    if (snapshot.exists()) {
      const promises = [];

      snapshot.forEach((child) => {
        const blockData = child.val();
        const userPromise = get(
          ref(database, `users/${blockData.blockedUserId}`),
        ).then((userSnap) => ({
          userId: blockData.blockedUserId,
          blockedAt: blockData.blockedAt,
          displayName: userSnap.val()?.displayName || "Unknown User",
        }));
        promises.push(userPromise);
      });

      const results = await Promise.all(promises);
      callback(results);
    } else {
      callback([]);
    }
  });
};

// Get reports submitted by a user (for history)
export const getUserReports = (userId, callback) => {
  const userReportsRef = ref(database, `userReports/${userId}`);

  return onValue(userReportsRef, async (snapshot) => {
    const reports = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        reports.push({ id: child.key, ...child.val() });
      });
      callback(reports);
    } else {
      callback([]);
    }
  });
};

// Get all pending reports (admin only)
export const getPendingReports = (callback) => {
  const reportsRef = ref(database, "reports");
  const reportsQuery = query(
    reportsRef,
    orderByChild("status"),
    equalTo("pending"),
  );

  return onValue(reportsQuery, async (snapshot) => {
    const reports = [];

    if (snapshot.exists()) {
      const promises = [];

      snapshot.forEach((child) => {
        const reportData = child.val();

        const reporterPromise = get(
          ref(database, `users/${reportData.reporterId}`),
        ).then((snap) => ({
          reporterName: snap.val()?.displayName || "Unknown",
        }));

        const reportedPromise = get(
          ref(database, `users/${reportData.reportedUserId}`),
        ).then((snap) => ({
          reportedName: snap.val()?.displayName || "Unknown",
        }));

        promises.push(
          Promise.all([reporterPromise, reportedPromise]).then(
            ([reporter, reported]) => ({
              id: child.key,
              ...reportData,
              reporterName: reporter.reporterName,
              reportedName: reported.reportedName,
            }),
          ),
        );
      });

      const results = await Promise.all(promises);
      callback(results);
    } else {
      callback([]);
    }
  });
};

// Mark report as reviewed (admin only)
export const markReportReviewed = async (reportId, adminId) => {
  try {
    const reportRef = ref(database, `reports/${reportId}`);
    await update(reportRef, {
      status: "reviewed",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking report as reviewed:", error);
    return { success: false, error: error.message };
  }
};

// Dismiss report (admin only)
export const dismissReport = async (reportId, adminId) => {
  try {
    const reportRef = ref(database, `reports/${reportId}`);
    await update(reportRef, {
      status: "dismissed",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error dismissing report:", error);
    return { success: false, error: error.message };
  }
};
