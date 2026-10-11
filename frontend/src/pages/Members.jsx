import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaUsers,
    FaUserSlash,
    FaUserCheck,
    FaTrash,
    FaEye,
    FaChild,
    FaBriefcase,
    FaChurch,
    FaHeart,
    FaCalendarAlt
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageMembers,
    getNoPermissionMessage
} from "../utils/permissions";


/* =====================================================
   EMPTY MEMBER FORM
===================================================== */

const emptyForm = {
    first_name: "",
    last_name: "",
    gender: "Female",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",

    marital_status: "Single",
    spouse_name: "",
    number_of_children: 0,
    children_details: "",

    occupation: "",
    employer: "",

    date_joined_church: "",
    baptism_status: "Unknown",
    baptism_date: "",

    membership_status: "Active",
    follow_up_status: "Okay",

    ministry_role: "",
    ministry_department_id: ""
};


/* =====================================================
   CREATE EMPTY CHILD
===================================================== */

const createEmptyChild = () => ({
    name: "",
    age: "",
    gender: "Female"
});


/* =====================================================
   CREATE BULK ROW
===================================================== */

const createEmptyBulkRow = () => ({
    first_name: "",
    last_name: "",
    gender: "Female",
    phone: "",
    email: "",
    ministry_role: "",
    baptism_date: "",
    membership_status: "Active",
    address: ""
});


/* =====================================================
   HELPERS
===================================================== */

const parseChildren = (childrenDetails) => {
    if (!childrenDetails) {
        return [];
    }

    if (Array.isArray(childrenDetails)) {
        return childrenDetails;
    }

    try {
        const parsed = JSON.parse(childrenDetails);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        return [];
    } catch {
        return [];
    }
};


const formatDate = (dateValue) => {
    if (!dateValue) return "";

    return String(dateValue).split("T")[0];
};


const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return formatDate(dateValue);
    }

    return date.toLocaleDateString("en-GB");
};


/* =====================================================
   MEMBERS COMPONENT
===================================================== */

