const express = require("express");

const {
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember
} = require("../controllers/memberController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "leader"), createMember);
router.get("/", protect, getMembers);
router.get("/:id", protect, getMemberById);
router.put("/:id", protect, authorize("admin", "leader"), updateMember);
router.delete("/:id", protect, authorize("admin"), deleteMember);

module.exports = router;