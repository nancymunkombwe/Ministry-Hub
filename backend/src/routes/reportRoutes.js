const express = require("express");

const {
    getDashboardSummary,
    getChurchHealthSummary,
    getMemberSummary,
    getAttendanceSummary,
    getContributionSummary,
    getVisitorSummary,
    getUpcomingEvents,
    getRecentAnnouncements
} = require("../controllers/reportController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, getDashboardSummary);
router.get("/church-health", protect, getChurchHealthSummary);
router.get("/members", protect, getMemberSummary);
router.get("/attendance", protect, getAttendanceSummary);
router.get("/visitors", protect, getVisitorSummary);
router.get("/upcoming-events", protect, getUpcomingEvents);
router.get("/recent-announcements", protect, getRecentAnnouncements);

// Finance report restricted to admin and treasurer only
router.get(
    "/contributions",
    protect,
    authorize("admin", "treasurer"),
    getContributionSummary
);

module.exports = router;