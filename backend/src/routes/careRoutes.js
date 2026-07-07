const express = require("express");

const {
    createCareFollowUp,
    getCareFollowUps,
    getCareFollowUpById,
    getMemberCareFollowUps,
    updateCareFollowUp,
    deleteCareFollowUp
} = require("../controllers/careController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createCareFollowUp);
router.get("/", protect, authorize("admin", "leader"), getCareFollowUps);

// Important: this must come before "/:id"
router.get("/member/:memberId", protect, authorize("admin", "leader"), getMemberCareFollowUps);

router.get("/:id", protect, authorize("admin", "leader"), getCareFollowUpById);
router.put("/:id", protect, authorize("admin", "leader"), updateCareFollowUp);
router.delete("/:id", protect, authorize("admin"), deleteCareFollowUp);

module.exports = router;