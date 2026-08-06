const express = require("express");
const announcementController = require("../controllers/announcementController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => announcementController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing announcement controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createAnnouncement = pickHandler(
    "createAnnouncement",
    "addAnnouncement"
);

const getAnnouncements = pickHandler(
    "getAnnouncements",
    "getAllAnnouncements"
);

const getAnnouncementById = pickHandler(
    "getAnnouncementById",
    "getAnnouncement"
);

const updateAnnouncement = pickHandler(
    "updateAnnouncement",
    "editAnnouncement"
);

const deleteAnnouncement = pickHandler(
    "deleteAnnouncement",
    "removeAnnouncement"
);

const getWhatsAppMessage = pickHandler(
    "getWhatsAppMessage",
    "getWhatsappMessage",
    "generateWhatsAppMessage",
    "generateWhatsappMessage",
    "getAnnouncementWhatsAppMessage"
);

router.get("/", protect, getAnnouncements);

router.post(
    "/",
    protect,
    authorize("admin", "leader"),
    createAnnouncement
);

router.get(
    "/:id/whatsapp",
    protect,
    getWhatsAppMessage
);

router.get("/:id", protect, getAnnouncementById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateAnnouncement
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "leader"),
    deleteAnnouncement
);

module.exports = router;