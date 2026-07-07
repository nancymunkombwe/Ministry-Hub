const express = require("express");

const {
    createTask,
    getTasks,
    getTaskById,
    getTasksAssignedToUser,
    updateTask,
    updateTaskStatus,
    deleteTask
} = require("../controllers/taskController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createTask);
router.get("/", protect, authorize("admin", "leader"), getTasks);

// Important: these specific routes must come before "/:id"
router.get("/assigned/:userId", protect, authorize("admin", "leader"), getTasksAssignedToUser);
router.patch("/:id/status", protect, authorize("admin", "leader"), updateTaskStatus);

router.get("/:id", protect, authorize("admin", "leader"), getTaskById);
router.put("/:id", protect, authorize("admin", "leader"), updateTask);
router.delete("/:id", protect, authorize("admin"), deleteTask);

module.exports = router;