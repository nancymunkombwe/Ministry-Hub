const db = require("../config/db");

const fields = [
    "church_name", "address", "phone", "email", "district", "conference",
    "pastor_name", "pastor_phone", "first_elder_name", "first_elder_phone",
    "clerk_name", "clerk_phone", "treasurer_name", "treasurer_phone"
];

exports.getChurchProfile = (req, res) => {
    db.query("SELECT * FROM church_profile WHERE id = 1 LIMIT 1", (error, rows) => {
        if (error) {
            return res.status(500).json({ message: "Could not load church profile. Make sure the church_profile SQL migration has been run." });
        }
        const profile = rows[0] || {};
        return res.json({ profile });
    });
};

exports.updateChurchProfile = (req, res) => {
    const values = fields.map((field) => {
        const value = req.body[field];
        return typeof value === "string" ? value.trim() : "";
    });

    if (!values[0]) {
        return res.status(400).json({ message: "Church name is required." });
    }

    const sql = `
        INSERT INTO church_profile (
            id, ${fields.join(", ")}
        ) VALUES (
            1, ${fields.map(() => "?").join(", ")}
        )
        ON DUPLICATE KEY UPDATE
            ${fields.map((field) => `${field} = VALUES(${field})`).join(", ")},
            updated_at = CURRENT_TIMESTAMP
    `;

    db.query(sql, values, (error) => {
        if (error) {
            return res.status(500).json({ message: "Could not save church profile." });
        }
        return res.json({ message: "Church profile saved successfully." });
    });
};
