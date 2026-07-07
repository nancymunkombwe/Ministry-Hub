const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Full name, email, and password are required"
        });
    }

    const allowedRoles = ["admin", "leader", "treasurer"];
    const userRole = role || "leader";

    if (!allowedRoles.includes(userRole)) {
        return res.status(400).json({
            success: false,
            message: "Invalid role. Use admin, leader, or treasurer."
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Database error while checking user",
                    error: error.message
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A user with this email already exists"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
                [full_name, email, hashedPassword, userRole],
                (error, result) => {
                    if (error) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to register user",
                            error: error.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "User registered successfully",
                        user: {
                            id: result.insertId,
                            full_name,
                            email,
                            role: userRole
                        }
                    });
                }
            );
        }
    );
};

// LOGIN USER
const loginUser = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Database error while logging in",
                    error: error.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            const passwordMatches = await bcrypt.compare(password, user.password);

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        }
    );
};

// GET LOGGED-IN USER PROFILE
const getProfile = (req, res) => {
    db.query(
        "SELECT id, full_name, email, role, created_at FROM users WHERE id = ?",
        [req.user.id],
        (error, results) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Database error while fetching profile",
                    error: error.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.json({
                success: true,
                user: results[0]
            });
        }
    );
};

module.exports = {
    registerUser,
    loginUser,
    getProfile
};