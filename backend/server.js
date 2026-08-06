const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./src/config/db");

dotenv.config();

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
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

app.get("/", (req, res) => {
    res.send("Ministry Hub API Running...");
});

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: "Database connected successfully",
            result: results[0].result
        });
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
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

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});