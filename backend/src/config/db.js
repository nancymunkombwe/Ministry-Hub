const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((error) => {
    if (error) {
        console.error("Database connection failed");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        return;
    }

    console.log("MySQL database connected successfully");
});

module.exports = db;