const db = require("../config/db");

// =====================================================
// HELPER: VALIDATE ANNOUNCEMENT DATA
// =====================================================

const allowedAudiences = [
    "All",
    "Members",
    "Leaders",
    "Department",
    "Visitors"
];

const allowedPriorities = [
    "Low",
    "Normal",
    "High",
    "Urgent"
];

const allowedStatuses = [
    "Draft",
    "Published"
];


// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================

const createAnnouncement = (req, res) => {
    const {
        title,
        message,
        target_audience,
        target_department_id,
        announcement_date,
        priority,
        status
    } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: "Announcement title and message are required"
        });
    }

    const selectedAudience = target_audience || "All";
    const selectedPriority = priority || "Normal";
    const selectedStatus = status || "Published";

    if (!allowedAudiences.includes(selectedAudience)) {
        return res.status(400).json({
            success: false,
            message: "Invalid target audience"
        });
    }

    if (!allowedPriorities.includes(selectedPriority)) {
        return res.status(400).json({
            success: false,
            message: "Invalid announcement priority"
        });
    }

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid announcement status"
        });
    }

    if (
        selectedAudience === "Department" &&
        !target_department_id
    ) {
        return res.status(400).json({
            success: false,
            message: "Target department ID is required when audience is Department"
        });
    }

    const sql = `
        INSERT INTO announcements (
            title,
            message,
            announcement_date,
            priority,
            status,
            target_audience,
            target_department_id,
            posted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title.trim(),
        message.trim(),
        announcement_date || null,
        selectedPriority,
        selectedStatus,
        selectedAudience,
        target_department_id || null,
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("CREATE ANNOUNCEMENT ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to create announcement",
                error: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            announcement_id: result.insertId
        });
    });
};


// =====================================================
// GET ALL ANNOUNCEMENTS
// =====================================================

const getAnnouncements = (req, res) => {
    const sql = `
        SELECT
            a.id,
            a.title,
            a.message,
            a.announcement_date,
            a.priority,
            a.status,
            a.target_audience,
            a.target_department_id,
            a.created_at,

            d.name AS target_department_name,

            u.full_name AS posted_by_name

        FROM announcements a

        LEFT JOIN departments d
            ON a.target_department_id = d.id

        LEFT JOIN users u
            ON a.posted_by = u.id

        ORDER BY
            CASE a.priority
                WHEN 'Urgent' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Normal' THEN 3
                WHEN 'Low' THEN 4
            END,

            CASE a.status
                WHEN 'Published' THEN 1
                WHEN 'Draft' THEN 2
            END,

            COALESCE(
                a.announcement_date,
                DATE(a.created_at)
            ) DESC,

            a.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("GET ANNOUNCEMENTS ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch announcements",
                error: error.message
            });
        }

        return res.json({
            success: true,
            count: results.length,
            announcements: results
        });
    });
};


// =====================================================
// GET ONE ANNOUNCEMENT
// =====================================================

const getAnnouncementById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            a.id,
            a.title,
            a.message,
            a.announcement_date,
            a.priority,
            a.status,
            a.target_audience,
            a.target_department_id,
            a.created_at,

            d.name AS target_department_name,

            u.full_name AS posted_by_name

        FROM announcements a

        LEFT JOIN departments d
            ON a.target_department_id = d.id

        LEFT JOIN users u
            ON a.posted_by = u.id

        WHERE a.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error("GET ANNOUNCEMENT ERROR:", error);

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

        return res.json({
            success: true,
            announcement: results[0]
        });
    });
};


// =====================================================
// UPDATE ANNOUNCEMENT
// =====================================================

const updateAnnouncement = (req, res) => {
    const { id } = req.params;

    const {
        title,
        message,
        target_audience,
        target_department_id,
        announcement_date,
        priority,
        status
    } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: "Announcement title and message are required"
        });
    }

    const selectedAudience = target_audience || "All";
    const selectedPriority = priority || "Normal";
    const selectedStatus = status || "Published";

    if (!allowedAudiences.includes(selectedAudience)) {
        return res.status(400).json({
            success: false,
            message: "Invalid target audience"
        });
    }

    if (!allowedPriorities.includes(selectedPriority)) {
        return res.status(400).json({
            success: false,
            message: "Invalid announcement priority"
        });
    }

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid announcement status"
        });
    }

    if (
        selectedAudience === "Department" &&
        !target_department_id
    ) {
        return res.status(400).json({
            success: false,
            message: "Target department ID is required when audience is Department"
        });
    }

    const sql = `
        UPDATE announcements
        SET
            title = ?,
            message = ?,
            announcement_date = ?,
            priority = ?,
            status = ?,
            target_audience = ?,
            target_department_id = ?
        WHERE id = ?
    `;

    const values = [
        title.trim(),
        message.trim(),
        announcement_date || null,
        selectedPriority,
        selectedStatus,
        selectedAudience,
        target_department_id || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("UPDATE ANNOUNCEMENT ERROR:", error);

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

        return res.json({
            success: true,
            message: "Announcement updated successfully"
        });
    });
};


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

const deleteAnnouncement = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM announcements WHERE id = ?",
        [id],
        (error, result) => {
            if (error) {
                console.error("DELETE ANNOUNCEMENT ERROR:", error);

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

            return res.json({
                success: true,
                message: "Announcement deleted successfully"
            });
        }
    );
};


// =====================================================
// GENERATE WHATSAPP-READY MESSAGE
// =====================================================

const getWhatsAppMessage = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            a.title,
            a.message,
            a.announcement_date,
            a.priority,
            a.status,
            a.target_audience,
            d.name AS target_department_name

        FROM announcements a

        LEFT JOIN departments d
            ON a.target_department_id = d.id

        WHERE a.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error("WHATSAPP MESSAGE ERROR:", error);

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

        let audience = announcement.target_audience || "All";

        if (
            announcement.target_audience === "Department" &&
            announcement.target_department_name
        ) {
            audience = announcement.target_department_name;
        }

        const dateText = announcement.announcement_date
            ? `\n📅 ${new Date(
                  announcement.announcement_date
              ).toLocaleDateString()}`
            : "";

        const priorityText =
            announcement.priority === "Urgent"
                ? "\n🚨 *URGENT*"
                : "";

        const whatsapp_message = `📢 *Church Announcement*${priorityText}

*${announcement.title}*

${announcement.message}${dateText}

Audience: ${audience}

- Ministry Hub`;

        return res.json({
            success: true,
            whatsapp_message
        });
    });
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getWhatsAppMessage
};