const db = require("../config/db");

// DASHBOARD SUMMARY
const getDashboardSummary = async (req, res) => {
    try {
        const [totalMembers] = await db.promise().query(
            "SELECT COUNT(*) AS total_members FROM members"
        );

        const [activeMembers] = await db.promise().query(
            "SELECT COUNT(*) AS active_members FROM members WHERE membership_status = 'Active'"
        );

        const [totalVisitors] = await db.promise().query(
            "SELECT COUNT(*) AS total_visitors FROM visitors"
        );

        const [visitorsThisMonth] = await db.promise().query(
            `
            SELECT COUNT(*) AS visitors_this_month
            FROM visitors
            WHERE YEAR(visit_date) = YEAR(CURDATE())
            AND MONTH(visit_date) = MONTH(CURDATE())
            `
        );

        const [monthlyContributions] = await db.promise().query(
            `
            SELECT COALESCE(SUM(amount), 0) AS monthly_contributions
            FROM contributions
            WHERE YEAR(contribution_date) = YEAR(CURDATE())
            AND MONTH(contribution_date) = MONTH(CURDATE())
            `
        );

        const [pendingCare] = await db.promise().query(
            `
            SELECT COUNT(*) AS pending_care_followups
            FROM care_followups
            WHERE status IN ('Pending', 'In Progress')
            `
        );

        const [pendingTasks] = await db.promise().query(
            `
            SELECT COUNT(*) AS pending_tasks
            FROM tasks
            WHERE status IN ('Pending', 'In Progress')
            `
        );

        const [missingMembers] = await db.promise().query(
            `
            SELECT COUNT(*) AS missing_members
            FROM (
                SELECT
                    m.id,
                    COUNT(ar.id) AS missed_services
                FROM members m
                JOIN attendance_records ar ON m.id = ar.member_id
                JOIN attendance_sessions s ON ar.session_id = s.id
                WHERE ar.status = 'Absent'
                AND s.session_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                GROUP BY m.id
                HAVING missed_services >= 3
            ) AS missing_list
            `
        );

        res.json({
            success: true,
            dashboard: {
                total_members: totalMembers[0].total_members,
                active_members: activeMembers[0].active_members,
                total_visitors: totalVisitors[0].total_visitors,
                visitors_this_month: visitorsThisMonth[0].visitors_this_month,
                monthly_contributions: Number(monthlyContributions[0].monthly_contributions),
                pending_care_followups: pendingCare[0].pending_care_followups,
                pending_tasks: pendingTasks[0].pending_tasks,
                missing_members: missingMembers[0].missing_members
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary",
            error: error.message
        });
    }
};

// CHURCH HEALTH SUMMARY
const getChurchHealthSummary = async (req, res) => {
    try {
        const [memberStatus] = await db.promise().query(
            `
            SELECT membership_status, COUNT(*) AS total
            FROM members
            GROUP BY membership_status
            `
        );

        const [careCases] = await db.promise().query(
            `
            SELECT status, COUNT(*) AS total
            FROM care_followups
            GROUP BY status
            `
        );

        const [tasks] = await db.promise().query(
            `
            SELECT status, COUNT(*) AS total
            FROM tasks
            GROUP BY status
            `
        );

        const [visitorStatus] = await db.promise().query(
            `
            SELECT follow_up_status, COUNT(*) AS total
            FROM visitors
            GROUP BY follow_up_status
            `
        );

        res.json({
            success: true,
            church_health: {
                member_status: memberStatus,
                care_followups: careCases,
                tasks,
                visitor_followups: visitorStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch church health summary",
            error: error.message
        });
    }
};

// MEMBER SUMMARY REPORT
const getMemberSummary = async (req, res) => {
    try {
        const [statusSummary] = await db.promise().query(
            `
            SELECT membership_status, COUNT(*) AS total
            FROM members
            GROUP BY membership_status
            `
        );

        const [baptismSummary] = await db.promise().query(
            `
            SELECT baptism_status, COUNT(*) AS total
            FROM members
            GROUP BY baptism_status
            `
        );

        const [departmentSummary] = await db.promise().query(
            `
            SELECT
                d.name AS department_name,
                COUNT(md.member_id) AS total_members
            FROM departments d
            LEFT JOIN member_departments md ON d.id = md.department_id
            GROUP BY d.id, d.name
            ORDER BY d.name ASC
            `
        );

        res.json({
            success: true,
            member_summary: {
                status_summary: statusSummary,
                baptism_summary: baptismSummary,
                department_summary: departmentSummary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch member summary",
            error: error.message
        });
    }
};

// ATTENDANCE SUMMARY REPORT
const getAttendanceSummary = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({
            success: false,
            message: "Year and month are required. Example: ?year=2026&month=7"
        });
    }

    try {
        const [attendanceSummary] = await db.promise().query(
            `
            SELECT
                s.service_type,
                ar.status,
                COUNT(*) AS total
            FROM attendance_records ar
            JOIN attendance_sessions s ON ar.session_id = s.id
            WHERE YEAR(s.session_date) = ?
            AND MONTH(s.session_date) = ?
            GROUP BY s.service_type, ar.status
            ORDER BY s.service_type ASC, ar.status ASC
            `,
            [year, month]
        );

        res.json({
            success: true,
            year,
            month,
            attendance_summary: attendanceSummary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance summary",
            error: error.message
        });
    }
};

// CONTRIBUTION SUMMARY REPORT
const getContributionSummary = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({
            success: false,
            message: "Year and month are required. Example: ?year=2026&month=7"
        });
    }

    try {
        const [summary] = await db.promise().query(
            `
            SELECT
                contribution_category,
                COUNT(*) AS number_of_records,
                SUM(amount) AS total_amount
            FROM contributions
            WHERE YEAR(contribution_date) = ?
            AND MONTH(contribution_date) = ?
            GROUP BY contribution_category
            ORDER BY contribution_category ASC
            `,
            [year, month]
        );

        const overallTotal = summary.reduce((sum, item) => {
            return sum + Number(item.total_amount);
        }, 0);

        res.json({
            success: true,
            year,
            month,
            overall_total: overallTotal,
            contribution_summary: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch contribution summary",
            error: error.message
        });
    }
};

