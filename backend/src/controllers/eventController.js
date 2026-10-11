const db = require("../config/db");

// =====================================================
// ALLOWED EVENT TYPES
// =====================================================

const allowedEventTypes = [
    "Sabbath Program",
    "Midweek Service",
    "Vespers",
    "Seminar",
    "Baptism",
    "Department Meeting",
    "Other"
];


// =====================================================
// CREATE EVENT
// =====================================================

const createEvent = (req, res) => {

    const {
        title,
        description,
        event_type,
        event_date,
        event_time,
        location,
        department_id
    } = req.body;


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!title || !title.trim() || !event_date) {

        return res.status(400).json({
            success: false,
            message: "Event title and event date are required"
        });

    }


    const selectedEventType = event_type || "Other";


    if (!allowedEventTypes.includes(selectedEventType)) {

        return res.status(400).json({
            success: false,
            message: "Invalid event type"
        });

    }


    // =====================================================
    // INSERT
    // =====================================================

    const sql = `
        INSERT INTO events (
            title,
            description,
            event_type,
            event_date,
            event_time,
            location,
            department_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        title.trim(),
        description ? description.trim() : null,
        selectedEventType,
        event_date,
        event_time || null,
        location || null,
        department_id || null,
        req.user.id
    ];


    db.query(sql, values, (error, result) => {

        if (error) {

            console.error(
                "CREATE EVENT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to create event",
                error: error.message
            });

        }


        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event_id: result.insertId
        });

    });

};


// =====================================================
// GET ALL EVENTS
// =====================================================

const getEvents = (req, res) => {

    const sql = `
        SELECT
            e.id,
            e.title,
            e.description,
            e.event_type,
            e.event_date,
            e.event_time,
            e.location,
            e.department_id,
            e.created_by,
            e.created_at,

            d.name AS department_name,

            u.full_name AS created_by_name

        FROM events e

        LEFT JOIN departments d
            ON e.department_id = d.id

        LEFT JOIN users u
            ON e.created_by = u.id

        ORDER BY
            e.event_date DESC,
            e.event_time DESC
    `;


    db.query(sql, (error, results) => {

        if (error) {

            console.error(
                "GET EVENTS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch events",
                error: error.message
            });

        }


        return res.json({
            success: true,
            count: results.length,
            events: results
        });

    });

};


// =====================================================
// GET ONE EVENT
// =====================================================

const getEventById = (req, res) => {

    const { id } = req.params;


    const sql = `
        SELECT
            e.id,
            e.title,
            e.description,
            e.event_type,
            e.event_date,
            e.event_time,
            e.location,
            e.department_id,
            e.created_by,
            e.created_at,

            d.name AS department_name,

            u.full_name AS created_by_name

        FROM events e

        LEFT JOIN departments d
            ON e.department_id = d.id

        LEFT JOIN users u
            ON e.created_by = u.id

        WHERE e.id = ?
    `;


    db.query(sql, [id], (error, results) => {

        if (error) {

            console.error(
                "GET EVENT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch event",
                error: error.message
            });

        }


        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });

        }


        return res.json({
            success: true,
            event: results[0]
        });

    });

};


// =====================================================
// UPDATE EVENT
// =====================================================

const updateEvent = (req, res) => {

    const { id } = req.params;


    const {
        title,
        description,
        event_type,
        event_date,
        event_time,
        location,
        department_id
    } = req.body;


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!title || !title.trim() || !event_date) {

        return res.status(400).json({
            success: false,
            message: "Event title and event date are required"
        });

    }


    const selectedEventType = event_type || "Other";


    if (!allowedEventTypes.includes(selectedEventType)) {

        return res.status(400).json({
            success: false,
            message: "Invalid event type"
        });

    }


    // =====================================================
    // UPDATE
    // =====================================================

    const sql = `
        UPDATE events
        SET
            title = ?,
            description = ?,
            event_type = ?,
            event_date = ?,
            event_time = ?,
            location = ?,
            department_id = ?
        WHERE id = ?
    `;


    const values = [
        title.trim(),
        description ? description.trim() : null,
        selectedEventType,
        event_date,
        event_time || null,
        location || null,
        department_id || null,
        id
    ];


    db.query(sql, values, (error, result) => {

        if (error) {

            console.error(
                "UPDATE EVENT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update event",
                error: error.message
            });

        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });

        }


        return res.json({
            success: true,
            message: "Event updated successfully"
        });

    });

};


// =====================================================
// DELETE EVENT
// =====================================================

const deleteEvent = (req, res) => {

    const { id } = req.params;


    db.query(
        "DELETE FROM events WHERE id = ?",
        [id],
        (error, result) => {

            if (error) {

                console.error(
                    "DELETE EVENT ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete event",
                    error: error.message
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Event not found"
                });

            }


            return res.json({
                success: true,
                message: "Event deleted successfully"
            });

        }
    );

};


// =====================================================
// ADD PROGRAM ITEM
// =====================================================

const createProgramItem = (req, res) => {

    const {
        event_id,
        item_order,
        item_title,
        assigned_to,
        start_time,
        notes
    } = req.body;


    if (!event_id || !item_order || !item_title) {

        return res.status(400).json({
            success: false,
            message:
                "Event ID, item order, and item title are required"
        });

    }


    const sql = `
        INSERT INTO program_items (
            event_id,
            item_order,
            item_title,
            assigned_to,
            start_time,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;


    const values = [
        event_id,
        item_order,
        item_title,
        assigned_to || null,
        start_time || null,
        notes || null
    ];


    db.query(sql, values, (error, result) => {

        if (error) {

            console.error(
                "CREATE PROGRAM ITEM ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to create program item",
                error: error.message
            });

        }


        return res.status(201).json({
            success: true,
            message: "Program item added successfully",
            program_item_id: result.insertId
        });

    });

};


// =====================================================
// GET PROGRAM ITEMS
// =====================================================

const getProgramItems = (req, res) => {

    const { eventId } = req.params;


    const sql = `
        SELECT *
        FROM program_items
        WHERE event_id = ?
        ORDER BY item_order ASC
    `;


    db.query(sql, [eventId], (error, results) => {

        if (error) {

            console.error(
                "GET PROGRAM ITEMS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch program items",
                error: error.message
            });

        }


        return res.json({
            success: true,
            count: results.length,
            program_items: results
        });

    });

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    createProgramItem,
    getProgramItems
};