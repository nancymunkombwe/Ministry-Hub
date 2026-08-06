const express = require("express");
const eventController = require("../controllers/eventController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => eventController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing event controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createEvent = pickHandler("createEvent", "addEvent");
const getEvents = pickHandler("getEvents", "getAllEvents");
const getEventById = pickHandler("getEventById", "getEvent");
const updateEvent = pickHandler("updateEvent", "editEvent");
const deleteEvent = pickHandler("deleteEvent", "removeEvent");

const createProgramItem = pickHandler(
    "createProgramItem",
    "addProgramItem",
    "createEventProgramItem"
);

const getProgramItems = pickHandler(
    "getProgramItems",
    "getEventProgramItems",
    "getProgramItemsByEvent"
);

router.get("/", protect, getEvents);

router.post(
    "/",
    protect,
    authorize("admin", "leader"),
    createEvent
);

router.post(
    "/program-items",
    protect,
    authorize("admin", "leader"),
    createProgramItem
);

router.get(
    "/:eventId/program-items",
    protect,
    getProgramItems
);

router.get("/:id", protect, getEventById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateEvent
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "leader"),
    deleteEvent
);

module.exports = router;