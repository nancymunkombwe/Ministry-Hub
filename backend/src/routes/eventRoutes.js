const express = require("express");

const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    createProgramItem,
    getProgramItems
} = require("../controllers/eventController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createEvent);
router.get("/", protect, getEvents);
router.get("/:id", protect, getEventById);
router.put("/:id", protect, authorize("admin", "leader"), updateEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

router.post("/program-items", protect, authorize("admin", "leader"), createProgramItem);
router.get("/:eventId/program-items", protect, getProgramItems);

module.exports = router;