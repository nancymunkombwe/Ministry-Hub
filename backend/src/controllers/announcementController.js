const db = require("../config/db");

// CREATE ANNOUNCEMENT
const createAnnouncement = (req, res) => {
    const {
        title,
        message,
        target_audience,
        target_department_id
    } = req.body;

    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: "Announcement title and message are required"
        });
    }

    const allowedAudiences = ["All", "Members", "Leaders", "Department"];
    const selectedAudience = target_audience || "All";

    if (!allowedAudiences.includes(selectedAudience)) {
        return res.status(400).json({
            success: false,
            message: "Invalid target audience"
        });
    }

    if (selectedAudience === "Department" && !target_department_id) {
        return res.status(400).json({
            success: false,
            message: "Target department ID is required when audience is Department"
        });
    }

    const sql = `
        INSERT INTO announcements (
            title,
            message,
            target_audience,
            target_department_id,
            posted_by
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        message,
        selectedAudience,
        target_department_id || null,
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create announcement",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            announcement_id: result.insertId
        });
    });
};

// GET ALL ANNOUNCEMENTS
const getAnnouncements = (req, res) => {
    const sql = `
        SELECT
            a.id,
            a.title,
            a.message,
            a.target_audience,
            a.target_department_id,
            a.created_at,
            d.name AS target_department_name,
            u.full_name AS posted_by_name
        FROM announcements a
        LEFT JOIN departments d ON a.target_department_id = d.id
        LEFT JOIN users u ON a.posted_by = u.id
        ORDER BY a.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch announcements",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            announcements: results
        });
    });
};

// GET ONE ANNOUNCEMENT
const getAnnouncementById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            a.id,
            a.title,
            a.message,
            a.target_audience,
            a.target_department_id,
            a.created_at,
            d.name AS target_department_name,
            u.full_name AS posted_by_name
        FROM announcements a
        LEFT JOIN departments d ON a.target_department_id = d.id
        LEFT JOIN users u ON a.posted_by = u.id
        WHERE a.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch announcement",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.json({
            success: true,
            announcement: results[0]
        });
    });
};

// UPDATE ANNOUNCEMENT
const updateAnnouncement = (req, res) => {
    const { id } = req.params;

    const {
        title,
        message,
        target_audience,
        target_department_id
    } = req.body;

    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: "Announcement title and message are required"
        });
    }

    const sql = `
        UPDATE announcements
        SET
            title = ?,
            message = ?,
            target_audience = ?,
            target_department_id = ?
        WHERE id = ?
    `;

    const values = [
        title,
        message,
        target_audience || "All",
        target_department_id || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update announcement",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.json({
            success: true,
            message: "Announcement updated successfully"
        });
    });
};

// DELETE ANNOUNCEMENT
const deleteAnnouncement = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM announcements WHERE id = ?", [id], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete announcement",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.json({
            success: true,
            message: "Announcement deleted successfully"
        });
    });
};

// GENERATE WHATSAPP-READY MESSAGE
const getWhatsAppMessage = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            a.title,
            a.message,
            a.target_audience,
            d.name AS target_department_name
        FROM announcements a
        LEFT JOIN departments d ON a.target_department_id = d.id
        WHERE a.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate WhatsApp message",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        const announcement = results[0];

        const audience =
            announcement.target_audience === "Department"
                ? announcement.target_department_name
                : announcement.target_audience;

        const whatsapp_message = `📢 *Church Announcement*

*${announcement.title}*

${announcement.message}

Audience: ${audience}

- Ministry Hub`;

        res.json({
            success: true,
            whatsapp_message
        });
    });
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getWhatsAppMessage
};