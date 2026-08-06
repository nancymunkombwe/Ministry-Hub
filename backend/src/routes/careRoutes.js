const express = require("express");
const careController = require("../controllers/careController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const pickHandler = (...names) => {
    const handler = names
        .map((name) => careController[name])
        .find((fn) => typeof fn === "function");

    return handler || ((req, res) => {
        res.status(500).json({
            message: `Missing care controller function. Tried: ${names.join(", ")}`
        });
    });
};

const createCareFollowup = pickHandler(
    "createCareFollowup",
    "createCareFollowUp",
    "createCare",
    "addCareFollowup",
    "addCareFollowUp"
);

const getCareFollowups = pickHandler(
    "getCareFollowups",
    "getCareFollowUps",
    "getCare",
    "getAllCareFollowups",
    "getAllCareFollowUps"
);

const getCareFollowupById = pickHandler(
    "getCareFollowupById",
    "getCareFollowUpById",
    "getCareById",
    "getCareFollowup"
);

const updateCareFollowup = pickHandler(
    "updateCareFollowup",
    "updateCareFollowUp",
    "updateCare",
    "editCareFollowup"
);

const deleteCareFollowup = pickHandler(
    "deleteCareFollowup",
    "deleteCareFollowUp",
    "deleteCare",
    "removeCareFollowup"
);

const getMemberCareFollowups = pickHandler(
    "getMemberCareFollowups",
    "getMemberCareFollowUps",
    "getCareByMember",
    "getMemberCare"
);

router.get("/", protect, getCareFollowups);

router.post(
    "/",
    protect,
    authorize("admin", "leader"),
    createCareFollowup
);

router.get(
    "/member/:memberId",
    protect,
    getMemberCareFollowups
);

router.get("/:id", protect, getCareFollowupById);

router.put(
    "/:id",
    protect,
    authorize("admin", "leader"),
    updateCareFollowup
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "leader"),
    deleteCareFollowup
);

module.exports = router;