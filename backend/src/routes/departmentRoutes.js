const express = require("express");

const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    assignMemberToDepartment,
    getMemberDepartments,
    removeMemberFromDepartment,
    deleteDepartment
} = require("../controllers/departmentController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin"), createDepartment);
router.get("/", protect, getDepartments);

router.post(
    "/assign",
    protect,
    authorize("admin", "leader"),
    assignMemberToDepartment
);

router.get("/member/:memberId", protect, getMemberDepartments);

router.delete(
    "/member/:memberId/:departmentId",
    protect,
    authorize("admin", "leader"),
    removeMemberFromDepartment
);

router.get("/:id", protect, getDepartmentById);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateDepartment
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteDepartment
);

module.exports = router;