const Members = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";

    const canEditMembers = canManageMembers(role);


    /* =====================================================
       STATE
    ===================================================== */

    const [members, setMembers] = useState([]);

    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState(emptyForm);

    const [children, setChildren] = useState([]);

    const [bulkRows, setBulkRows] = useState([
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow()
    ]);

    const [searchTerm, setSearchTerm] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [selectedMember, setSelectedMember] = useState(null);

    const [showForm, setShowForm] = useState(false);

    const [showBulkForm, setShowBulkForm] = useState(false);

    const [memberToToggle, setMemberToToggle] = useState(null);

    const [memberToDelete, setMemberToDelete] = useState(null);

    const [deletingMember, setDeletingMember] = useState(false);

    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [savingBulk, setSavingBulk] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    /* =====================================================
       SCROLL TO FORM
    ===================================================== */

    const scrollToForm = () => {
        setTimeout(() => {
            const formCard = document.querySelector(".form-card");

            if (formCard) {
                formCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }, 100);
    };


    /* =====================================================
       MEMBER ID
    ===================================================== */

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };


    /* =====================================================
       MEMBER NAME
    ===================================================== */

    const getMemberName = (member) => {
        return `${member.first_name || ""} ${
            member.last_name || ""
        }`.trim();
    };


    /* =====================================================
       FETCH MEMBERS
    ===================================================== */

    const fetchMembers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/members");

            const memberList =
                response.data.members ||
                response.data.data ||
                response.data;

            setMembers(
                Array.isArray(memberList)
                    ? memberList
                    : []
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load members. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };


    const fetchDepartments = async () => {
        try {
            const response = await API.get("/departments");
            const list = response.data.departments || response.data.data || response.data;
            setDepartments(Array.isArray(list) ? list : []);
        } catch (fetchError) {
            console.error("Failed to load ministries:", fetchError);
            setDepartments([]);
        }
    };


    useEffect(() => {
        fetchMembers();
        fetchDepartments();
    }, []);


    /* =====================================================
       FILTER MEMBERS
    ===================================================== */

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const searchableText = `
                ${member.first_name || ""}
                ${member.last_name || ""}
                ${member.gender || ""}
                ${member.phone || ""}
                ${member.email || ""}
                ${member.assigned_ministry || member.ministry_role || ""}
                ${member.membership_status || ""}
                ${member.baptism_status || ""}
            `.toLowerCase();

            return searchableText.includes(
                searchTerm.toLowerCase()
            );
        });
    }, [members, searchTerm]);


    /* =====================================================
       STATISTICS
    ===================================================== */

    const activeMembers = members.filter(
        (member) =>
            (member.membership_status || "Active") ===
            "Active"
    ).length;


    const inactiveMembers = members.filter(
        (member) =>
            member.membership_status === "Inactive"
    ).length;


    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));


        /* Automatically create child fields */

        if (name === "number_of_children") {
            const count = Math.max(
                0,
                Number(value) || 0
            );

            setChildren((previousChildren) => {
                const newChildren = [];

                for (let i = 0; i < count; i++) {
                    newChildren.push(
                        previousChildren[i] ||
                            createEmptyChild()
                    );
                }

                return newChildren;
            });
        }
    };


    /* =====================================================
       CHILD CHANGE
    ===================================================== */

    const handleChildChange = (
        index,
        field,
        value
    ) => {
        setChildren((previousChildren) =>
            previousChildren.map(
                (child, childIndex) =>
                    childIndex === index
                        ? {
                              ...child,
                              [field]: value
                          }
                        : child
            )
        );
    };


    /* =====================================================
       BULK CHANGE
    ===================================================== */

    const handleBulkChange = (
        index,
        field,
        value
    ) => {
        setBulkRows((previousRows) =>
            previousRows.map(
                (row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
            )
        );
    };


    /* =====================================================
       ADD BULK ROW
    ===================================================== */

    const addBulkRow = () => {
        setBulkRows((previousRows) => [
            ...previousRows,
            createEmptyBulkRow()
        ]);
    };


    /* =====================================================
       REMOVE BULK ROW
    ===================================================== */

    const removeBulkRow = (index) => {
        setBulkRows((previousRows) => {
            if (previousRows.length === 1) {
                return previousRows;
            }

            return previousRows.filter(
                (_, rowIndex) =>
                    rowIndex !== index
            );
        });
    };


    /* =====================================================
       OPEN ADD FORM
    ===================================================== */

    const openAddForm = () => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );
            return;
        }

        setFormData({
            ...emptyForm
        });

        setChildren([]);

        setEditingId(null);

        setShowForm(true);

        setShowBulkForm(false);

        setError("");

        setSuccess("");

        scrollToForm();
    };


    /* =====================================================
       OPEN BULK FORM
    ===================================================== */

    const openBulkForm = () => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );
            return;
        }

        setBulkRows([
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow()
        ]);

        setShowBulkForm(true);

        setShowForm(false);

        setEditingId(null);

        setError("");

        setSuccess("");

        scrollToForm();
    };


    /* =====================================================
       RESET FORM
    ===================================================== */

    const resetForm = () => {
        setFormData({
            ...emptyForm
        });

        setChildren([]);

        setEditingId(null);

        setShowForm(false);

        setError("");
    };


    /* =====================================================
       RESET BULK FORM
    ===================================================== */

    const resetBulkForm = () => {
        setBulkRows([
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow()
        ]);

        setShowBulkForm(false);

        setError("");
    };


    /* =====================================================
       OPEN MEMBER DETAILS
    ===================================================== */

    const openMemberDetails = (member) => {
        setSelectedMember(member);
    };


    /* =====================================================
       CLOSE MEMBER DETAILS
    ===================================================== */

    const closeMemberDetails = () => {
        setSelectedMember(null);
    };


    /* =====================================================
       SUBMIT MEMBER
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );
            return;
        }

        setSaving(true);

        setError("");

        setSuccess("");


        if (
            !formData.first_name.trim() ||
            !formData.last_name.trim() ||
            !formData.gender
        ) {
            setError(
                "First name, last name, and gender are required."
            );

            setSaving(false);

            return;
        }


        try {
            const validChildren =
                children
                    .filter(
                        (child) =>
                            child.name.trim()
                    )
                    .map((child) => ({
                        name: child.name.trim(),
                        age: child.age
                            ? Number(child.age)
                            : "",
                        gender: child.gender
                    }));


            const payload = {
                first_name:
                    formData.first_name.trim(),

                last_name:
                    formData.last_name.trim(),

                gender:
                    formData.gender,

                date_of_birth:
                    formData.date_of_birth ||
                    null,

                phone:
                    formData.phone ||
                    null,

                email:
                    formData.email ||
                    null,

                address:
                    formData.address ||
                    null,

                marital_status:
                    formData.marital_status ||
                    "Single",

                spouse_name:
                    formData.spouse_name ||
                    null,

                number_of_children:
                    Number(
                        formData.number_of_children
                    ) || 0,

                children_details:
                    JSON.stringify(
                        validChildren
                    ),

                occupation:
                    formData.occupation ||
                    null,

                employer:
                    formData.employer ||
                    null,

                date_joined_church:
                    formData.date_joined_church ||
                    null,

                baptism_status:
                    formData.baptism_status ||
                    "Unknown",

                baptism_date:
                    formData.baptism_date ||
                    null,

                membership_status:
                    formData.membership_status ||
                    "Active",

                follow_up_status:
                    formData.follow_up_status ||
                    "Okay",

                ministry_role:
                    departments.find((department) => String(department.id) === String(formData.ministry_department_id))?.name ||
                    formData.ministry_role ||
                    null
            };


            let savedMemberId = editingId;
            if (editingId) {
                await API.put(
                    `/members/${editingId}`,
                    payload
                );
            } else {
                const createResponse = await API.post(
                    "/members",
                    payload
                );
                savedMemberId = createResponse.data.member_id || createResponse.data.id;
            }

            // Keep the formal member_departments relationship in sync with the dropdown.
            // Add the new assignment first, then remove any previous ministry assignments.
            if (savedMemberId) {
                const currentResponse = await API.get(`/departments/member/${savedMemberId}`);
                const currentAssignments = currentResponse.data.departments || [];
                const selectedDepartmentId = formData.ministry_department_id;
                const alreadyAssigned = currentAssignments.some(
                    (assignment) => String(assignment.department_id) === String(selectedDepartmentId)
                );

                if (selectedDepartmentId && !alreadyAssigned) {
                    await API.post("/departments/assign", {
                        member_id: savedMemberId,
                        department_id: Number(selectedDepartmentId)
                    });
                }

                for (const assignment of currentAssignments) {
                    if (!selectedDepartmentId || String(assignment.department_id) !== String(selectedDepartmentId)) {
                        await API.delete(`/departments/member/${savedMemberId}/${assignment.department_id}`);
                    }
                }
            }

            setSuccess(
                editingId ? "Member updated successfully." : "Member added successfully."
            );


            resetForm();

            await fetchMembers();

        } catch (error) {
            console.error(
                "Save member error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to save member. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };


    /* =====================================================
       SAVE BULK MEMBERS
    ===================================================== */

    const handleSaveBulkMembers = async () => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );

            return;
        }

        setSavingBulk(true);

        setError("");

        setSuccess("");


        const rowsWithData =
            bulkRows.filter((row) => {
                return (
                    row.first_name.trim() ||
                    row.last_name.trim() ||
                    row.phone.trim() ||
                    row.email.trim() ||
                    row.ministry_role.trim()
                );
            });


        if (rowsWithData.length === 0) {
            setError(
                "Please enter at least one member."
            );

            setSavingBulk(false);

            return;
        }


        const hasInvalidRow =
            rowsWithData.some((row) => {
                return (
                    !row.first_name.trim() ||
                    !row.last_name.trim() ||
                    !row.gender
                );
            });


        if (hasInvalidRow) {
            setError(
                "Each member must have first name, last name, and gender."
            );

            setSavingBulk(false);

            return;
        }


        try {
            for (const row of rowsWithData) {
                const payload = {
                    first_name:
                        row.first_name,

                    last_name:
                        row.last_name,

                    gender:
                        row.gender,

                    phone:
                        row.phone || null,

                    email:
                        row.email || null,

                    address:
                        row.address || null,

                    marital_status:
                        "Single",

                    spouse_name:
                        null,

                    number_of_children:
                        0,

                    children_details:
                        JSON.stringify([]),

                    occupation:
                        null,

                    employer:
                        null,

                    date_joined_church:
                        null,

                    baptism_status:
                        "Unknown",

                    baptism_date:
                        row.baptism_date ||
                        null,

                    membership_status:
                        row.membership_status ||
                        "Active",

                    follow_up_status:
                        "Okay",

                    ministry_role:
                        row.ministry_role ||
                        null
                };


                await API.post(
                    "/members",
                    payload
                );
            }


            setSuccess(
                `${rowsWithData.length} member(s) added successfully.`
            );

            resetBulkForm();

            await fetchMembers();

        } catch (error) {
            console.error(
                "Bulk member error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to save bulk members. Some members may have already been saved."
            );
        } finally {
            setSavingBulk(false);
        }
    };


    /* =====================================================
       OPEN STATUS MODAL
    ===================================================== */

    const openStatusModal = (member) => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );

            return;
        }

        setMemberToToggle(member);

        setError("");

        setSuccess("");
    };


    /* =====================================================
       CLOSE STATUS MODAL
    ===================================================== */

    const closeStatusModal = () => {
        setMemberToToggle(null);
    };


    /* =====================================================
       PERMANENT MEMBER DELETE
    ===================================================== */

    const handleDeleteMember = async () => {
        if (!canEditMembers || !memberToDelete) {
            if (!canEditMembers) setError(getNoPermissionMessage());
            return;
        }

        const memberId = getMemberId(memberToDelete);
        if (!memberId) {
            setError("Could not identify this member. Please refresh and try again.");
            return;
        }

        setDeletingMember(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/members/${memberId}`);
            const deletedName = getMemberName(memberToDelete);
            if (selectedMember && getMemberId(selectedMember) === memberId) {
                setSelectedMember(null);
            }
            setMemberToDelete(null);
            setSuccess(`${deletedName} was deleted successfully.`);
            await fetchMembers();
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || "Failed to delete member.");
        } finally {
            setDeletingMember(false);
        }
    };


    /* =====================================================
       CONFIRM STATUS CHANGE
    ===================================================== */

    const confirmStatusChange = async () => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );

            return;
        }

        if (!memberToToggle) {
            return;
        }

        setUpdatingStatus(true);

        setError("");

        setSuccess("");


        const currentStatus =
            memberToToggle.membership_status ||
            "Active";

        const newStatus =
            currentStatus === "Active"
                ? "Inactive"
                : "Active";


        try {
            const payload = {
                first_name:
                    memberToToggle.first_name ||
                    "",

                last_name:
                    memberToToggle.last_name ||
                    "",

                gender:
                    memberToToggle.gender ||
                    "Female",

                date_of_birth:
                    formatDate(
                        memberToToggle.date_of_birth
                    ) || null,

                phone:
                    memberToToggle.phone ||
                    null,

                email:
                    memberToToggle.email ||
                    null,

                address:
                    memberToToggle.address ||
                    null,

                marital_status:
                    memberToToggle.marital_status ||
                    "Single",

                spouse_name:
                    memberToToggle.spouse_name ||
                    null,

                number_of_children:
                    Number(
                        memberToToggle.number_of_children
                    ) || 0,

                children_details:
                    memberToToggle.children_details ||
                    JSON.stringify([]),

                occupation:
                    memberToToggle.occupation ||
                    null,

                employer:
                    memberToToggle.employer ||
                    null,

                date_joined_church:
                    formatDate(
                        memberToToggle.date_joined_church
                    ) || null,

                baptism_status:
                    memberToToggle.baptism_status ||
                    "Unknown",

                baptism_date:
                    formatDate(
                        memberToToggle.baptism_date
                    ) || null,

                membership_status:
                    newStatus,

                follow_up_status:
                    memberToToggle.follow_up_status ||
                    "Okay",

                ministry_role:
                    memberToToggle.ministry_role ||
                    null
            };


            await API.put(
                `/members/${getMemberId(
                    memberToToggle
                )}`,
                payload
            );


            setSuccess(
                newStatus === "Inactive"
                    ? "Member deactivated successfully."
                    : "Member activated successfully."
            );


            setMemberToToggle(null);

            await fetchMembers();

        } catch (error) {
            console.error(
                "Status update error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to update member status. Please try again."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };


    /* =====================================================
       EDIT MEMBER
    ===================================================== */

    const handleEdit = async (member) => {
        if (!canEditMembers) {
            setError(
                getNoPermissionMessage()
            );

            return;
        }


        const parsedChildren =
            parseChildren(
                member.children_details
            );


        setEditingId(
            getMemberId(member)
        );


        setFormData({
            first_name:
                member.first_name || "",

            last_name:
                member.last_name || "",

            gender:
                member.gender || "Female",

            date_of_birth:
                formatDate(
                    member.date_of_birth
                ),

            phone:
                member.phone || "",

            email:
                member.email || "",

            address:
                member.address || "",

            marital_status:
                member.marital_status ||
                "Single",

            spouse_name:
                member.spouse_name || "",

            number_of_children:
                Number(
                    member.number_of_children
                ) || parsedChildren.length,

            children_details:
                member.children_details ||
                "",

            occupation:
                member.occupation || "",

            employer:
                member.employer || "",

            date_joined_church:
                formatDate(
                    member.date_joined_church
                ),

            baptism_status:
                member.baptism_status ||
                "Unknown",

            baptism_date:
                formatDate(
                    member.baptism_date
                ),

            membership_status:
                member.membership_status ||
                "Active",

            follow_up_status:
                member.follow_up_status ||
                "Okay",

            ministry_role:
                member.assigned_ministry || member.ministry_role || "",
            ministry_department_id: ""
        });

        try {
            const memberId = getMemberId(member);
            const assignmentResponse = await API.get(`/departments/member/${memberId}`);
            const assignments = assignmentResponse.data.departments || [];
            const currentAssignment = assignments[0];
            const legacyMatch = departments.find(
                (department) => String(department.name).trim().toLowerCase() === String(member.assigned_ministry || member.ministry_role || "").trim().toLowerCase()
            );
            setFormData((previousData) => ({
                ...previousData,
                ministry_department_id: currentAssignment
                    ? String(currentAssignment.department_id)
                    : (legacyMatch ? String(legacyMatch.id) : "")
            }));
        } catch (assignmentError) {
            console.error("Could not load member ministry assignment:", assignmentError);
        }


        setChildren(
            parsedChildren.length > 0
                ? parsedChildren
                : []
        );


        setShowForm(true);

        setShowBulkForm(false);

        setSuccess("");

        setError("");

        scrollToForm();
    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="page page-fade">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="page-header page-header-row">

                <div>
                    <span className="eyebrow">
                        Member Management
                    </span>

                    <h1>Members</h1>

                    <p>
                        Register, update, view and
                        manage church members.
                    </p>
                </div>


                {canEditMembers && (
                    <div className="toolbar-actions">

                        <button
                            className="secondary-btn"
                            onClick={openBulkForm}
                        >
                            <FaUsers />
                            Add Multiple
                        </button>


                        <button
                            className="primary-btn"
                            onClick={openAddForm}
                        >
                            <FaPlus />
                            Add Member
                        </button>

                    </div>
                )}

            </div>


            {/* =================================================
                PERMISSION MESSAGE
            ================================================= */}

            {!canEditMembers && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}


            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}


            {/* =================================================
                MEMBER DETAILS MODAL
            ================================================= */}

            {selectedMember && (
                <div className="modal-overlay">

                    <div
                        className="form-card"
                        style={{
                            width: "min(900px, 95vw)",
                            maxHeight: "90vh",
                            overflowY: "auto"
                        }}
                    >

                        <div className="section-header">

                            <div>
                                <span className="eyebrow">
                                    Member Profile
                                </span>

                                <h2>
                                    {getMemberName(
                                        selectedMember
                                    )}
                                </h2>

                                <p>
                                    Complete member
                                    information
                                </p>
                            </div>


                            <button
                                className="icon-btn"
                                onClick={
                                    closeMemberDetails
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>


                        {/* =========================================
                            STATUS
                        ========================================= */}

                        <div
                            style={{
                                marginBottom: "20px"
                            }}
                        >
                            <span
                                className={`status-badge ${
                                    selectedMember.membership_status ||
                                    "Active"
                                }`}
                            >
                                {selectedMember.membership_status ||
                                    "Active"}
                            </span>
                        </div>


                        {/* =========================================
                            PERSONAL INFORMATION
                        ========================================= */}

                        <div className="section-header">
                            <div>
                                <h3>
                                    Personal Information
                                </h3>
                            </div>
                        </div>


                        <div className="form-grid">

                            <div>
                                <label>
                                    First Name
                                </label>

                                <p>
                                    {selectedMember.first_name ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Last Name
                                </label>

                                <p>
                                    {selectedMember.last_name ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Gender
                                </label>

                                <p>
                                    {selectedMember.gender ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Date of Birth
                                </label>

                                <p>
                                    {formatDateForDisplay(
                                        selectedMember.date_of_birth
                                    )}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Phone
                                </label>

                                <p>
                                    {selectedMember.phone ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Email
                                </label>

                                <p>
                                    {selectedMember.email ||
                                        "-"}
                                </p>
                            </div>


                            <div className="full-width">
                                <label>
                                    Address
                                </label>

                                <p>
                                    {selectedMember.address ||
                                        "-"}
                                </p>
                            </div>

                        </div>


                        {/* =========================================
                            FAMILY INFORMATION
                        ========================================= */}

                        <div
                            className="section-header"
                            style={{
                                marginTop: "25px"
                            }}
                        >
                            <div>
                                <h3>
                                    <FaHeart /> Family
                                    Information
                                </h3>
                            </div>
                        </div>


                        <div className="form-grid">

                            <div>
                                <label>
                                    Marital Status
                                </label>

                                <p>
                                    {selectedMember.marital_status ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Spouse
                                </label>

                                <p>
                                    {selectedMember.spouse_name ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Number of Children
                                </label>

                                <p>
                                    {selectedMember.number_of_children ??
                                        0}
                                </p>
                            </div>

                        </div>


                        {/* =========================================
                            CHILDREN
                        ========================================= */}

                        {(() => {
                            const memberChildren =
                                parseChildren(
                                    selectedMember.children_details
                                );

                            return (
                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >

                                    <h4>
                                        <FaChild /> Children
                                    </h4>


                                    {memberChildren.length ===
                                    0 ? (
                                        <p>
                                            No children
                                            recorded.
                                        </p>
                                    ) : (
                                        <div className="table-wrapper">

                                            <table className="data-table">

                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Name
                                                        </th>

                                                        <th>
                                                            Age
                                                        </th>

                                                        <th>
                                                            Gender
                                                        </th>
                                                    </tr>
                                                </thead>


                                                <tbody>

                                                    {memberChildren.map(
                                                        (
                                                            child,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                <td>
                                                                    {child.name ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {child.age ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {child.gender ||
                                                                        "-"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>
                                    )}

                                </div>
                            );
                        })()}


                        {/* =========================================
                            EMPLOYMENT
                        ========================================= */}

                        <div
                            className="section-header"
                            style={{
                                marginTop: "25px"
                            }}
                        >
                            <div>
                                <h3>
                                    <FaBriefcase /> Employment
                                </h3>
                            </div>
                        </div>


                        <div className="form-grid">

                            <div>
                                <label>
                                    Occupation
                                </label>

                                <p>
                                    {selectedMember.occupation ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Employer
                                </label>

                                <p>
                                    {selectedMember.employer ||
                                        "-"}
                                </p>
                            </div>

                        </div>


                        {/* =========================================
                            CHURCH INFORMATION
                        ========================================= */}

                        <div
                            className="section-header"
                            style={{
                                marginTop: "25px"
                            }}
                        >
                            <div>
                                <h3>
                                    <FaChurch /> Church
                                    Information
                                </h3>
                            </div>
                        </div>


                        <div className="form-grid">

                            <div>
                                <label>
                                    Date Joined Church
                                </label>

                                <p>
                                    {formatDateForDisplay(
                                        selectedMember.date_joined_church
                                    )}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Baptism Status
                                </label>

                                <p>
                                    {selectedMember.baptism_status ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Baptism Date
                                </label>

                                <p>
                                    {formatDateForDisplay(
                                        selectedMember.baptism_date
                                    )}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Membership Status
                                </label>

                                <p>
                                    {selectedMember.membership_status ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Follow-up Status
                                </label>

                                <p>
                                    {selectedMember.follow_up_status ||
                                        "-"}
                                </p>
                            </div>


                            <div>
                                <label>
                                    Ministry
                                </label>

                                <p>
                                    {selectedMember.ministry_role ||
                                        "-"}
                                </p>
                            </div>

                        </div>


                        {/* =========================================
                            ACTIONS
                        ========================================= */}

                        <div className="form-actions">

                            {canEditMembers && (
                                <button
                                    className="primary-btn"
                                    onClick={() => {
                                        const member =
                                            selectedMember;

                                        closeMemberDetails();

                                        handleEdit(
                                            member
                                        );
                                    }}
                                >
                                    <FaEdit />
                                    Edit Member
                                </button>
                            )}


                            <button
                                className="secondary-btn"
                                onClick={
                                    closeMemberDetails
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                PERMANENT DELETE MODAL
            ================================================= */}

            {memberToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon"><FaTrash /></div>
                        <h2>Delete Member?</h2>
                        <p>Are you sure you want to permanently delete <strong>{getMemberName(memberToDelete)}</strong>?</p>
                        <p className="delete-warning">This cannot be undone. Attendance and follow-up records linked to this member may also be removed.</p>
                        <div className="delete-modal-actions">
                            <button className="secondary-btn" onClick={() => setMemberToDelete(null)} disabled={deletingMember}>Cancel</button>
                            <button className="danger-btn" onClick={handleDeleteMember} disabled={deletingMember}>
                                {deletingMember ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =================================================
                STATUS MODAL
            ================================================= */}

            {memberToToggle && (
                <div className="modal-overlay">

                    <div className="delete-modal">

                        <div className="delete-modal-icon">

                            {(memberToToggle.membership_status ||
                                "Active") ===
                            "Active" ? (
                                <FaUserSlash />
                            ) : (
                                <FaUserCheck />
                            )}

                        </div>


                        <h2>
                            {(memberToToggle.membership_status ||
                                "Active") ===
                            "Active"
                                ? "Deactivate Member?"
                                : "Activate Member?"}
                        </h2>


                        <p>
                            Are you sure you want to{" "}
                            {(memberToToggle.membership_status ||
                                "Active") ===
                            "Active"
                                ? "deactivate"
                                : "activate"}{" "}
                            <strong>
                                {getMemberName(
                                    memberToToggle
                                )}
                            </strong>
                            ?
                        </p>


                        <p className="delete-warning">
                            The member record will
                            remain in the system for
                            history.
                        </p>


                        <div className="delete-modal-actions">

                            <button
                                className="secondary-btn"
                                onClick={
                                    closeStatusModal
                                }
                                disabled={
                                    updatingStatus
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="danger-btn"
                                onClick={
                                    confirmStatusChange
                                }
                                disabled={
                                    updatingStatus
                                }
                            >
                                {updatingStatus
                                    ? "Updating..."
                                    : (memberToToggle.membership_status ||
                                          "Active") ===
                                      "Active"
                                    ? "Yes, Deactivate"
                                    : "Yes, Activate"}
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="dashboard-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <h3>
                        Total Members
                    </h3>

                    <p>
                        {members.length}
                    </p>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>

                    <h3>
                        Active Members
                    </h3>

                    <p>
                        {activeMembers}
                    </p>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <FaUserSlash />
                    </div>

                    <h3>
                        Inactive Members
                    </h3>

                    <p>
                        {inactiveMembers}
                    </p>

                </div>

            </div>


            {/* =================================================
                BULK FORM
            ================================================= */}

            {showBulkForm &&
                canEditMembers && (
                    <div className="form-card">

                        <div className="section-header">

                            <div>
                                <h2>
                                    Add Multiple Members
                                </h2>

                                <p>
                                    Enter multiple
                                    members and save
                                    them all.
                                </p>
                            </div>


                            <button
                                className="icon-btn"
                                onClick={
                                    resetBulkForm
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>


                        <div className="bulk-member-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={
                                    addBulkRow
                                }
                            >
                                <FaPlus />
                                Add Row
                            </button>


                            <span>
                                {bulkRows.length}{" "}
                                row(s)
                            </span>

                        </div>


                        <div className="table-wrapper bulk-members-wrapper">

                            <table className="data-table bulk-members-table">

                                <thead>

                                    <tr>
                                        <th>
                                            First Name
                                        </th>

                                        <th>
                                            Last Name
                                        </th>

                                        <th>
                                            Gender
                                        </th>

                                        <th>
                                            Phone
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Ministry
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Remove
                                        </th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {bulkRows.map(
                                        (
                                            row,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    index
                                                }
                                            >

                                                <td>
                                                    <input
                                                        value={
                                                            row.first_name
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "first_name",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="First name"
                                                    />
                                                </td>


                                                <td>
                                                    <input
                                                        value={
                                                            row.last_name
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "last_name",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Last name"
                                                    />
                                                </td>


                                                <td>
                                                    <select
                                                        value={
                                                            row.gender
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "gender",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="Female">
                                                            Female
                                                        </option>

                                                        <option value="Male">
                                                            Male
                                                        </option>
                                                    </select>
                                                </td>


                                                <td>
                                                    <input
                                                        value={
                                                            row.phone
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "phone",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Phone"
                                                    />
                                                </td>


                                                <td>
                                                    <input
                                                        value={
                                                            row.email
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "email",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Email"
                                                    />
                                                </td>


                                                <td>
                                                    <input
                                                        value={
                                                            row.ministry_role
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "ministry_role",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="e.g. Youth"
                                                    />
                                                </td>


                                                <td>
                                                    <select
                                                        value={
                                                            row.membership_status
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBulkChange(
                                                                index,
                                                                "membership_status",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="Active">
                                                            Active
                                                        </option>

                                                        <option value="Inactive">
                                                            Inactive
                                                        </option>
                                                    </select>
                                                </td>


                                                <td>
                                                    <button
                                                        type="button"
                                                        className="table-delete-btn"
                                                        onClick={() =>
                                                            removeBulkRow(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>


                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={
                                    resetBulkForm
                                }
                                disabled={
                                    savingBulk
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="primary-btn"
                                onClick={
                                    handleSaveBulkMembers
                                }
                                disabled={
                                    savingBulk
                                }
                            >
                                <FaSave />

                                {savingBulk
                                    ? "Saving Members..."
                                    : "Save All Members"}
                            </button>

                        </div>

                    </div>
                )}


            {/* =================================================
                ADD / EDIT FORM
            ================================================= */}

            {showForm &&
                canEditMembers && (
                    <div className="form-card">

                        <div className="section-header">

                            <div>
                                <h2>
                                    {editingId
                                        ? "Edit Member"
                                        : "Add New Member"}
                                </h2>

                                <p>
                                    Enter the member
                                    information below.
                                </p>
                            </div>


                            <button
                                className="icon-btn"
                                onClick={
                                    resetForm
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            {/* =====================================
                                PERSONAL
                            ===================================== */}

                            <h3>
                                Personal Information
                            </h3>


                            <div className="form-grid">

                                <div>
                                    <label>
                                        First Name *
                                    </label>

                                    <input
                                        name="first_name"
                                        value={
                                            formData.first_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. John"
                                    />
                                </div>


                                <div>
                                    <label>
                                        Last Name *
                                    </label>

                                    <input
                                        name="last_name"
                                        value={
                                            formData.last_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Banda"
                                    />
                                </div>


                                <div>
                                    <label>
                                        Gender *
                                    </label>

                                    <select
                                        name="gender"
                                        value={
                                            formData.gender
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Female">
                                            Female
                                        </option>

                                        <option value="Male">
                                            Male
                                        </option>
                                    </select>
                                </div>


                                <div>
                                    <label>
                                        Date of Birth
                                    </label>

                                    <input
                                        name="date_of_birth"
                                        type="date"
                                        value={
                                            formData.date_of_birth
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>


                                <div>
                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        name="phone"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 0970000000"
                                    />
                                </div>


                                <div>
                                    <label>
                                        Email
                                    </label>

                                    <input
                                        name="email"
                                        type="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. member@email.com"
                                    />
                                </div>


                                <div className="full-width">
                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={
                                            formData.address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="3"
                                        placeholder="Enter member address"
                                    />
                                </div>

                            </div>


                            {/* =====================================
                                FAMILY
                            ===================================== */}

                            <h3
                                style={{
                                    marginTop:
                                        "30px"
                                }}
                            >
                                Family Information
                            </h3>


                            <div className="form-grid">

                                <div>
                                    <label>
                                        Marital Status
                                    </label>

                                    <select
                                        name="marital_status"
                                        value={
                                            formData.marital_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Single">
                                            Single
                                        </option>

                                        <option value="Married">
                                            Married
                                        </option>

                                        <option value="Divorced">
                                            Divorced
                                        </option>

                                        <option value="Widowed">
                                            Widowed
                                        </option>
                                    </select>
                                </div>


                                <div>
                                    <label>
                                        Spouse Name
                                    </label>

                                    <input
                                        name="spouse_name"
                                        value={
                                            formData.spouse_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter spouse name"
                                    />
                                </div>


                                <div>
                                    <label>
                                        Number of Children
                                    </label>

                                    <input
                                        name="number_of_children"
                                        type="number"
                                        min="0"
                                        value={
                                            formData.number_of_children
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                            </div>


                            {/* =====================================
                                CHILDREN
                            ===================================== */}

                            {children.length > 0 && (
                                <div
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >

                                    <div className="section-header">

                                        <div>
                                            <h3>
                                                <FaChild /> Children
                                            </h3>

                                            <p>
                                                Enter the
                                                details of
                                                each child.
                                            </p>
                                        </div>

                                    </div>


                                    {children.map(
                                        (
                                            child,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="form-card"
                                                style={{
                                                    marginBottom:
                                                        "15px"
                                                }}
                                            >

                                                <h4>
                                                    Child{" "}
                                                    {index +
                                                        1}
                                                </h4>


                                                <div className="form-grid">

                                                    <div>
                                                        <label>
                                                            Child Name
                                                        </label>

                                                        <input
                                                            value={
                                                                child.name
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleChildChange(
                                                                    index,
                                                                    "name",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="e.g. Mary Banda"
                                                        />
                                                    </div>


                                                    <div>
                                                        <label>
                                                            Age
                                                        </label>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={
                                                                child.age
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleChildChange(
                                                                    index,
                                                                    "age",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Age"
                                                        />
                                                    </div>


                                                    <div>
                                                        <label>
                                                            Gender
                                                        </label>

                                                        <select
                                                            value={
                                                                child.gender
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleChildChange(
                                                                    index,
                                                                    "gender",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            <option value="Female">
                                                                Female
                                                            </option>

                                                            <option value="Male">
                                                                Male
                                                            </option>
                                                        </select>
                                                    </div>

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}


                            {/* =====================================
                                EMPLOYMENT
                            ===================================== */}

                            <h3
                                style={{
                                    marginTop:
                                        "30px"
                                }}
                            >
                                Employment Information
                            </h3>


                            <div className="form-grid">

                                <div>
                                    <label>
                                        Occupation
                                    </label>

                                    <input
                                        name="occupation"
                                        value={
                                            formData.occupation
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Teacher"
                                    />
                                </div>


                                <div>
                                    <label>
                                        Employer
                                    </label>

                                    <input
                                        name="employer"
                                        value={
                                            formData.employer
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. ABC School"
                                    />
                                </div>

                            </div>


                            {/* =====================================
                                CHURCH
                            ===================================== */}

                            <h3
                                style={{
                                    marginTop:
                                        "30px"
                                }}
                            >
                                Church Information
                            </h3>


                            <div className="form-grid">

                                <div>
                                    <label>
                                        Date Joined Church
                                    </label>

                                    <input
                                        name="date_joined_church"
                                        type="date"
                                        value={
                                            formData.date_joined_church
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>


                                <div>
                                    <label>
                                        Baptism Status
                                    </label>

                                    <select
                                        name="baptism_status"
                                        value={
                                            formData.baptism_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Unknown">
                                            Unknown
                                        </option>

                                        <option value="Baptized">
                                            Baptized
                                        </option>

                                        <option value="Not Baptized">
                                            Not Baptized
                                        </option>
                                    </select>
                                </div>


                                <div>
                                    <label>
                                        Baptism Date
                                    </label>

                                    <input
                                        name="baptism_date"
                                        type="date"
                                        value={
                                            formData.baptism_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>


                                <div>
                                    <label>
                                        Membership Status
                                    </label>

                                    <select
                                        name="membership_status"
                                        value={
                                            formData.membership_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Active">
                                            Active
                                        </option>

                                        <option value="Inactive">
                                            Inactive
                                        </option>

                                        <option value="Transferred">
                                            Transferred
                                        </option>

                                        <option value="Deceased">
                                            Deceased
                                        </option>
                                    </select>
                                </div>


                                <div>
                                    <label>
                                        Follow-up Status
                                    </label>

                                    <select
                                        name="follow_up_status"
                                        value={
                                            formData.follow_up_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Okay">
                                            Okay
                                        </option>

                                        <option value="Needs Follow-Up">
                                            Needs Follow-Up
                                        </option>
                                    </select>
                                </div>


                                <div>
                                    <label htmlFor="ministry_department_id">
                                        Ministry
                                    </label>

                                    <select
                                        id="ministry_department_id"
                                        name="ministry_department_id"
                                        value={formData.ministry_department_id || ""}
                                        onChange={(event) => {
                                            const selectedId = event.target.value;
                                            const selectedDepartment = departments.find(
                                                (department) => String(department.id) === String(selectedId)
                                            );
                                            setFormData((previousData) => ({
                                                ...previousData,
                                                ministry_department_id: selectedId,
                                                ministry_role: selectedDepartment?.name || ""
                                            }));
                                        }}
                                    >
                                        <option value="">Select a ministry (optional)</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={String(department.id)}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                    <small>Select a registered ministry so the member count updates automatically.</small>
                                </div>

                            </div>


                            {/* =====================================
                                FORM BUTTONS
                            ===================================== */}

                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={
                                        resetForm
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    <FaSave />

                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Member"
                                        : "Save Member"}
                                </button>

                            </div>

                        </form>

                    </div>
                )}


            {/* =================================================
                MEMBERS TABLE
            ================================================= */}

            <div className="table-card">

                <div className="table-toolbar">

                    <div>
                        <h2>
                            Church Members
                        </h2>

                        <p>
                            {filteredMembers.length}{" "}
                            member(s) found
                        </p>
                    </div>


                    <div className="toolbar-actions">

                        <div className="search-box">

                            <FaSearch />

                            <input
                                value={
                                    searchTerm
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchTerm(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search members..."
                            />

                        </div>


                        <button
                            className="secondary-btn"
                            onClick={
                                fetchMembers
                            }
                        >
                            <FaSyncAlt />
                            Refresh
                        </button>

                    </div>

                </div>


                {/* =============================================
                    TABLE STATES
                ============================================= */}

                {loading ? (
                    <div className="loading-box">
                        Loading members...
                    </div>

                ) : filteredMembers.length ===
                  0 ? (

                    <div className="empty-state">

                        <FaUsers />

                        <h3>
                            No members found
                        </h3>

                        <p>
                            Add a member to get
                            started.
                        </p>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Gender
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Ministry
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    {canEditMembers && (
                                        <th>
                                            Actions
                                        </th>
                                    )}

                                </tr>

                            </thead>


                            <tbody>

                                {filteredMembers.map(
                                    (member) => (

                                        <tr
                                            key={getMemberId(
                                                member
                                            )}
                                        >

                                            {/* =================================
                                                CLICKABLE NAME
                                            ================================= */}

                                            <td>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openMemberDetails(
                                                            member
                                                        )
                                                    }
                                                    style={{
                                                        border:
                                                            "none",
                                                        background:
                                                            "transparent",
                                                        padding:
                                                            0,
                                                        cursor:
                                                            "pointer",
                                                        textAlign:
                                                            "left",
                                                        font: "inherit"
                                                    }}
                                                >

                                                    <strong
                                                        style={{
                                                            textDecoration:
                                                                "underline"
                                                        }}
                                                    >
                                                        {getMemberName(
                                                            member
                                                        )}
                                                    </strong>

                                                </button>


                                                <br />

                                                <small>
                                                    {member.email ||
                                                        ""}
                                                </small>

                                            </td>


                                            <td>
                                                {member.gender ||
                                                    "-"}
                                            </td>


                                            <td>
                                                {member.phone ||
                                                    "-"}
                                            </td>


                                            <td>
                                                {member.assigned_ministry || member.ministry_role ||
                                                    "-"}
                                            </td>


                                            <td>

                                                <span
                                                    className={`status-badge ${
                                                        member.membership_status ||
                                                        "Active"
                                                    }`}
                                                >
                                                    {member.membership_status ||
                                                        "Active"}
                                                </span>

                                            </td>


                                            {canEditMembers && (
                                                <td>

                                                    <div className="table-actions-inline">

                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                            Edit
                                                        </button>


                                                        <button
                                                            className="table-delete-btn"
                                                            onClick={() =>
                                                                openStatusModal(
                                                                    member
                                                                )
                                                            }
                                                        >

                                                            {(
                                                                member.membership_status ||
                                                                "Active"
                                                            ) ===
                                                            "Active" ? (
                                                                <>
                                                                    <FaUserSlash />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaUserCheck />
                                                                    Activate
                                                                </>
                                                            )}

                                                        </button>

                                                        <button
                                                            className="table-delete-btn"
                                                            onClick={() => setMemberToDelete(member)}
                                                            title="Permanently delete member"
                                                        >
                                                            <FaTrash />
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>
                                            )}

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
};


export default Members;