const express = require("express");
const attendanceController = require("../controllers/attendanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => attendanceController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing attendance controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createAttendanceSession = pickHandler(
    "createAttendanceSession",
    "createSession",
    "addAttendanceSession"
);

const getAttendanceSessions = pickHandler(
    "getAttendanceSessions",
    "getSessions",
    "getAllAttendanceSessions"
);

const markAttendance = pickHandler(
    "markAttendance",
    "createAttendanceRecord",
    "addAttendanceRecord",
    "recordAttendance"
);

const getSessionRecords = pickHandler(
    "getSessionRecords",
    "getAttendanceRecords",
    "getAttendanceRecordsBySession"
);

const getMemberAttendance = pickHandler(
    "getMemberAttendance",
    "getAttendanceByMember"
);

const getMissingMembers = pickHandler(
    "getMissingMembers",
    "getMissingMembersAlert",
    "getMissingMemberAlerts"
);

router.get("/sessions", protect, getAttendanceSessions);

router.post(
    "/sessions",
    protect,
    authorize("admin", "leader"),
    createAttendanceSession
);

router.post(
    "/records",
    protect,
    authorize("admin", "leader"),
    markAttendance
);

router.get(
    "/sessions/:sessionId/records",
    protect,
    getSessionRecords
);

router.get(
    "/member/:memberId",
    protect,
    getMemberAttendance
);

router.get(
    "/missing-members",
    protect,
    getMissingMembers
);

module.exports = router;