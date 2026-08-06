const express = require("express");
const taskController = require("../controllers/taskController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => taskController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing task controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createTask = pickHandler("createTask", "addTask");
const getTasks = pickHandler("getTasks", "getAllTasks");
const getTaskById = pickHandler("getTaskById", "getTask");
const updateTask = pickHandler("updateTask", "editTask");
const deleteTask = pickHandler("deleteTask", "removeTask");

const getTasksByAssignedUser = pickHandler(
    "getTasksByAssignedUser",
    "getAssignedTasks",
    "getTasksByUser",
    "getUserTasks"
);

const updateTaskStatus = pickHandler(
    "updateTaskStatus",
    "changeTaskStatus",
    "markTaskStatus"
);

router.get("/", protect, getTasks);

router.post(
    "/",
    protect,
    authorize("admin", "leader"),
    createTask
);

router.get(
    "/assigned/:userId",
    protect,
    getTasksByAssignedUser
);

router.get("/:id", protect, getTaskById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateTask
);

router.patch(
    "/:id/status",
    protect,
    authorize("admin", "leader"),
    updateTaskStatus
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "leader"),
    deleteTask
);

module.exports = router;