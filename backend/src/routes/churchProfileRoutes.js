const express = require("express");
const controller = require("../controllers/churchProfileController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Church profile is visible to authenticated staff; only administrators can change it.
router.get("/", protect, authorize("admin", "leader", "treasurer"), controller.getChurchProfile);
router.put("/", protect, authorize("admin"), controller.updateChurchProfile);

module.exports = router;
