const express = require("express");

const router = express.Router();

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
    getDashboardSnapshot
} = require("../controllers/dashboardController");


/* =========================================================
   REPORT ROUTES
========================================================= */


/*
    CURRENT DASHBOARD SNAPSHOT

    This route is specifically for the main Dashboard.

    Unlike the historical Reports dashboard, this uses
    current-state values such as:

    - All members
    - Current active members
    - All visitors
    - All-time contributions
    - Current month's contributions
    - Current pending care follow-ups
    - Current pending tasks
    - Recent missing-member attendance information

    Endpoint:

    /api/reports/current-dashboard
*/
router.get(
    "/current-dashboard",
    getDashboardSnapshot
);


/*
    HISTORICAL DASHBOARD REPORT

    This route is kept for the Reports page.

    It uses the selected reporting period.

    Endpoint:

    /api/reports/dashboard
*/
router.get(
    "/dashboard",
    getDashboardSummary
);


/*
    Church health overview

    Includes:
    - Membership status
    - Care follow-ups
    - Tasks
    - Visitor follow-up status
*/
router.get(
    "/church-health",
    getChurchHealthSummary
);


/*
    Membership report

    Optional query parameters:

    from
        YYYY-MM-DD

    to
        YYYY-MM-DD

    details
        true / false

    Example:

    /api/reports/members
        ?from=2024-01-01
        &to=2024-12-31

    Detailed register:

    /api/reports/members
        ?from=2024-01-01
        &to=2024-12-31
        &details=true
*/
router.get(
    "/members",
    getMemberSummary
);


/*
    Attendance report

    Example:

    /api/reports/attendance
        ?from=2026-01-01
        &to=2026-01-31

    Detailed attendance records:

    /api/reports/attendance
        ?from=2026-01-01
        &to=2026-01-31
        &details=true
*/
router.get(
    "/attendance",
    getAttendanceSummary
);


/*
    Contributions report

    Example:

    /api/reports/contributions
        ?from=2026-01-01
        &to=2026-01-31

    Detailed financial records:

    /api/reports/contributions
        ?from=2026-01-01
        &to=2026-01-31
        &details=true
*/
router.get(
    "/contributions",
    getContributionSummary
);


/*
    Visitors report

    Example:

    /api/reports/visitors
        ?from=2026-01-01
        &to=2026-01-31

    Detailed visitor records:

    /api/reports/visitors
        ?from=2026-01-01
        &to=2026-01-31
        &details=true
*/
router.get(
    "/visitors",
    getVisitorSummary
);


/*
    Upcoming events
*/
router.get(
    "/upcoming-events",
    getUpcomingEvents
);


/*
    Recent announcements
*/
router.get(
    "/recent-announcements",
    getRecentAnnouncements
);


module.exports = router; 