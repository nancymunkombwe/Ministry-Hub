const express = require("express");

const {
    createVisitor,
    getVisitors,
    getVisitorById,
    updateVisitor,
    deleteVisitor,
    createVisitorFollowUp,
    getVisitorFollowUps
} = require("../controllers/visitorController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createVisitor);
router.get("/", protect, getVisitors);

router.post(
    "/followups",
    protect,
    authorize("admin", "leader"),
    createVisitorFollowUp
);

router.get("/:visitorId/followups", protect, getVisitorFollowUps);

router.get("/:id", protect, getVisitorById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateVisitor
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteVisitor
);

module.exports = router;