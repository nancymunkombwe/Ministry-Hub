const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            message: "Not authorized. No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const sql = `
            SELECT id, full_name, email, role, created_at
            FROM users
            WHERE id = ?
        `;

        db.query(sql, [decoded.id], (error, results) => {
            if (error) {
                return res.status(500).json({
                    message: "Failed to verify user.",
                    error: error.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "User no longer exists."
                });
            }

            req.user = results[0];

            next();
        });
    } catch (error) {
        return res.status(401).json({
            message: "Not authorized. Invalid or expired token."
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Not authorized."
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
};