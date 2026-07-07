const db = require("../config/db");

// ADD MEMBER
const createMember = (req, res) => {
    const {
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        baptism_status,
        baptism_date,
        membership_status
    } = req.body;

    if (!first_name || !last_name || !gender) {
        return res.status(400).json({
            success: false,
            message: "First name, last name, and gender are required"
        });
    }

    const sql = `
        INSERT INTO members (
            first_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            baptism_status,
            baptism_date,
            membership_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        first_name,
        last_name,
        gender,
        date_of_birth || null,
        phone || null,
        email || null,
        address || null,
        baptism_status || "Unknown",
        baptism_date || null,
        membership_status || "Active"
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create member",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Member created successfully",
            member_id: result.insertId
        });
    });
};

// GET ALL MEMBERS
const getMembers = (req, res) => {
    const sql = `
        SELECT *
        FROM members
        ORDER BY created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch members",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            members: results
        });
    });
};

// GET SINGLE MEMBER
const getMemberById = (req, res) => {
    const { id } = req.params;

    db.query("SELECT * FROM members WHERE id = ?", [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch member",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        res.json({
            success: true,
            member: results[0]
        });
    });
};

// UPDATE MEMBER
const updateMember = (req, res) => {
    const { id } = req.params;

    const {
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        baptism_status,
        baptism_date,
        membership_status,
        follow_up_status
    } = req.body;

    const sql = `
        UPDATE members
        SET
            first_name = ?,
            last_name = ?,
            gender = ?,
            date_of_birth = ?,
            phone = ?,
            email = ?,
            address = ?,
            baptism_status = ?,
            baptism_date = ?,
            membership_status = ?,
            follow_up_status = ?
        WHERE id = ?
    `;

    const values = [
        first_name,
        last_name,
        gender,
        date_of_birth || null,
        phone || null,
        email || null,
        address || null,
        baptism_status || "Unknown",
        baptism_date || null,
        membership_status || "Active",
        follow_up_status || "Okay",
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update member",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        res.json({
            success: true,
            message: "Member updated successfully"
        });
    });
};

// DELETE MEMBER
const deleteMember = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM members WHERE id = ?", [id], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete member",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        res.json({
            success: true,
            message: "Member deleted successfully"
        });
    });
};

module.exports = {
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember
};