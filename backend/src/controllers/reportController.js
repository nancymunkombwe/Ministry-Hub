const db = require("../config/db");

/* =========================================================
   SHARED HELPERS
========================================================= */

const getToday = () => {
    const today = new Date();

    return today.toISOString().split("T")[0];
};

const isValidDate = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00`);

    return !Number.isNaN(date.getTime());
};

const getDateRange = (req, res) => {
    const today = getToday();

    const from = req.query.from || "1900-01-01";
    const to = req.query.to || today;

    if (!isValidDate(from) || !isValidDate(to)) {
        res.status(400).json({
            success: false,
            message: "Invalid date range. Use YYYY-MM-DD."
        });

        return null;
    }

    if (from > to) {
        res.status(400).json({
            success: false,
            message: "The start date cannot be after the end date."
        });

        return null;
    }

    return {
        from,
        to
    };
};

const query = (sql, values = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(results);
        });
    });
};


/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

const getDashboardSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    /*
     * The dashboard is a period report. Every date-sensitive metric
     * therefore uses the same selected range as the other reports.
     * The end date is inclusive, including DATETIME values later that day.
     */
    const sql = `
        SELECT

            /* =========================
               MEMBERS
            ========================= */

            (
                SELECT COUNT(*)
                FROM members
                WHERE date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
            ) AS total_members,

            (
                SELECT COUNT(*)
                FROM members
                WHERE membership_status = 'Active'
                AND date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
            ) AS active_members,


            /* =========================
               VISITORS
            ========================= */

            (
                SELECT COUNT(*)
                FROM visitors
                WHERE visit_date >= ?
                AND visit_date < (?::date + 1)
            ) AS total_visitors,


            /* =========================
               CONTRIBUTIONS
            ========================= */

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM contributions
                WHERE contribution_date >= ?
                AND contribution_date < (?::date + 1)
            ) AS total_contributions,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM contributions
                WHERE contribution_date >= ?
                AND contribution_date < (?::date + 1)
            ) AS monthly_contributions,


            /* =========================
               CARE FOLLOW-UPS
            ========================= */

            (
                SELECT COUNT(*)
                FROM care_followups
                WHERE status IN ('Pending', 'In Progress')
                AND due_date >= ?
                AND due_date < (?::date + 1)
            ) AS pending_care_followups,


            /* =========================
               TASKS
            ========================= */

            (
                SELECT COUNT(*)
                FROM tasks
                WHERE status IN ('Pending', 'In Progress')
                AND due_date >= ?
                AND due_date < (?::date + 1)
            ) AS pending_tasks,


            /* =========================
               MISSING MEMBERS
            ========================= */

            (
                SELECT COUNT(*)
                FROM members m
                WHERE m.id IN (

                    SELECT ar.member_id
                    FROM attendance_records ar
                    JOIN attendance_sessions s
                        ON ar.session_id = s.id
                    WHERE ar.status = 'Absent'
                    AND s.session_date >= ?
                    AND s.session_date < (?::date + 1)
                    GROUP BY ar.member_id
                    HAVING COUNT(ar.id) >= 3
                )
            ) AS missing_members
    `;

    try {
        const results = await query(sql, [
            to, to,
            from, to,
            from, to,
            from, to,
            from, to,
            from, to,
            from, to
        ]);

        const dashboard = results[0] || {
                total_members: 0,
                active_members: 0,
                total_visitors: 0,
                total_contributions: 0,
                monthly_contributions: 0,
                pending_care_followups: 0,
                pending_tasks: 0,
                missing_members: 0
            };
        if (!["admin", "treasurer"].includes(req.user.role)) {
            delete dashboard.total_contributions;
            delete dashboard.monthly_contributions;
        }
        res.json({ success: true, dashboard,
            period: {
                from,
                to
            }
        });
    } catch (error) {
        console.error(
            "Dashboard report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary"
        });
    }
};

/* =========================================================
   CHURCH HEALTH
========================================================= */

const getChurchHealthSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    const queries = {
        member_status: `
            SELECT
                COALESCE(membership_status, 'Unknown') AS membership_status,
                COUNT(*) AS total
            FROM members
            WHERE date_joined_church IS NOT NULL
            AND date_joined_church < (?::date + 1)
            GROUP BY membership_status
            ORDER BY membership_status
        `,

        care_followups: `
            SELECT
                COALESCE(status, 'Unknown') AS status,
                COUNT(*) AS total
            FROM care_followups
            WHERE due_date >= ?
            AND due_date < (?::date + 1)
            GROUP BY status
            ORDER BY status
        `,

        tasks: `
            SELECT
                COALESCE(status, 'Unknown') AS status,
                COUNT(*) AS total
            FROM tasks
            WHERE due_date >= ?
            AND due_date < (?::date + 1)
            GROUP BY status
            ORDER BY status
        `,

        visitor_followups: `
            SELECT
                COALESCE(follow_up_status, 'Not Started') AS follow_up_status,
                COUNT(*) AS total
            FROM visitors
            WHERE visit_date >= ?
            AND visit_date < (?::date + 1)
            GROUP BY follow_up_status
            ORDER BY follow_up_status
        `
    };

    try {
        const [
            memberStatus,
            careFollowups,
            tasks,
            visitorFollowups
        ] = await Promise.all([
            query(queries.member_status, [to]),
            query(queries.care_followups, [from, to]),
            query(queries.tasks, [from, to]),
            query(queries.visitor_followups, [from, to])
        ]);

        res.json({
            success: true,
            period: { from, to },
            church_health: {
                member_status: memberStatus,
                care_followups: careFollowups,
                tasks,
                visitor_followups: visitorFollowups
            }
        });
    } catch (error) {
        console.error(
            "Church health report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch church health summary"
        });
    }
};

/* =========================================================
   MEMBERS REPORT
========================================================= */

const getMemberSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    const includeDetails =
        String(req.query.details).toLowerCase() === "true";

    try {
        const summarySql = `
            SELECT

                COUNT(*) AS total_members,

                SUM(
                    CASE
                        WHEN membership_status = 'Active'
                        THEN 1
                        ELSE 0
                    END
                ) AS active_members,

                SUM(
                    CASE
                        WHEN membership_status = 'Inactive'
                        THEN 1
                        ELSE 0
                    END
                ) AS inactive_members,

                SUM(
                    CASE
                        WHEN baptism_status = 'Baptized'
                        AND baptism_date IS NOT NULL
                        AND baptism_date <= ?
                        THEN 1
                        ELSE 0
                    END
                ) AS baptized_members,

                SUM(
                    CASE
                        WHEN LOWER(gender) = 'male'
                        THEN 1
                        ELSE 0
                    END
                ) AS male_members,

                SUM(
                    CASE
                        WHEN LOWER(gender) = 'female'
                        THEN 1
                        ELSE 0
                    END
                ) AS female_members,

                SUM(
                    CASE
                        WHEN date_of_birth IS NOT NULL
                        AND EXTRACT(YEAR FROM age(?::date, date_of_birth)) < 18
                        THEN 1
                        ELSE 0
                    END
                ) AS children,

                SUM(
                    CASE
                        WHEN date_of_birth IS NOT NULL
                        AND EXTRACT(YEAR FROM age(?::date, date_of_birth)) >= 18
                        THEN 1
                        ELSE 0
                    END
                ) AS adults

            FROM members

            WHERE
                date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
        `;

        const newMembersSql = `
            SELECT COUNT(*) AS total
            FROM members
            WHERE date_joined_church >= ?
            AND date_joined_church < (?::date + 1)
        `;

        const unknownJoinDateSql = `
            SELECT COUNT(*) AS total
            FROM members
            WHERE date_joined_church IS NULL
        `;

        const baptismPeriodSql = `
            SELECT COUNT(*) AS total
            FROM members
            WHERE baptism_date >= ?
            AND baptism_date < (?::date + 1)
        `;

        const statusSql = `
            SELECT
                COALESCE(
                    membership_status,
                    'Unknown'
                ) AS membership_status,
                COUNT(*) AS total
            FROM members
            WHERE
                date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
            GROUP BY membership_status
            ORDER BY membership_status
        `;

        const baptismSql = `
            SELECT
                COALESCE(
                    baptism_status,
                    'Unknown'
                ) AS baptism_status,
                COUNT(*) AS total
            FROM members
            WHERE
                date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
            GROUP BY baptism_status
            ORDER BY baptism_status
        `;

        const genderSql = `
            SELECT
                COALESCE(
                    gender,
                    'Unknown'
                ) AS gender,
                COUNT(*) AS total
            FROM members
            WHERE
                date_joined_church IS NOT NULL
                AND date_joined_church < (?::date + 1)
            GROUP BY gender
            ORDER BY gender
        `;

        const departmentSql = `
            SELECT
                COALESCE(
                    d.name,
                    'Not Assigned'
                ) AS department_name,
                COUNT(*) AS total_members
            FROM members m
            LEFT JOIN departments d
                ON m.department_id = d.id
            WHERE
                m.date_joined_church IS NOT NULL
                AND m.date_joined_church < (?::date + 1)
            GROUP BY d.id, d.name
            ORDER BY department_name
        `;

        const [
            summaryResult,
            newMembersResult,
            unknownJoinDateResult,
            baptismPeriodResult,
            statusResult,
            baptismResult,
            genderResult,
            departmentResult
        ] = await Promise.all([
            query(summarySql, [
                to,
                to,
                to,
                to
            ]),

            query(newMembersSql, [
                from,
                to
            ]),

            query(unknownJoinDateSql),

            query(baptismPeriodSql, [
                from,
                to
            ]),

            query(statusSql, [to]),

            query(baptismSql, [to]),

            query(genderSql, [to]),

            query(departmentSql, [to])
        ]);

        let members = [];

        if (includeDetails) {
            const detailSql = `
                SELECT
                    id,
                    first_name,
                    last_name,
                    gender,
                    date_of_birth,
                    phone,
                    email,
                    address,
                    marital_status,
                    spouse_name,
                    number_of_children,
                    occupation,
                    employer,
                    date_joined_church,
                    baptism_status,
                    baptism_date,
                    membership_status,
                    follow_up_status,
                    ministry_role,
                    created_at
                FROM members
                WHERE
                    date_joined_church IS NOT NULL
                    AND date_joined_church < (?::date + 1)
                ORDER BY
                    last_name ASC,
                    first_name ASC
            `;

            members = await query(detailSql, [to]);
        }

        const summary = summaryResult[0] || {};

        res.json({
            success: true,

            report_type: "membership",

            period: {
                from,
                to
            },

            membership_summary: {
                total_members:
                    Number(summary.total_members || 0),

                active_members:
                    Number(summary.active_members || 0),

                inactive_members:
                    Number(summary.inactive_members || 0),

                baptized_members:
                    Number(summary.baptized_members || 0),

                male_members:
                    Number(summary.male_members || 0),

                female_members:
                    Number(summary.female_members || 0),

                children:
                    Number(summary.children || 0),

                adults:
                    Number(summary.adults || 0),

                new_members:
                    Number(
                        newMembersResult[0]?.total || 0
                    ),

                baptisms_during_period:
                    Number(
                        baptismPeriodResult[0]?.total || 0
                    ),

                members_without_join_date:
                    Number(
                        unknownJoinDateResult[0]?.total || 0
                    )
            },

            status_summary: statusResult,

            baptism_summary: baptismResult,

            gender_summary: genderResult,

            department_summary: departmentResult,

            members: includeDetails ? members : []
        });
    } catch (error) {
        console.error(
            "Member report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch membership report"
        });
    }
};


/* =========================================================
   ATTENDANCE REPORT
========================================================= */

const getAttendanceSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    const includeDetails =
        String(req.query.details).toLowerCase() === "true";

    try {
        const sessionSql = `
            SELECT
                s.id,
                s.session_date,
                s.service_type,

                COALESCE(
                    d.name,
                    'General'
                ) AS department_name,

                COUNT(ar.id) AS total_records,

                SUM(
                    CASE
                        WHEN ar.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_count,

                SUM(
                    CASE
                        WHEN ar.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absent_count

            FROM attendance_sessions s

            LEFT JOIN attendance_records ar
                ON s.id = ar.session_id

            LEFT JOIN departments d
                ON s.department_id = d.id

            WHERE
                s.session_date >= ?
                AND s.session_date < (?::date + 1)

            GROUP BY
                s.id,
                s.session_date,
                s.service_type,
                d.name

            ORDER BY
                s.session_date ASC,
                s.id ASC
        `;

        const statusSql = `
            SELECT
                ar.status,
                COUNT(*) AS total
            FROM attendance_records ar

            JOIN attendance_sessions s
                ON ar.session_id = s.id

            WHERE
                s.session_date >= ?
                AND s.session_date < (?::date + 1)

            GROUP BY ar.status
            ORDER BY ar.status
        `;

        const serviceSql = `
            SELECT
                s.service_type,

                COUNT(DISTINCT s.id) AS sessions,

                SUM(
                    CASE
                        WHEN ar.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_count,

                SUM(
                    CASE
                        WHEN ar.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absent_count

            FROM attendance_sessions s

            LEFT JOIN attendance_records ar
                ON s.id = ar.session_id

            WHERE
                s.session_date >= ?
                AND s.session_date < (?::date + 1)

            GROUP BY s.service_type
            ORDER BY s.service_type
        `;

        const [
            sessions,
            statusSummary,
            serviceSummary
        ] = await Promise.all([
            query(sessionSql, [
                from,
                to
            ]),

            query(statusSql, [
                from,
                to
            ]),

            query(serviceSql, [
                from,
                to
            ])
        ]);

        const present = sessions.reduce(
            (sum, session) =>
                sum + Number(
                    session.present_count || 0
                ),
            0
        );

        const absent = sessions.reduce(
            (sum, session) =>
                sum + Number(
                    session.absent_count || 0
                ),
            0
        );

        const totalMarked =
            present + absent;

        const attendanceRate =
            totalMarked > 0
                ? Math.round(
                      (present / totalMarked) * 100
                  )
                : 0;

        const averageAttendance =
            sessions.length > 0
                ? Math.round(
                      present / sessions.length
                  )
                : 0;

        const highestAttendance =
            sessions.length > 0
                ? Math.max(
                      ...sessions.map(
                          (session) =>
                              Number(
                                  session.present_count ||
                                  0
                              )
                      )
                  )
                : 0;

        const lowestAttendance =
            sessions.length > 0
                ? Math.min(
                      ...sessions.map(
                          (session) =>
                              Number(
                                  session.present_count ||
                                  0
                              )
                      )
                  )
                : 0;

        let attendanceRecords = [];

        if (includeDetails) {
            const detailSql = `
                SELECT
                    ar.id,
                    ar.member_id,

                    CONCAT(
                        m.first_name,
                        ' ',
                        m.last_name
                    ) AS member_name,

                    ar.status,
                    ar.remarks,

                    s.session_date,
                    s.service_type,

                    COALESCE(
                        d.name,
                        'General'
                    ) AS department_name

                FROM attendance_records ar

                JOIN attendance_sessions s
                    ON ar.session_id = s.id

                JOIN members m
                    ON ar.member_id = m.id

                LEFT JOIN departments d
                    ON s.department_id = d.id

                WHERE
                    s.session_date >= ?
                    AND s.session_date < (?::date + 1)

                ORDER BY
                    s.session_date ASC,
                    m.last_name ASC,
                    m.first_name ASC
            `;

            attendanceRecords = await query(
                detailSql,
                [
                    from,
                    to
                ]
            );
        }

        res.json({
            success: true,

            report_type: "attendance",

            period: {
                from,
                to
            },

            totals: {
                sessions: sessions.length,
                present,
                absent,
                total_marked: totalMarked,
                attendance_rate: attendanceRate,
                average_attendance: averageAttendance,
                highest_attendance: highestAttendance,
                lowest_attendance: lowestAttendance
            },

            status_summary: statusSummary,

            service_summary: serviceSummary,

            sessions,

            attendance_records:
                includeDetails
                    ? attendanceRecords
                    : []
        });
    } catch (error) {
        console.error(
            "Attendance report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance report"
        });
    }
};


/* =========================================================
   CONTRIBUTIONS REPORT
========================================================= */

const getContributionSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    const includeDetails =
        String(req.query.details).toLowerCase() === "true";

    try {
        const categorySql = `
            SELECT
                contribution_category,

                COUNT(*) AS number_of_records,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total_amount,

                COALESCE(
                    AVG(amount),
                    0
                ) AS average_amount

            FROM contributions

            WHERE
                contribution_date >= ?
                AND contribution_date < (?::date + 1)

            GROUP BY contribution_category

            ORDER BY total_amount DESC
        `;

        const totalsSql = `
            SELECT

                COUNT(*) AS record_count,

                COALESCE(
                    SUM(amount),
                    0
                ) AS overall_total,

                COALESCE(
                    AVG(amount),
                    0
                ) AS average_contribution,

                COUNT(
                    DISTINCT member_id
                ) AS unique_contributors

            FROM contributions

            WHERE
                contribution_date >= ?
                AND contribution_date < (?::date + 1)
        `;

        const monthlySql = `
            SELECT

                to_char(contribution_date, 'YYYY-MM') AS month,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total_amount,

                COUNT(*) AS record_count

            FROM contributions

            WHERE
                contribution_date >= ?
                AND contribution_date < (?::date + 1)

            GROUP BY
                to_char(contribution_date, 'YYYY-MM')

            ORDER BY month ASC
        `;

        const [
            categorySummary,
            totalsResult,
            monthlySummary
        ] = await Promise.all([
            query(categorySql, [
                from,
                to
            ]),

            query(totalsSql, [
                from,
                to
            ]),

            query(monthlySql, [
                from,
                to
            ])
        ]);

        let contributions = [];

        if (includeDetails) {
            const detailSql = `
                SELECT

                    c.id,
                    c.member_id,

                    COALESCE(
                        CONCAT(
                            m.first_name,
                            ' ',
                            m.last_name
                        ),
                        'Anonymous / Unlinked'
                    ) AS member_name,

                    c.contribution_category,
                    c.amount,
                    c.contribution_date,
                    c.notes,

                    u.full_name AS recorded_by_name

                FROM contributions c

                LEFT JOIN members m
                    ON c.member_id = m.id

                LEFT JOIN users u
                    ON c.recorded_by = u.id

                WHERE
                    c.contribution_date >= ?
                    AND c.contribution_date < (?::date + 1)

                ORDER BY
                    c.contribution_date DESC,
                    c.created_at DESC
            `;

            contributions = await query(
                detailSql,
                [
                    from,
                    to
                ]
            );
        }

        const totals =
            totalsResult[0] || {};

        res.json({
            success: true,

            report_type: "contributions",

            period: {
                from,
                to
            },

            totals: {
                record_count:
                    Number(
                        totals.record_count || 0
                    ),

                overall_total:
                    Number(
                        totals.overall_total || 0
                    ),

                average_contribution:
                    Number(
                        totals.average_contribution ||
                        0
                    ),

                unique_contributors:
                    Number(
                        totals.unique_contributors ||
                        0
                    )
            },

            category_summary:
                categorySummary,

            monthly_summary:
                monthlySummary,

            contributions
        });
    } catch (error) {
        console.error(
            "Contribution report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch contribution report"
        });
    }
};


/* =========================================================
   VISITORS REPORT
========================================================= */

const getVisitorSummary = async (req, res) => {
    const range = getDateRange(req, res);

    if (!range) {
        return;
    }

    const { from, to } = range;

    const includeDetails =
        String(req.query.details).toLowerCase() === "true";

    try {
        const totalsSql = `
            SELECT

                COUNT(*) AS total_visitors,

                SUM(
                    CASE
                        WHEN follow_up_status = 'New Visitor'
                        THEN 1
                        ELSE 0
                    END
                ) AS new_visitors,

                SUM(
                    CASE
                        WHEN follow_up_status = 'Contacted'
                        THEN 1
                        ELSE 0
                    END
                ) AS contacted,

                SUM(
                    CASE
                        WHEN follow_up_status = 'Interested'
                        THEN 1
                        ELSE 0
                    END
                ) AS interested,

                SUM(
                    CASE
                        WHEN follow_up_status = 'Joined'
                        THEN 1
                        ELSE 0
                    END
                ) AS joined,

                SUM(
                    CASE
                        WHEN follow_up_status = 'Not Interested'
                        THEN 1
                        ELSE 0
                    END
                ) AS not_interested

            FROM visitors

            WHERE
                visit_date >= ?
                AND visit_date < (?::date + 1)
        `;

        const followUpSql = `
            SELECT

                COALESCE(
                    follow_up_status,
                    'Not Started'
                ) AS follow_up_status,

                COUNT(*) AS total

            FROM visitors

            WHERE
                visit_date >= ?
                AND visit_date < (?::date + 1)

            GROUP BY follow_up_status

            ORDER BY total DESC
        `;

        const monthlySql = `
            SELECT

                to_char(visit_date, 'YYYY-MM') AS month,

                COUNT(*) AS total_visitors

            FROM visitors

            WHERE
                visit_date >= ?
                AND visit_date < (?::date + 1)

            GROUP BY
                to_char(visit_date, 'YYYY-MM')

            ORDER BY month ASC
        `;

        const [
            totalsResult,
            followUpSummary,
            monthlySummary
        ] = await Promise.all([
            query(totalsSql, [
                from,
                to
            ]),

            query(followUpSql, [
                from,
                to
            ]),

            query(monthlySql, [
                from,
                to
            ])
        ]);

        let visitors = [];

        if (includeDetails) {
            const detailSql = `
                SELECT

                    id,
                    first_name,
                    last_name,
                    phone,
                    email,
                    address,
                    visit_date,
                    invited_by,
                    follow_up_status,
                    created_at

                FROM visitors

                WHERE
                    visit_date >= ?
                    AND visit_date < (?::date + 1)

                ORDER BY
                    visit_date DESC,
                    last_name ASC,
                    first_name ASC
            `;

            visitors = await query(
                detailSql,
                [
                    from,
                    to
                ]
            );
        }

        const totals =
            totalsResult[0] || {};

        const totalVisitors =
            Number(
                totals.total_visitors || 0
            );

        const joined =
            Number(
                totals.joined || 0
            );

        const followUpConversionRate =
            totalVisitors > 0
                ? Math.round(
                      (joined /
                          totalVisitors) *
                          100
                  )
                : 0;

        res.json({
            success: true,

            report_type: "visitors",

            period: {
                from,
                to
            },

            totals: {
                total_visitors:
                    totalVisitors,

                new_visitors:
                    Number(
                        totals.new_visitors ||
                        0
                    ),

                contacted:
                    Number(
                        totals.contacted ||
                        0
                    ),

                interested:
                    Number(
                        totals.interested ||
                        0
                    ),

                joined,

                not_interested:
                    Number(
                        totals.not_interested ||
                        0
                    ),

                follow_up_conversion_rate:
                    followUpConversionRate
            },

            follow_up_summary:
                followUpSummary,

            monthly_summary:
                monthlySummary,

            visitors
        });
    } catch (error) {
        console.error(
            "Visitor report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch visitor report"
        });
    }
};


/* =========================================================
   UPCOMING EVENTS
========================================================= */

const getUpcomingEvents = async (req, res) => {
    const sql = `
        SELECT
            e.*
        FROM events e
        WHERE e.event_date >= CURRENT_DATE
        ORDER BY e.event_date ASC
    `;

    try {
        const results = await query(sql);

        res.json({
            success: true,
            events: results
        });
    } catch (error) {
        console.error(
            "Upcoming events report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming events"
        });
    }
};


/* =========================================================
   RECENT ANNOUNCEMENTS
========================================================= */

const getRecentAnnouncements = async (req, res) => {
    const sql = `
        SELECT
            a.*
        FROM announcements a
        ORDER BY
            COALESCE(
                a.created_at,
                a.announcement_date
            ) DESC
    `;

    try {
        const results = await query(sql);

        res.json({
            success: true,
            announcements: results
        });
    } catch (error) {
        console.error(
            "Recent announcements report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch recent announcements"
        });
    }
};


/* =========================================================
   EXPORT
========================================================= */

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