const express = require("express");

const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    assignMemberToDepartment,
    getMemberDepartments,
    removeMemberFromDepartment
} = require("../controllers/departmentController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDepartments);
router.get("/member/:memberId", protect, getMemberDepartments);
router.get("/:id", protect, getDepartmentById);

router.post("/", protect, authorize("admin"), createDepartment);
router.post("/assign", protect, authorize("admin", "leader"), assignMemberToDepartment);

router.delete(
    "/member/:memberId/:departmentId",
    protect,
    authorize("admin", "leader"),
    removeMemberFromDepartment
);

module.exports = router;