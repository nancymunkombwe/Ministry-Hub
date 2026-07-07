const db = require("../config/db");

// CREATE CARE FOLLOW-UP CASE
const createCareFollowUp = (req, res) => {
    const {
        member_id,
        reason,
        description,
        assigned_to,
        status,
        due_date
    } = req.body;

    if (!member_id || !reason) {
        return res.status(400).json({
            success: false,
            message: "Member ID and reason are required"
        });
    }

    const allowedReasons = [
        "Missed Services",
        "Sick Member",
        "Visitation",
        "New Convert",
        "Prayer Request",
        "Bereavement",
        "Counselling",
        "Other"
    ];

    if (!allowedReasons.includes(reason)) {
        return res.status(400).json({
            success: false,
            message: "Invalid care follow-up reason"
        });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed"];
    const selectedStatus = status || "Pending";

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    const sql = `
        INSERT INTO care_followups (
            member_id,
            reason,
            description,
            assigned_to,
            status,
            due_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        member_id,
        reason,
        description || null,
        assigned_to || null,
        selectedStatus,
        due_date || null,
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create care follow-up",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Care follow-up created successfully",
            care_followup_id: result.insertId
        });
    });
};

// GET ALL CARE FOLLOW-UPS
const getCareFollowUps = (req, res) => {
    const sql = `
        SELECT
            cf.id,
            cf.member_id,
            CONCAT(m.first_name, ' ', m.last_name) AS member_name,
            m.phone AS member_phone,
            cf.reason,
            cf.description,
            cf.status,
            cf.due_date,
            cf.created_at,
            assigned.full_name AS assigned_to_name,
            creator.full_name AS created_by_name
        FROM care_followups cf
        JOIN members m ON cf.member_id = m.id
        LEFT JOIN users assigned ON cf.assigned_to = assigned.id
        LEFT JOIN users creator ON cf.created_by = creator.id
        ORDER BY 
            CASE cf.status
                WHEN 'Pending' THEN 1
                WHEN 'In Progress' THEN 2
                WHEN 'Completed' THEN 3
            END,
            cf.due_date ASC,
            cf.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch care follow-ups",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            care_followups: results
        });
    });
};

// GET ONE CARE FOLLOW-UP
const getCareFollowUpById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            cf.id,
            cf.member_id,
            CONCAT(m.first_name, ' ', m.last_name) AS member_name,
            m.phone AS member_phone,
            cf.reason,
            cf.description,
            cf.assigned_to,
            cf.status,
            cf.due_date,
            cf.created_at,
            assigned.full_name AS assigned_to_name,
            creator.full_name AS created_by_name
        FROM care_followups cf
        JOIN members m ON cf.member_id = m.id
        LEFT JOIN users assigned ON cf.assigned_to = assigned.id
        LEFT JOIN users creator ON cf.created_by = creator.id
        WHERE cf.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch care follow-up",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Care follow-up not found"
            });
        }

        res.json({
            success: true,
            care_followup: results[0]
        });
    });
};

// GET CARE FOLLOW-UPS FOR ONE MEMBER
const getMemberCareFollowUps = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT
            cf.id,
            cf.reason,
            cf.description,
            cf.status,
            cf.due_date,
            cf.created_at,
            assigned.full_name AS assigned_to_name,
            creator.full_name AS created_by_name
        FROM care_followups cf
        LEFT JOIN users assigned ON cf.assigned_to = assigned.id
        LEFT JOIN users creator ON cf.created_by = creator.id
        WHERE cf.member_id = ?
        ORDER BY cf.created_at DESC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch member care follow-ups",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            care_followups: results
        });
    });
};

// UPDATE CARE FOLLOW-UP
const updateCareFollowUp = (req, res) => {
    const { id } = req.params;

    const {
        member_id,
        reason,
        description,
        assigned_to,
        status,
        due_date
    } = req.body;

    if (!member_id || !reason || !status) {
        return res.status(400).json({
            success: false,
            message: "Member ID, reason, and status are required"
        });
    }

    const sql = `
        UPDATE care_followups
        SET
            member_id = ?,
            reason = ?,
            description = ?,
            assigned_to = ?,
            status = ?,
            due_date = ?
        WHERE id = ?
    `;

    const values = [
        member_id,
        reason,
        description || null,
        assigned_to || null,
        status,
        due_date || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update care follow-up",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Care follow-up not found"
            });
        }

        res.json({
            success: true,
            message: "Care follow-up updated successfully"
        });
    });
};

// DELETE CARE FOLLOW-UP
const deleteCareFollowUp = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM care_followups WHERE id = ?", [id], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete care follow-up",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Care follow-up not found"
            });
        }

        res.json({
            success: true,
            message: "Care follow-up deleted successfully"
        });
    });
};

module.exports = {
    createCareFollowUp,
    getCareFollowUps,
    getCareFollowUpById,
    getMemberCareFollowUps,
    updateCareFollowUp,
    deleteCareFollowUp
};