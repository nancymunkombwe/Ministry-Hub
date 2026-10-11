const express = require("express");
const departmentController = require("../controllers/departmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => departmentController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing department controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createDepartment = pickHandler("createDepartment", "addDepartment");
const getDepartments = pickHandler("getDepartments", "getAllDepartments");
const getDepartmentById = pickHandler("getDepartmentById", "getDepartment");
const updateDepartment = pickHandler("updateDepartment", "editDepartment");
const deleteDepartment = pickHandler("deleteDepartment", "removeDepartment");

const assignMemberToDepartment = pickHandler(
    "assignMemberToDepartment",
    "assignMember",
    "addMemberToDepartment"
);

const getMemberDepartments = pickHandler(
    "getMemberDepartments",
    "getDepartmentsByMember"
);

const removeMemberFromDepartment = pickHandler(
    "removeMemberFromDepartment",
    "deleteMemberFromDepartment",
    "removeMemberDepartment"
);

router.get("/", protect, getDepartments);

router.post(
    "/",
    protect,
    authorize("admin", "leader"),
    createDepartment
);

router.post(
    "/assign",
    protect,
    authorize("admin", "leader"),
    assignMemberToDepartment
);

router.get(
    "/member/:memberId",
    protect,
    getMemberDepartments
);

router.delete(
    "/member/:memberId/:departmentId",
    protect,
    authorize("admin", "leader"),
    removeMemberFromDepartment
);

router.get("/:id/members", protect, pickHandler("getDepartmentMembers"));

router.get("/:id", protect, getDepartmentById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateDepartment
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "leader"),
    deleteDepartment
);

module.exports = router;