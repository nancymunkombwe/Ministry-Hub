const db = require("../config/db");

// CREATE DEPARTMENT
const createDepartment = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Department name is required"
        });
    }

    const sql = `
        INSERT INTO departments (
            name,
            description
        )
        VALUES (?, ?)
    `;

    const values = [
        name,
        description || null
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create department",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department_id: result.insertId
        });
    });
};

// GET ALL DEPARTMENTS
const getDepartments = (req, res) => {
    const sql = `
        SELECT
            d.id,
            d.name,
            d.description,
            d.created_at,
            COUNT(md.member_id) AS member_count
        FROM departments d
        LEFT JOIN member_departments md ON d.id = md.department_id
        GROUP BY
            d.id,
            d.name,
            d.description,
            d.created_at
        ORDER BY d.name ASC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch departments",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            departments: results
        });
    });
};

// GET ONE DEPARTMENT
const getDepartmentById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            d.id,
            d.name,
            d.description,
            d.created_at,
            COUNT(md.member_id) AS member_count
        FROM departments d
        LEFT JOIN member_departments md ON d.id = md.department_id
        WHERE d.id = ?
        GROUP BY
            d.id,
            d.name,
            d.description,
            d.created_at
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch department",
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            department: results[0]
        });
    });
};

// UPDATE DEPARTMENT
const updateDepartment = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Department name is required"
        });
    }

    const sql = `
        UPDATE departments
        SET
            name = ?,
            description = ?
        WHERE id = ?
    `;

    const values = [
        name,
        description || null,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update department",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            message: "Department updated successfully"
        });
    });
};

// ASSIGN MEMBER TO DEPARTMENT
const assignMemberToDepartment = (req, res) => {
    const { member_id, department_id } = req.body;

    if (!member_id || !department_id) {
        return res.status(400).json({
            success: false,
            message: "Member ID and department ID are required"
        });
    }

    const checkSql = `
        SELECT id
        FROM member_departments
        WHERE member_id = ? AND department_id = ?
    `;

    db.query(checkSql, [member_id, department_id], (checkError, existing) => {
        if (checkError) {
            return res.status(500).json({
                success: false,
                message: "Failed to check department assignment",
                error: checkError.message
            });
        }

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Member is already assigned to this department"
            });
        }

        const insertSql = `
            INSERT INTO member_departments (
                member_id,
                department_id
            )
            VALUES (?, ?)
        `;

        db.query(insertSql, [member_id, department_id], (insertError, result) => {
            if (insertError) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to assign member to department",
                    error: insertError.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Member assigned to department successfully",
                assignment_id: result.insertId
            });
        });
    });
};

// GET MEMBER DEPARTMENTS
const getMemberDepartments = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT
            md.id AS assignment_id,
            md.member_id,
            md.department_id,
            d.name AS department_name,
            d.description,
            md.created_at
        FROM member_departments md
        JOIN departments d ON md.department_id = d.id
        WHERE md.member_id = ?
        ORDER BY d.name ASC
    `;

    db.query(sql, [memberId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch member departments",
                error: error.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            departments: results
        });
    });
};

// REMOVE MEMBER FROM DEPARTMENT
const removeMemberFromDepartment = (req, res) => {
    const { memberId, departmentId } = req.params;

    const sql = `
        DELETE FROM member_departments
        WHERE member_id = ? AND department_id = ?
    `;

    db.query(sql, [memberId, departmentId], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to remove member from department",
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Department assignment not found"
            });
        }

        res.json({
            success: true,
            message: "Member removed from department successfully"
        });
    });
};

// DELETE DEPARTMENT
const deleteDepartment = (req, res) => {
    const { id } = req.params;

    const deleteAssignmentsSql = `
        DELETE FROM member_departments
        WHERE department_id = ?
    `;

    const deleteDepartmentSql = `
        DELETE FROM departments
        WHERE id = ?
    `;

    db.query(deleteAssignmentsSql, [id], (assignmentError) => {
        if (assignmentError) {
            return res.status(500).json({
                success: false,
                message: "Failed to remove department assignments",
                error: assignmentError.message
            });
        }

        db.query(deleteDepartmentSql, [id], (departmentError, result) => {
            if (departmentError) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete department",
                    error: departmentError.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found"
                });
            }

            res.json({
                success: true,
                message: "Department deleted successfully"
            });
        });
    });
};

module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    assignMemberToDepartment,
    getMemberDepartments,
    removeMemberFromDepartment,
    deleteDepartment
};