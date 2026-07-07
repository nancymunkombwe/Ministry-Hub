const db = require("../config/db");

// GET ALL DEPARTMENTS
const getDepartments = (req, res) => {
    const sql = `
        SELECT *
        FROM departments
        ORDER BY name ASC
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

    db.query("SELECT * FROM departments WHERE id = ?", [id], (error, results) => {
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

// CREATE NEW DEPARTMENT
const createDepartment = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Department name is required"
        });
    }

    const sql = `
        INSERT INTO departments (name, description)
        VALUES (?, ?)
    `;

    db.query(sql, [name, description || null], (error, result) => {
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

// ASSIGN MEMBER TO DEPARTMENT
const assignMemberToDepartment = (req, res) => {
    const { member_id, department_id, role_in_department } = req.body;

    if (!member_id || !department_id) {
        return res.status(400).json({
            success: false,
            message: "Member ID and department ID are required"
        });
    }

    const sql = `
        INSERT INTO member_departments (member_id, department_id, role_in_department)
        VALUES (?, ?, ?)
    `;

    const values = [
        member_id,
        department_id,
        role_in_department || "Member"
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    success: false,
                    message: "This member already belongs to this department"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to assign member to department",
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Member assigned to department successfully",
            assignment_id: result.insertId
        });
    });
};

// GET DEPARTMENTS FOR ONE MEMBER
const getMemberDepartments = (req, res) => {
    const { memberId } = req.params;

    const sql = `
        SELECT 
            md.id AS assignment_id,
            md.role_in_department,
            md.created_at,
            d.id AS department_id,
            d.name AS department_name,
            d.description
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

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    assignMemberToDepartment,
    getMemberDepartments,
    removeMemberFromDepartment
};