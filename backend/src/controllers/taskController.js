const db = require("../config/db");

// CREATE TASK
const createTask = (req, res) => {
    const {
        title,
        description,
        assigned_to,
        department_id,
        related_member_id,
        status,
        due_date
    } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Task title is required"
        });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed"];
    const selectedStatus = status || "Pending";

    if (!allowedStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task status"
        });
    }

    const sql = `
        INSERT INTO tasks (
            title,
            description,
            assigned_to,
            department_id,
            related_member_id,
            status,
            due_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        description || null,
        assigned_to || null,
        department_id || null,
        related_member_id || null,
        selectedStatus,
        due_date || null,
        req.user.id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create task"
            });
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task_id: result.insertId
        });
    });
};

// GET ALL TASKS
const getTasks = (req, res) => {
    const sql = `
        SELECT
            t.id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.created_at,
            assigned.full_name AS assigned_to_name,
            creator.full_name AS created_by_name,
            d.name AS department_name,
            CONCAT(m.first_name, ' ', m.last_name) AS related_member_name
        FROM tasks t
        LEFT JOIN users assigned ON t.assigned_to = assigned.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN members m ON t.related_member_id = m.id
        ORDER BY
            CASE t.status
                WHEN 'Pending' THEN 1
                WHEN 'In Progress' THEN 2
                WHEN 'Completed' THEN 3
            END,
            t.due_date ASC,
            t.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch tasks"
            });
        }

        res.json({
            success: true,
            count: results.length,
            tasks: results
        });
    });
};

// GET ONE TASK
const getTaskById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            t.id,
            t.title,
            t.description,
            t.assigned_to,
            t.department_id,
            t.related_member_id,
            t.status,
            t.due_date,
            t.created_at,
            assigned.full_name AS assigned_to_name,
            creator.full_name AS created_by_name,
            d.name AS department_name,
            CONCAT(m.first_name, ' ', m.last_name) AS related_member_name
        FROM tasks t
        LEFT JOIN users assigned ON t.assigned_to = assigned.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN members m ON t.related_member_id = m.id
        WHERE t.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch task"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            task: results[0]
        });
    });
};

// GET TASKS ASSIGNED TO ONE USER
const getTasksAssignedToUser = (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT
            t.id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.created_at,
            d.name AS department_name,
            CONCAT(m.first_name, ' ', m.last_name) AS related_member_name
        FROM tasks t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN members m ON t.related_member_id = m.id
        WHERE t.assigned_to = ?
        ORDER BY
            CASE t.status
                WHEN 'Pending' THEN 1
                WHEN 'In Progress' THEN 2
                WHEN 'Completed' THEN 3
            END,
            t.due_date ASC,
            t.created_at DESC
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch assigned tasks"
            });
        }

        res.json({
            success: true,
            count: results.length,
            tasks: results
        });
    });
};

// UPDATE TASK
const updateTask = (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        assigned_to,
        department_id,
        related_member_id,
        status,
        due_date
    } = req.body;

    if (!title || !status) {
        return res.status(400).json({
            success: false,
            message: "Task title and status are required"
        });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task status"
        });
    }

    const sql = `
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            assigned_to = ?,
            department_id = ?,
            related_member_id = ?,
            status = ?,
            due_date = ?
        WHERE id = ?
    `;

    const values = [
        title,
        description || null,
        assigned_to || null,
        department_id || null,
        related_member_id || null,
        status,
        due_date || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update task"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            message: "Task updated successfully"
        });
    });
};

// UPDATE ONLY TASK STATUS
const updateTaskStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "Status is required"
        });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task status"
        });
    }

    db.query(
        "UPDATE tasks SET status = ? WHERE id = ?",
        [status, id],
        (error, result) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update task status"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found"
                });
            }

            res.json({
                success: true,
                message: "Task status updated successfully"
            });
        }
    );
};

// DELETE TASK
const deleteTask = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM tasks WHERE id = ?", [id], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete task"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            message: "Task deleted successfully"
        });
    });
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    getTasksAssignedToUser,
    updateTask,
    updateTaskStatus,
    deleteTask
};