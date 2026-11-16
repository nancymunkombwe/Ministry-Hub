const db = require("../config/db");

const ALLOWED_SERVICE_TYPES = [
    "Sabbath Service",
    "Sabbath School",
    "Midweek Service",
    "Vespers",
    "Department Meeting",
    "Special Program",
    "Other"
];

// =====================================================
// CREATE ATTENDANCE SESSION
// =====================================================
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

    if (!ALLOWED_SERVICE_TYPES.includes(service_type)) {
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
            console.error("Create attendance session error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to create attendance session"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Attendance session created successfully",
            session_id: result.insertId
        });
    });
};

// =====================================================
// GET ALL ATTENDANCE SESSIONS
// =====================================================
const getAttendanceSessions = (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.session_date,
            s.service_type,
            s.department_id,
            s.notes,
            s.created_by,
            s.created_at,
            d.name AS department_name,
            u.full_name AS created_by_name
        FROM attendance_sessions s
        LEFT JOIN departments d
            ON s.department_id = d.id
        LEFT JOIN users u
            ON s.created_by = u.id
        ORDER BY
            s.session_date DESC,
            s.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Get attendance sessions error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch attendance sessions"
            });
        }

        return res.json({
            success: true,
            count: results.length,
            sessions: results
        });
    });
};

// =====================================================
// DELETE ATTENDANCE SESSION
// =====================================================
const deleteAttendanceSession = (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required"
        });
    }

    // First confirm that the session exists.
    const findSessionSql = `
        SELECT id
        FROM attendance_sessions
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        findSessionSql,
        [sessionId],
        (findError, sessions) => {
            if (findError) {
                console.error(
                    "Find attendance session error:",
                    findError
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to find attendance session"
                });
            }

            if (sessions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance session not found"
                });
            }

            // Delete attendance records belonging to this session.
            const deleteRecordsSql = `
                DELETE FROM attendance_records
                WHERE session_id = ?
            `;

            db.query(
                deleteRecordsSql,
                [sessionId],
                (recordsError, recordsResult) => {
                    if (recordsError) {
                        console.error(
                            "Delete attendance records error:",
                            recordsError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to delete attendance records"
                        });
                    }

                    // Now delete the session itself.
                    const deleteSessionSql = `
                        DELETE FROM attendance_sessions
                        WHERE id = ?
                    `;

                    db.query(
                        deleteSessionSql,
                        [sessionId],
                        (sessionError, sessionResult) => {
                            if (sessionError) {
                                console.error(
                                    "Delete attendance session error:",
                                    sessionError
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Attendance records were removed, but the session could not be deleted"
                                });
                            }

                            return res.json({
                                success: true,
                                message:
                                    "Attendance session deleted successfully",
                                deleted_session_id: sessionId,
                                deleted_records:
                                    recordsResult.affectedRows,
                                deleted_sessions:
                                    sessionResult.affectedRows
                            });
                        }
                    );
                }
            );
        }
    );
};

// =====================================================
// MARK OR UPDATE MEMBER ATTENDANCE
// =====================================================
const markAttendance = (req, res) => {
    const {
        session_id,
        member_id,
        status,
        remarks
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

    const findSql = `
        SELECT id
        FROM attendance_records
        WHERE session_id = ?
          AND member_id = ?
        LIMIT 1
    `;

    db.query(
        findSql,
        [session_id, member_id],
        (findError, existingRecords) => {
            if (findError) {
                console.error(
                    "Find attendance record error:",
                    findError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to check existing attendance record"
                });
            }

            if (existingRecords.length > 0) {
                const recordId = existingRecords[0].id;

                const updateSql = `
                    UPDATE attendance_records
                    SET
                        status = ?,
                        remarks = ?,
                        marked_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.query(
                    updateSql,
                    [
                        attendanceStatus,
                        remarks || null,
                        recordId
                    ],
                    (updateError) => {
                        if (updateError) {
                            console.error(
                                "Update attendance record error:",
                                updateError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Failed to update attendance"
                            });
                        }

                        return res.json({
                            success: true,
                            message:
                                "Attendance updated successfully",
                            record_id: recordId
                        });
                    }
                );

                return;
            }

            const insertSql = `
                INSERT INTO attendance_records (
                    session_id,
                    member_id,
                    status,
                    remarks
                )
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    session_id,
                    member_id,
                    attendanceStatus,
                    remarks || null
                ],
                (insertError, result) => {
                    if (insertError) {
                        console.error(
                            "Insert attendance record error:",
                            insertError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to mark attendance"
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message:
                            "Attendance marked successfully",
                        record_id: result.insertId
                    });
                }
            );
        }
    );
};

// =====================================================
// GET ATTENDANCE RECORDS FOR ONE SESSION
// =====================================================
const getSessionAttendance = (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required"
        });
    }

    const sql = `
        SELECT
            ar.id,
            ar.session_id,
            ar.member_id,
            ar.status,
            ar.remarks,
            ar.marked_at,
            m.first_name,
            m.last_name,
            m.gender,
            m.phone
        FROM attendance_records ar
        JOIN members m
            ON ar.member_id = m.id
        WHERE ar.session_id = ?
        ORDER BY
            m.last_name ASC,
            m.first_name ASC
    `;

    db.query(sql, [sessionId], (error, results) => {
        if (error) {
            console.error(
                "Get session attendance error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch session attendance"
            });
        }

        return res.json({
            success: true,
            count: results.length,
            records: results
        });
    });
};

// =====================================================
// GET ATTENDANCE HISTORY FOR ONE MEMBER
// =====================================================
const getMemberAttendanceHistory = (req, res) => {
    const { memberId } = req.params;

    if (!memberId) {
        return res.status(400).json({
            success: false,
            message: "Member ID is required"
        });
    }

    const sql = `
        SELECT
            ar.id,
            ar.session_id,
            ar.member_id,
            ar.status,
            ar.remarks,
            ar.marked_at,
            s.session_date,
            s.service_type,
            s.notes AS session_notes,
            d.name AS department_name
        FROM attendance_records ar
        JOIN attendance_sessions s
            ON ar.session_id = s.id
        LEFT JOIN departments d
            ON s.department_id = d.id
        WHERE ar.member_id = ?
        ORDER BY
            s.session_date DESC,
            ar.marked_at DESC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            console.error(
                "Get member attendance history error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch member attendance history"
            });
        }

        return res.json({
            success: true,
            count: results.length,
            attendance_history: results
        });
    });
};

// =====================================================
// MISSING MEMBER ALERT
// =====================================================
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
        JOIN attendance_records ar
            ON m.id = ar.member_id
        JOIN attendance_sessions s
            ON ar.session_id = s.id
        WHERE ar.status = 'Absent'
          AND s.session_date >= (CURRENT_DATE - 60)
        GROUP BY
            m.id,
            m.first_name,
            m.last_name,
            m.phone,
            m.email,
            m.membership_status,
            m.follow_up_status
        HAVING COUNT(ar.id) >= 3
        ORDER BY missed_services DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error(
                "Get missing members error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch missing members"
            });
        }

        return res.json({
            success: true,
            count: results.length,
            message:
                "Members who missed 3 or more services in the last 60 days",
            missing_members: results
        });
    });
};

module.exports = {
    createAttendanceSession,
    getAttendanceSessions,
    deleteAttendanceSession,
    markAttendance,
    getSessionAttendance,
    getMemberAttendanceHistory,
    getMissingMembers
};