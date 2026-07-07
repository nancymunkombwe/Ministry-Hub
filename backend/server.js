const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const memberRoutes = require("./src/routes/memberRoutes");
const departmentRoutes = require("./src/routes/departmentRoutes");
const visitorRoutes = require("./src/routes/visitorRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const contributionRoutes = require("./src/routes/contributionRoutes");
const careRoutes = require("./src/routes/careRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const reportRoutes = require("./src/routes/reportRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/care", careRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
    res.send("Ministry Hub API Running...");
});

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Database test failed",
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Database connection is working",
            result: results[0].result
        });
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});