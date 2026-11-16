const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const validRoles = ["admin", "leader", "treasurer"];

const createToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const cleanUser = (user) => {
    return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
    };
};

exports.register = async (req, res) => {
    const { full_name, email, password, role } = req.body;

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

    if (password.length < 12) {
        return res.status(400).json({
            message: "Password must be at least 12 characters."
        });
    }

    const checkUserSql = `
        SELECT id
        FROM users
        WHERE email = ?
    `;

    db.query(checkUserSql, [email], async (checkError, existingUsers) => {
        if (checkError) {
            return res.status(500).json({
                message: "Failed to check existing user."
            });
        }

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "A user with this email already exists."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const insertUserSql = `
                INSERT INTO users (full_name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertUserSql,
                [full_name, email, hashedPassword, role],
                (insertError, result) => {
                    if (insertError) {
                        return res.status(500).json({
                            message: "Failed to register user."
                        });
                    }

                    return res.status(201).json({
                        message: "User registered successfully.",
                        user: {
                            id: result.insertId,
                            full_name,
                            email,
                            role
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

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const sql = `
        SELECT id, full_name, email, password, role, created_at
        FROM users
        WHERE email = ? AND status = 'Active'
    `;

    db.query(sql, [email], async (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to login."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: cleanUser(user)
        });
    });
};

exports.getProfile = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT id, full_name, email, role, created_at
        FROM users
        WHERE id = ? AND status = 'Active'
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to load profile."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User profile not found."
            });
        }

        return res.status(200).json({
            message: "Profile loaded successfully.",
            user: cleanUser(results[0])
        });
    });
};