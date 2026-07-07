const db = require("../config/db");

// CREATE ATTENDANCE SESSION
const createAttendanceSession = (req, res) => {
    const {
        session_date,
        service_type,
        department_id,
        notes
    } = req.body;

    if (!session_date || !service_type) {
        return res.status(400).json({
            success: false,
            message: "Session date and service type are required"
        });
    }

    const allowedServiceTypes = [
        "Sabbath Service",
        "Sabbath School",
        "Midweek Service",
        "Vespers",
        "Department Meeting",
        "Special Program",
        "Other"
    ];

    if (!allowedServiceTypes.includes(service_type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid service type"
        });
    }

    const sql = `
        INSERT INTO attendance_sessions (
            session_date,
            service_type,
            department_id,
            notes,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        session_date,
        service_type,
        department_id || null,
        notes || null,
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create attendance session",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Attendance session created successfully",
            session_id: result.insertId
        });
    });
};

// GET ALL ATTENDANCE SESSIONS
const getAttendanceSessions = (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.session_date,
            s.service_type,
            s.notes,
            s.created_at,
            d.name AS department_name,
            u.full_name AS created_by_name
        FROM attendance_sessions s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.session_date DESC, s.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch attendance sessions",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            sessions: results
        });
    });
};

// MARK OR UPDATE MEMBER ATTENDANCE
const markAttendance = (req, res) => {
    const {
        session_id,
        member_id,
        status
    } = req.body;

    if (!session_id || !member_id) {
        return res.status(400).json({
            success: false,
            message: "Session ID and member ID are required"
        });
    }

    const attendanceStatus = status || "Present";

    if (!["Present", "Absent"].includes(attendanceStatus)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Present or Absent"
        });
    }

    const sql = `
        INSERT INTO attendance_records (
            session_id,
            member_id,
            status
        )
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            marked_at = CURRENT_TIMESTAMP
    `;

    const values = [
        session_id,
        member_id,
        attendanceStatus
    ];

    db.query(sql, values, (error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to mark attendance",
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Attendance marked successfully"
        });
    });
};

// GET ATTENDANCE RECORDS FOR ONE SESSION
const getSessionAttendance = (req, res) => {
    const { sessionId } = req.params;

    const sql = `
        SELECT
            ar.id,
            ar.session_id,
            ar.member_id,
            ar.status,
            ar.marked_at,
            m.first_name,
            m.last_name,
            m.gender,
            m.phone
        FROM attendance_records ar
        JOIN members m ON ar.member_id = m.id
        WHERE ar.session_id = ?
        ORDER BY m.last_name ASC, m.first_name ASC
    `;

    db.query(sql, [sessionId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch session attendance",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            records: results
        });
    });
};

// GET ATTENDANCE HISTORY FOR ONE MEMBER
const getMemberAttendanceHistory = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT
            ar.id,
            ar.status,
            ar.marked_at,
            s.session_date,
            s.service_type,
            d.name AS department_name
        FROM attendance_records ar
        JOIN attendance_sessions s ON ar.session_id = s.id
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE ar.member_id = ?
        ORDER BY s.session_date DESC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch member attendance history",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            attendance_history: results
        });
    });
};

// MISSING MEMBER ALERT
const getMissingMembers = (req, res) => {
    const sql = `
        SELECT
            m.id,
            m.first_name,
            m.last_name,
            m.phone,
            m.email,
            m.membership_status,
            m.follow_up_status,
            COUNT(ar.id) AS missed_services
        FROM members m
        JOIN attendance_records ar ON m.id = ar.member_id
        JOIN attendance_sessions s ON ar.session_id = s.id
        WHERE ar.status = 'Absent'
        AND s.session_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        GROUP BY
            m.id,
            m.first_name,
            m.last_name,
            m.phone,
            m.email,
            m.membership_status,
            m.follow_up_status
        HAVING missed_services >= 3
        ORDER BY missed_services DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch missing members",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            message: "Members who missed 3 or more services in the last 60 days",
            missing_members: results
        });
    });
};

module.exports = {
    createAttendanceSession,
    getAttendanceSessions,
    markAttendance,
    getSessionAttendance,
    getMemberAttendanceHistory,
    getMissingMembers
};