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

router.get("/", protect, getContributions);

router.get(
    "/summary/monthly",
    protect,
    getMonthlyContributionSummary
);

router.get(
    "/member/:memberId",
    protect,
    getMemberContributions
);

router.get("/:id", protect, getContributionById);

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