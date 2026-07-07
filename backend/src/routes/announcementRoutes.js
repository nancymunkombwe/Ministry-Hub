const express = require("express");

const {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getWhatsAppMessage
} = require("../controllers/announcementController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createAnnouncement);
router.get("/", protect, getAnnouncements);

// Important: this route must come before "/:id"
router.get("/:id/whatsapp", protect, getWhatsAppMessage);

router.get("/:id", protect, getAnnouncementById);
router.put("/:id", protect, authorize("admin", "leader"), updateAnnouncement);
router.delete("/:id", protect, authorize("admin"), deleteAnnouncement);

module.exports = router;