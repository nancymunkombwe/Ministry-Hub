const express = require("express");

const {
    createContribution,
    getContributions,
    getContributionById,
    getMemberContributions,
    updateContribution,
    deleteContribution,
    getMonthlyContributionSummary
} = require("../controllers/contributionController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "treasurer"), createContribution);
router.get("/", protect, authorize("admin", "treasurer"), getContributions);

// Important: these specific routes must come before "/:id"
router.get("/summary/monthly", protect, authorize("admin", "treasurer"), getMonthlyContributionSummary);
router.get("/member/:memberId", protect, authorize("admin", "treasurer"), getMemberContributions);

router.get("/:id", protect, authorize("admin", "treasurer"), getContributionById);
router.put("/:id", protect, authorize("admin", "treasurer"), updateContribution);
router.delete("/:id", protect, authorize("admin"), deleteContribution);

module.exports = router;