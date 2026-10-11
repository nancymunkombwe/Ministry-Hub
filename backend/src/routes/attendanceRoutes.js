const express = require("express");

const attendanceController = require("../controllers/attendanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all attendance sessions
router.get(
    "/sessions",
    protect,
    attendanceController.getAttendanceSessions
);

// Create an attendance session
router.post(
    "/sessions",
    protect,
    authorize("admin", "leader"),
    attendanceController.createAttendanceSession
);

// Delete an attendance session
router.delete(
    "/sessions/:sessionId",
    protect,
    authorize("admin", "leader"),
    attendanceController.deleteAttendanceSession
);

// Mark or update attendance for a member
router.post(
    "/records",
    protect,
    authorize("admin", "leader"),
    attendanceController.markAttendance
);

// Get all attendance records for a session
router.get(
    "/sessions/:sessionId/records",
    protect,
    attendanceController.getSessionAttendance
);

// Get attendance history for one member
router.get(
    "/member/:memberId",
    protect,
    attendanceController.getMemberAttendanceHistory
);

// Get members who have missed 3+ services in the last 60 days
router.get(
    "/missing-members",
    protect,
    attendanceController.getMissingMembers
);

module.exports = router;