// VISITOR SUMMARY REPORT
const getVisitorSummary = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({
            success: false,
            message: "Year and month are required. Example: ?year=2026&month=7"
        });
    }

    try {
        const [summary] = await db.promise().query(
            `
            SELECT
                follow_up_status,
                COUNT(*) AS total
            FROM visitors
            WHERE YEAR(visit_date) = ?
            AND MONTH(visit_date) = ?
            GROUP BY follow_up_status
            ORDER BY follow_up_status ASC
            `,
            [year, month]
        );

        res.json({
            success: true,
            year,
            month,
            visitor_summary: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch visitor summary",
            error: error.message
        });
    }
};

// UPCOMING EVENTS
const getUpcomingEvents = async (req, res) => {
    try {
        const [events] = await db.promise().query(
            `
            SELECT
                e.id,
                e.title,
                e.event_type,
                e.event_date,
                e.event_time,
                e.location,
                d.name AS department_name
            FROM events e
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.event_date >= CURDATE()
            ORDER BY e.event_date ASC, e.event_time ASC
            LIMIT 5
            `
        );

        res.json({
            success: true,
            count: events.length,
            upcoming_events: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming events",
            error: error.message
        });
    }
};

// RECENT ANNOUNCEMENTS
const getRecentAnnouncements = async (req, res) => {
    try {
        const [announcements] = await db.promise().query(
            `
            SELECT
                a.id,
                a.title,
                a.message,
                a.target_audience,
                a.created_at,
                d.name AS target_department_name,
                u.full_name AS posted_by_name
            FROM announcements a
            LEFT JOIN departments d ON a.target_department_id = d.id
            LEFT JOIN users u ON a.posted_by = u.id
            ORDER BY a.created_at DESC
            LIMIT 5
            `
        );

        res.json({
            success: true,
            count: announcements.length,
            recent_announcements: announcements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch recent announcements",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardSummary,
    getChurchHealthSummary,
    getMemberSummary,
    getAttendanceSummary,
    getContributionSummary,
    getVisitorSummary,
    getUpcomingEvents,
    getRecentAnnouncements
};