const db = require("../config/db");

// CREATE CONTRIBUTION
const createContribution = (req, res) => {
    const {
        member_id,
        contribution_category,
        amount,
        contribution_date,
        notes
    } = req.body;

    if (!contribution_category || !amount || !contribution_date) {
        return res.status(400).json({
            success: false,
            message: "Contribution category, amount, and contribution date are required"
        });
    }

    const allowedCategories = [
        "Tithe",
        "Offering",
        "Donation",
        "Building Fund",
        "Camp Meeting",
        "Dorcas",
        "Youth Fund",
        "Other"
    ];

    if (!allowedCategories.includes(contribution_category)) {
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

    const sql = `
        INSERT INTO contributions (
            member_id,
            contribution_category,
            amount,
            contribution_date,
            recorded_by,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        member_id || null,
        contribution_category,
        amount,
        contribution_date,
        req.user.id,
        notes || null
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to record contribution",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Contribution recorded successfully",
            contribution_id: result.insertId
        });
    });
};

// GET ALL CONTRIBUTIONS
const getContributions = (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.member_id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.notes,
            c.created_at,
            CONCAT(m.first_name, ' ', m.last_name) AS member_name,
            u.full_name AS recorded_by_name
        FROM contributions c
        LEFT JOIN members m ON c.member_id = m.id
        LEFT JOIN users u ON c.recorded_by = u.id
        ORDER BY c.contribution_date DESC, c.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch contributions",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            contributions: results
        });
    });
};

// GET ONE CONTRIBUTION
const getContributionById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            c.id,
            c.member_id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.notes,
            c.created_at,
            CONCAT(m.first_name, ' ', m.last_name) AS member_name,
            u.full_name AS recorded_by_name
        FROM contributions c
        LEFT JOIN members m ON c.member_id = m.id
        LEFT JOIN users u ON c.recorded_by = u.id
        WHERE c.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
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

        res.json({
            success: true,
            contribution: results[0]
        });
    });
};

// GET CONTRIBUTIONS FOR ONE MEMBER
const getMemberContributions = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT
            c.id,
            c.contribution_category,
            c.amount,
            c.contribution_date,
            c.notes,
            c.created_at,
            u.full_name AS recorded_by_name
        FROM contributions c
        LEFT JOIN users u ON c.recorded_by = u.id
        WHERE c.member_id = ?
        ORDER BY c.contribution_date DESC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch member contributions",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            contributions: results
        });
    });
};

// UPDATE CONTRIBUTION
const updateContribution = (req, res) => {
    const { id } = req.params;

    const {
        member_id,
        contribution_category,
        amount,
        contribution_date,
        notes
    } = req.body;

    if (!contribution_category || !amount || !contribution_date) {
        return res.status(400).json({
            success: false,
            message: "Contribution category, amount, and contribution date are required"
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero"
        });
    }

    const sql = `
        UPDATE contributions
        SET
            member_id = ?,
            contribution_category = ?,
            amount = ?,
            contribution_date = ?,
            notes = ?
        WHERE id = ?
    `;

    const values = [
        member_id || null,
        contribution_category,
        amount,
        contribution_date,
        notes || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
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

        res.json({
            success: true,
            message: "Contribution updated successfully"
        });
    });
};

// DELETE CONTRIBUTION
const deleteContribution = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM contributions WHERE id = ?", [id], (error, result) => {
        if (error) {
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

        res.json({
            success: true,
            message: "Contribution deleted successfully"
        });
    });
};

// MONTHLY SUMMARY
const getMonthlyContributionSummary = (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({
            success: false,
            message: "Year and month are required. Example: ?year=2026&month=7"
        });
    }

    const sql = `
        SELECT
            contribution_category,
            COUNT(*) AS number_of_records,
            SUM(amount) AS total_amount
        FROM contributions
        WHERE YEAR(contribution_date) = ?
        AND MONTH(contribution_date) = ?
        GROUP BY contribution_category
        ORDER BY contribution_category ASC
    `;

    db.query(sql, [year, month], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch monthly contribution summary",
                error: error.message
            });
        }

        const overallTotal = results.reduce((sum, item) => {
            return sum + Number(item.total_amount);
        }, 0);

        res.json({
            success: true,
            year,
            month,
            overall_total: overallTotal,
            summary: results
        });
    });
};

module.exports = {
    createContribution,
    getContributions,
    getContributionById,
    getMemberContributions,
    updateContribution,
    deleteContribution,
    getMonthlyContributionSummary
};