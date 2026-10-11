const express = require("express");
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deactivateUser,
    deleteUser
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("admin", "leader", "treasurer"), getUsers);

router.get("/:id", protect, authorize("admin"), getUserById);

router.post("/", protect, authorize("admin"), createUser);

router.put("/:id", protect, authorize("admin"), updateUser);

router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);

router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;