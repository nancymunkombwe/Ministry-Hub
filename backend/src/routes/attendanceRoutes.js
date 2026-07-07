const express = require("express");

const {
    createAttendanceSession,
    getAttendanceSessions,
    markAttendance,
    getSessionAttendance,
    getMemberAttendanceHistory,
    getMissingMembers
} = require("../controllers/attendanceController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/sessions", protect, authorize("admin", "leader"), createAttendanceSession);
router.get("/sessions", protect, getAttendanceSessions);

router.post("/records", protect, authorize("admin", "leader"), markAttendance);

router.get("/missing-members", protect, getMissingMembers);
router.get("/member/:memberId", protect, getMemberAttendanceHistory);
router.get("/sessions/:sessionId/records", protect, getSessionAttendance);

module.exports = router;