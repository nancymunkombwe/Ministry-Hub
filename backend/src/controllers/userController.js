const bcrypt = require("bcryptjs");
const db = require("../config/db");

const validRoles = ["admin", "leader", "treasurer"];
const validStatuses = ["Active", "Inactive"];

const getCleanUser = (user) => {
    return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status || "Active",
        created_at: user.created_at
    };
};

exports.getUsers = (req, res) => {
    const sql = `
        SELECT id, full_name, email, role, status, created_at
        FROM users
        ORDER BY id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to load users."
            });
        }

        return res.status(200).json({
            message: "Users loaded successfully.",
            users: results.map(getCleanUser)
        });
    });
};

exports.getUserById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT id, full_name, email, role, status, created_at
        FROM users
        WHERE id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to load user."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "User loaded successfully.",
            user: getCleanUser(results[0])
        });
    });
};

exports.createUser = async (req, res) => {
    const { full_name, email, password, role, status } = req.body;

    if (!full_name || !email || !password || !role) {
        return res.status(400).json({
            message: "Full name, email, password, and role are required."
        });
    }

    if (!validRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid role. Role must be admin, leader, or treasurer."
        });
    }

    const selectedStatus = status || "Active";

    if (!validStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            message: "Invalid status. Status must be Active or Inactive."
        });
    }

    if (password.length < 12) {
        return res.status(400).json({
            message: "Password must be at least 12 characters."
        });
    }

    const checkEmailSql = `
        SELECT id
        FROM users
        WHERE email = ?
    `;

    db.query(checkEmailSql, [email], async (checkError, existingUsers) => {
        if (checkError) {
            return res.status(500).json({
                message: "Failed to check user email."
            });
        }

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "A user with this email already exists."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const insertSql = `
                INSERT INTO users (full_name, email, password, role, status)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [full_name, email, hashedPassword, role, selectedStatus],
                (insertError, result) => {
                    if (insertError) {
                        return res.status(500).json({
                            message: "Failed to create user."
                        });
                    }

                    return res.status(201).json({
                        message: "User created successfully.",
                        user: {
                            id: result.insertId,
                            full_name,
                            email,
                            role,
                            status: selectedStatus
                        }
                    });
                }
            );
        } catch (hashError) {
            return res.status(500).json({
                message: "Failed to secure password."
            });
        }
    });
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, password, role, status } = req.body;
    if (Number(id) === Number(req.user.id) && (role !== "admin" || status === "Inactive")) return res.status(400).json({ message: "You cannot demote or deactivate your own administrator account." });

    if (!full_name || !email || !role) {
        return res.status(400).json({
            message: "Full name, email, and role are required."
        });
    }

    if (!validRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid role. Role must be admin, leader, or treasurer."
        });
    }

    const selectedStatus = status || "Active";

    if (!validStatuses.includes(selectedStatus)) {
        return res.status(400).json({
            message: "Invalid status. Status must be Active or Inactive."
        });
    }

    const checkUserSql = `
        SELECT id
        FROM users
        WHERE id = ?
    `;

    db.query(checkUserSql, [id], (checkError, existingUser) => {
        if (checkError) {
            return res.status(500).json({
                message: "Failed to check user."
            });
        }

        if (existingUser.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const checkEmailSql = `
            SELECT id
            FROM users
            WHERE email = ? AND id != ?
        `;

        db.query(checkEmailSql, [email, id], async (emailError, emailUsers) => {
            if (emailError) {
                return res.status(500).json({
                    message: "Failed to check email."
                });
            }

            if (emailUsers.length > 0) {
                return res.status(409).json({
                    message: "Another user with this email already exists."
                });
            }

            try {
                let updateSql = "";
                let updateValues = [];

                if (password && password.trim()) {
                    if (password.length < 12) {
                        return res.status(400).json({
                            message: "Password must be at least 12 characters."
                        });
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    updateSql = `
                        UPDATE users
                        SET full_name = ?, email = ?, password = ?, role = ?, status = ?
                        WHERE id = ?
                    `;

                    updateValues = [
                        full_name,
                        email,
                        hashedPassword,
                        role,
                        selectedStatus,
                        id
                    ];
                } else {
                    updateSql = `
                        UPDATE users
                        SET full_name = ?, email = ?, role = ?, status = ?
                        WHERE id = ?
                    `;

                    updateValues = [
                        full_name,
                        email,
                        role,
                        selectedStatus,
                        id
                    ];
                }

                db.query(updateSql, updateValues, (updateError) => {
                    if (updateError) {
                        return res.status(500).json({
                            message: "Failed to update user."
                        });
                    }

                    return res.status(200).json({
                        message: "User updated successfully."
                    });
                });
            } catch (hashError) {
                return res.status(500).json({
                    message: "Failed to secure password."
                });
            }
        });
    });
};

exports.updateUserStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (Number(id) === Number(req.user.id) && status === "Inactive") return res.status(400).json({ message: "You cannot deactivate your own account." });

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status. Status must be Active or Inactive."
        });
    }

    const sql = `
        UPDATE users
        SET status = ?
        WHERE id = ?
    `;

    db.query(sql, [status, id], (error, result) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to update user status."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "User status updated successfully."
        });
    });
};

exports.deactivateUser = (req, res) => {
    const { id } = req.params;

    const sql = `
        UPDATE users
        SET status = 'Inactive'
        WHERE id = ?
    `;

    db.query(sql, [id], (error, result) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to deactivate user."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "User deactivated successfully."
        });
    });
};

// Permanently delete a user account. Related records use ON DELETE SET NULL.
exports.deleteUser = (req, res) => {
    const targetId = Number(req.params.id);
    const currentUserId = Number(req.user?.id);

    if (!Number.isInteger(targetId) || targetId < 1) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    if (targetId === currentUserId) {
        return res.status(400).json({ message: "You cannot delete your own account while signed in." });
    }

    db.query("SELECT id, role FROM users WHERE id = ?", [targetId], (lookupError, rows) => {
        if (lookupError) {
            return res.status(500).json({ message: "Failed to check user account." });
        }
        if (!rows.length) {
            return res.status(404).json({ message: "User not found." });
        }

        const deleteTarget = () => {
            db.query("DELETE FROM users WHERE id = ?", [targetId], (deleteError, result) => {
                if (deleteError) {
                    return res.status(500).json({ message: "Failed to delete user." });
                }
                if (!result.affectedRows) {
                    return res.status(404).json({ message: "User not found." });
                }
                return res.status(200).json({ message: "User deleted successfully." });
            });
        };

        if (rows[0].role !== "admin") return deleteTarget();

        db.query("SELECT COUNT(*) AS \"adminCount\" FROM users WHERE role = 'admin' AND status = 'Active'", (countError, countRows) => {
            if (countError) {
                return res.status(500).json({ message: "Failed to verify administrator accounts." });
            }
            if (Number(countRows[0]?.adminCount || 0) <= 1) {
                return res.status(400).json({ message: "You cannot delete the last administrator account." });
            }
            return deleteTarget();
        });
    });
};
