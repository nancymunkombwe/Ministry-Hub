const db = require("../config/db");

const getDashboardSnapshot = async (req, res) => {
    try {
        const sql = `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM members
                ) AS total_members,

                (
                    SELECT COUNT(*)
                    FROM members
                    WHERE membership_status = 'Active'
                ) AS active_members,

                (
                    SELECT COUNT(*)
                    FROM visitors
                ) AS total_visitors,

                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM contributions
                ) AS total_contributions,

                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM contributions
                    WHERE contribution_date >= date_trunc('month', CURRENT_DATE)::date
                      AND contribution_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date
                ) AS monthly_contributions,

                (
                    SELECT COUNT(*)
                    FROM care_followups
                    WHERE status IN ('Pending', 'In Progress')
                ) AS pending_care_followups,

                (
                    SELECT COUNT(*)
                    FROM tasks
                    WHERE status IN ('Pending', 'In Progress')
                ) AS pending_tasks,

                (
                    SELECT COUNT(*)
                    FROM (
                        SELECT ar.member_id
                        FROM attendance_records ar
                        INNER JOIN attendance_sessions s
                            ON ar.session_id = s.id
                        WHERE ar.status = 'Absent'
                          AND s.session_date >= (CURRENT_DATE - 30)
                          AND s.session_date < (CURRENT_DATE + 1)
                        GROUP BY ar.member_id
                        HAVING COUNT(ar.id) >= 3
                    ) AS missing_member_list
                ) AS missing_members
        `;

        const [results] = await db.promise().query(sql);

        const dashboard = results[0];

        return res.status(200).json({
            success: true,
            dashboard: {
                total_members: Number(dashboard.total_members) || 0,
                active_members: Number(dashboard.active_members) || 0,
                total_visitors: Number(dashboard.total_visitors) || 0,
                ...(["admin", "treasurer"].includes(req.user.role) ? {
                    total_contributions: Number(dashboard.total_contributions) || 0,
                    monthly_contributions: Number(dashboard.monthly_contributions) || 0
                } : {}),
                pending_care_followups:
                    Number(dashboard.pending_care_followups) || 0,
                pending_tasks: Number(dashboard.pending_tasks) || 0,
                missing_members: Number(dashboard.missing_members) || 0
            }
        });
    } catch (error) {
        console.error("Dashboard snapshot error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard summary"
        });
    }
};

module.exports = {
    getDashboardSnapshot
};