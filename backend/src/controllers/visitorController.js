const db = require("../config/db");

// CREATE VISITOR
const createVisitor = (req, res) => {
    const {
        first_name,
        last_name,
        phone,
        email,
        address,
        visit_date,
        invited_by,
        follow_up_status
    } = req.body;

    if (!first_name || !last_name || !visit_date) {
        return res.status(400).json({
            success: false,
            message: "First name, last name, and visit date are required"
        });
    }

    const allowedStatuses = [
        "New Visitor",
        "Contacted",
        "Interested",
        "Joined",
        "Not Interested"
    ];

    const selectedStatus = follow_up_status || "New Visitor";

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid follow-up status"
        });
    }

    const sql = `
        INSERT INTO visitors (
            first_name,
            last_name,
            phone,
            email,
            address,
            visit_date,
            invited_by,
            follow_up_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        first_name,
        last_name,
        phone || null,
        email || null,
        address || null,
        visit_date,
        invited_by || null,
        selectedStatus
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create visitor",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Visitor created successfully",
            visitor_id: result.insertId
        });
    });
};

// GET ALL VISITORS
const getVisitors = (req, res) => {
    const sql = `
        SELECT
            id,
            first_name,
            last_name,
            CONCAT(first_name, ' ', last_name) AS full_name,
            phone,
            email,
            address,
            visit_date,
            invited_by,
            follow_up_status,
            created_at
        FROM visitors
        ORDER BY visit_date DESC, created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch visitors",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            visitors: results
        });
    });
};

// GET ONE VISITOR
const getVisitorById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            id,
            first_name,
            last_name,
            CONCAT(first_name, ' ', last_name) AS full_name,
            phone,
            email,
            address,
            visit_date,
            invited_by,
            follow_up_status,
            created_at
        FROM visitors
        WHERE id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch visitor",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found"
            });
        }

        res.json({
            success: true,
            visitor: results[0]
        });
    });
};

// UPDATE VISITOR
const updateVisitor = (req, res) => {
    const { id } = req.params;

    const {
        first_name,
        last_name,
        phone,
        email,
        address,
        visit_date,
        invited_by,
        follow_up_status
    } = req.body;

    if (!first_name || !last_name || !visit_date) {
        return res.status(400).json({
            success: false,
            message: "First name, last name, and visit date are required"
        });
    }

    const allowedStatuses = [
        "New Visitor",
        "Contacted",
        "Interested",
        "Joined",
        "Not Interested"
    ];

    const selectedStatus = follow_up_status || "New Visitor";

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid follow-up status"
        });
    }

    const sql = `
        UPDATE visitors
        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            email = ?,
            address = ?,
            visit_date = ?,
            invited_by = ?,
            follow_up_status = ?
        WHERE id = ?
    `;

    const values = [
        first_name,
        last_name,
        phone || null,
        email || null,
        address || null,
        visit_date,
        invited_by || null,
        selectedStatus,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update visitor",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found"
            });
        }

        res.json({
            success: true,
            message: "Visitor updated successfully"
        });
    });
};

// DELETE VISITOR
const deleteVisitor = (req, res) => {
    const { id } = req.params;

    const deleteFollowUpsSql = `
        DELETE FROM visitor_followups
        WHERE visitor_id = ?
    `;

    const deleteVisitorSql = `
        DELETE FROM visitors
        WHERE id = ?
    `;

    db.query(deleteFollowUpsSql, [id], (followUpError) => {
        if (followUpError) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete visitor follow-ups",
                error: followUpError.message
            });
        }

        db.query(deleteVisitorSql, [id], (visitorError, result) => {
            if (visitorError) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete visitor",
                    error: visitorError.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Visitor not found"
                });
            }

            res.json({
                success: true,
                message: "Visitor deleted successfully"
            });
        });
    });
};

// CREATE VISITOR FOLLOW-UP
const createVisitorFollowUp = (req, res) => {
    const {
        visitor_id,
        follow_up_date,
        method,
        notes,
        status
    } = req.body;

    if (!visitor_id || !follow_up_date || !method) {
        return res.status(400).json({
            success: false,
            message: "Visitor ID, follow-up date, and method are required"
        });
    }

    const sql = `
        INSERT INTO visitor_followups (
            visitor_id,
            follow_up_date,
            method,
            notes,
            status,
            followed_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        visitor_id,
        follow_up_date,
        method,
        notes || null,
        status || "Pending",
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create visitor follow-up",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Visitor follow-up created successfully",
            followup_id: result.insertId
        });
    });
};

// GET VISITOR FOLLOW-UP HISTORY
const getVisitorFollowUps = (req, res) => {
    const { visitorId } = req.params;

    const sql = `
        SELECT
            vf.id,
            vf.visitor_id,
            vf.follow_up_date,
            vf.method,
            vf.notes,
            vf.status,
            vf.created_at,
            u.full_name AS followed_by_name
        FROM visitor_followups vf
        LEFT JOIN users u ON vf.followed_by = u.id
        WHERE vf.visitor_id = ?
        ORDER BY vf.follow_up_date DESC, vf.created_at DESC
    `;

    db.query(sql, [visitorId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch visitor follow-ups",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            followups: results
        });
    });
};

module.exports = {
    createVisitor,
    getVisitors,
    getVisitorById,
    updateVisitor,
    deleteVisitor,
    createVisitorFollowUp,
    getVisitorFollowUps
};