const db = require("../config/db");

// ADD VISITOR
const createVisitor = (req, res) => {
    const {
        first_name,
        last_name,
        gender,
        phone,
        email,
        visit_date,
        invited_by,
        interested_in_bible_study,
        wants_follow_up,
        follow_up_status,
        notes
    } = req.body;

    if (!first_name || !last_name || !visit_date) {
        return res.status(400).json({
            success: false,
            message: "First name, last name, and visit date are required"
        });
    }

    const sql = `
        INSERT INTO visitors (
            first_name,
            last_name,
            gender,
            phone,
            email,
            visit_date,
            invited_by,
            interested_in_bible_study,
            wants_follow_up,
            follow_up_status,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        first_name,
        last_name,
        gender || null,
        phone || null,
        email || null,
        visit_date,
        invited_by || null,
        interested_in_bible_study || "Unknown",
        wants_follow_up || "Yes",
        follow_up_status || "New Visitor",
        notes || null
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
        SELECT *
        FROM visitors
        ORDER BY created_at DESC
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

    db.query("SELECT * FROM visitors WHERE id = ?", [id], (error, results) => {
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
        gender,
        phone,
        email,
        visit_date,
        invited_by,
        interested_in_bible_study,
        wants_follow_up,
        follow_up_status,
        notes
    } = req.body;

    const sql = `
        UPDATE visitors
        SET
            first_name = ?,
            last_name = ?,
            gender = ?,
            phone = ?,
            email = ?,
            visit_date = ?,
            invited_by = ?,
            interested_in_bible_study = ?,
            wants_follow_up = ?,
            follow_up_status = ?,
            notes = ?
        WHERE id = ?
    `;

    const values = [
        first_name,
        last_name,
        gender || null,
        phone || null,
        email || null,
        visit_date,
        invited_by || null,
        interested_in_bible_study || "Unknown",
        wants_follow_up || "Yes",
        follow_up_status || "New Visitor",
        notes || null,
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

// ADD VISITOR FOLLOW-UP
const createVisitorFollowUp = (req, res) => {
    const { visitor_id, follow_up_date, follow_up_method, notes } = req.body;

    if (!visitor_id || !follow_up_date) {
        return res.status(400).json({
            success: false,
            message: "Visitor ID and follow-up date are required"
        });
    }

    const sql = `
        INSERT INTO visitor_followups (
            visitor_id,
            follow_up_date,
            follow_up_method,
            notes,
            handled_by
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        visitor_id,
        follow_up_date,
        follow_up_method || "Call",
        notes || null,
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
            message: "Visitor follow-up recorded successfully",
            followup_id: result.insertId
        });
    });
};

// GET FOLLOW-UPS FOR ONE VISITOR
const getVisitorFollowUps = (req, res) => {
    const { visitorId } = req.params;

    const sql = `
        SELECT 
            vf.id,
            vf.visitor_id,
            vf.follow_up_date,
            vf.follow_up_method,
            vf.notes,
            vf.created_at,
            u.full_name AS handled_by_name
        FROM visitor_followups vf
        LEFT JOIN users u ON vf.handled_by = u.id
        WHERE vf.visitor_id = ?
        ORDER BY vf.follow_up_date DESC
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
    createVisitorFollowUp,
    getVisitorFollowUps
};