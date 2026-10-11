const db = require("../config/db");

/* =========================================================
   ALLOWED VALUES
========================================================= */

const ALLOWED_CATEGORIES = [
    "Tithe",
    "Offering",
    "Special Offering",
    "Donation",
    "Building Fund",
    "Welfare",
    "Camp Meeting",
    "Dorcas",
    "Youth Fund",
    "Other"
];

const ALLOWED_PAYMENT_METHODS = [
    "Cash",
    "Mobile Money",
    "Bank Transfer",
    "Cheque",
    "Other"
];


/* =========================================================
   CREATE CONTRIBUTION
========================================================= */

const createContribution = (req, res) => {
    const {
        member_id,
        contribution_category,
        amount,
        contribution_date,
        payment_method,
        notes
    } = req.body;

    if (
        !contribution_category ||
        !amount ||
        !contribution_date
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Contribution category, amount, and contribution date are required"
        });
    }

    if (!ALLOWED_CATEGORIES.includes(contribution_category)) {
        return res.status(400).json({
            success: false,
            message: "Invalid contribution category"
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero"
        });
    }

    if (
        payment_method &&
        !ALLOWED_PAYMENT_METHODS.includes(payment_method)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method"
        });
    }

    const sql = `
        INSERT INTO contributions (
            member_id,
            contribution_category,
            amount,
            contribution_date,
            payment_method,
            recorded_by,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        member_id || null,
        contribution_category,
        Number(amount),
        contribution_date,
        payment_method || null,
        req.user.id,
        notes || null
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error(
                "Create contribution error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to record contribution",
                error: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: "Contribution recorded successfully",
            contribution_id: result.insertId
        });
    });
};


/* =========================================================
   GET ALL CONTRIBUTIONS
========================================================= */

const getContributions = (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.member_id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.payment_method,
            c.notes,
            c.recorded_by,
            c.created_at,

            CONCAT(
                m.first_name,
                ' ',
                m.last_name
            ) AS member_name,

            u.full_name AS recorded_by_name

        FROM contributions c

        LEFT JOIN members m
            ON c.member_id = m.id

        LEFT JOIN users u
            ON c.recorded_by = u.id

        ORDER BY
            c.contribution_date DESC,
            c.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error(
                "Get contributions error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch contributions",
                error: error.message
            });
        }

        return res.json({
            success: true,
            count: results.length,
            contributions: results
        });
    });
};


/* =========================================================
   GET ONE CONTRIBUTION
========================================================= */

const getContributionById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            c.id,
            c.member_id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.payment_method,
            c.notes,
            c.recorded_by,
            c.created_at,

            CONCAT(
                m.first_name,
                ' ',
                m.last_name
            ) AS member_name,

            u.full_name AS recorded_by_name

        FROM contributions c

        LEFT JOIN members m
            ON c.member_id = m.id

        LEFT JOIN users u
            ON c.recorded_by = u.id

        WHERE c.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error(
                "Get contribution error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch contribution",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contribution not found"
            });
        }

        return res.json({
            success: true,
            contribution: results[0]
        });
    });
};


/* =========================================================
   GET CONTRIBUTIONS FOR ONE MEMBER
========================================================= */

const getMemberContributions = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT
            c.id,
            c.member_id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.payment_method,
            c.notes,
            c.created_at,

            u.full_name AS recorded_by_name

        FROM contributions c

        LEFT JOIN users u
            ON c.recorded_by = u.id

        WHERE c.member_id = ?

        ORDER BY
            c.contribution_date DESC,
            c.created_at DESC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            console.error(
                "Get member contributions error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch member contributions",
                error: error.message
            });
        }

        return res.json({
            success: true,
            count: results.length,
            contributions: results
        });
    });
};


/* =========================================================
   UPDATE CONTRIBUTION
========================================================= */

const updateContribution = (req, res) => {
    const { id } = req.params;

    const {
        member_id,
        contribution_category,
        amount,
        contribution_date,
        payment_method,
        notes
    } = req.body;

    if (
        !contribution_category ||
        !amount ||
        !contribution_date
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Contribution category, amount, and contribution date are required"
        });
    }

    if (!ALLOWED_CATEGORIES.includes(contribution_category)) {
        return res.status(400).json({
            success: false,
            message: "Invalid contribution category"
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero"
        });
    }

    if (
        payment_method &&
        !ALLOWED_PAYMENT_METHODS.includes(payment_method)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method"
        });
    }

    const sql = `
        UPDATE contributions

        SET
            member_id = ?,
            contribution_category = ?,
            amount = ?,
            contribution_date = ?,
            payment_method = ?,
            notes = ?

        WHERE id = ?
    `;

    const values = [
        member_id || null,
        contribution_category,
        Number(amount),
        contribution_date,
        payment_method || null,
        notes || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error(
                "Update contribution error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update contribution",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Contribution not found"
            });
        }

        return res.json({
            success: true,
            message: "Contribution updated successfully"
        });
    });
};


/* =========================================================
   DELETE CONTRIBUTION
========================================================= */

const deleteContribution = (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM contributions
        WHERE id = ?
    `;

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error(
                "Delete contribution error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to delete contribution",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Contribution not found"
            });
        }

        return res.json({
            success: true,
            message: "Contribution deleted successfully"
        });
    });
};


/* =========================================================
   MONTHLY CONTRIBUTION SUMMARY
========================================================= */

const getMonthlyContributionSummary = (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({
            success: false,
            message:
                "Year and month are required. Example: ?year=2026&month=7"
        });
    }

    const sql = `
        SELECT
            contribution_category,
            COUNT(*) AS number_of_records,
            COALESCE(
                SUM(amount),
                0
            ) AS total_amount
        FROM contributions
        WHERE
            YEAR(contribution_date) = ?
            AND MONTH(contribution_date) = ?
        GROUP BY contribution_category
        ORDER BY contribution_category ASC
    `;

    db.query(
        sql,
        [year, month],
        (error, results) => {
            if (error) {
                console.error(
                    "Monthly contribution summary error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to fetch monthly contribution summary",
                    error: error.message
                });
            }

            const overallTotal = results.reduce(
                (sum, item) =>
                    sum + Number(item.total_amount || 0),
                0
            );

            return res.json({
                success: true,
                year,
                month,
                overall_total: overallTotal,
                summary: results
            });
        }
    );
};


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    createContribution,
    getContributions,
    getContributionById,
    getMemberContributions,
    updateContribution,
    deleteContribution,
    getMonthlyContributionSummary
};