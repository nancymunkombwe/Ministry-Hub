const express = require("express");
const {
    createContribution,
    getContributions,
    getContributionById,
    updateContribution,
    deleteContribution,
    getMemberContributions,
    getMonthlyContributionSummary
} = require("../controllers/contributionController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("admin", "treasurer"), getContributions);

router.get(
    "/summary/monthly",
    protect,
    authorize("admin", "treasurer"),
    getMonthlyContributionSummary
);

router.get(
    "/member/:memberId",
    protect,
    authorize("admin", "treasurer"),
    getMemberContributions
);

router.get("/:id", protect, authorize("admin", "treasurer"), getContributionById);

router.post(
    "/",
    protect,
    authorize("admin", "treasurer"),
    createContribution
);

router.put(
    "/:id",
    protect,
    authorize("admin", "treasurer"),
    updateContribution
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "treasurer"),
    deleteContribution
);

module.exports = router;