import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTrash,
    FaBullhorn,
    FaWhatsapp,
    FaCopy,
    FaCheckCircle
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageAnnouncements,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    title: "",
    message: "",
    audience: "All Members",
    target_department_id: "",
    announcement_date: "",
    priority: "Normal",
    status: "Published"
};

const audienceMap = {
    "All Members": "All",
    "Members": "Members",
    "Leaders Only": "Leaders",
    "Department": "Department"
};

const reverseAudienceMap = {
    All: "All Members",
    Members: "Members",
    Leaders: "Leaders Only",
    Department: "Department"
};

const Announcements = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditAnnouncements = canManageAnnouncements(role);

    const [announcements, setAnnouncements] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState(emptyForm);

    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

    const getAnnouncementId = (announcement) => {
        return announcement.id || announcement.announcement_id;
    };

    const getAnnouncementMessage = (announcement) => {
        return (
            announcement.message ||
            announcement.content ||
            announcement.body ||
            ""
        );
    };

    const getAnnouncementAudience = (announcement) => {
        if (announcement.target_audience) {
            return (
                reverseAudienceMap[announcement.target_audience] ||
                announcement.target_audience
            );
        }

        if (announcement.audience) {
            return announcement.audience;
        }

        if (announcement.target_department_name) {
            return announcement.target_department_name;
        }

        return "All Members";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";

        return String(dateValue).split("T")[0];
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/announcements");

            const announcementList =
                response.data?.announcements ||
                response.data?.data ||
                response.data ||
                [];

            setAnnouncements(
                Array.isArray(announcementList)
                    ? announcementList
                    : []
            );
        } catch (error) {
            console.error("Failed to load announcements:", error);

            setError(
                error.response?.data?.message ||
                    "Failed to load announcements. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await API.get("/departments");

            const departmentList =
                response.data?.departments ||
                response.data?.data ||
                response.data ||
                [];

            setDepartments(
                Array.isArray(departmentList)
                    ? departmentList
                    : []
            );
        } catch (error) {
            console.error("Failed to load departments:", error);

            /*
             * We do not block the announcements page if departments
             * cannot be loaded.
             */
            setDepartments([]);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
        fetchDepartments();
    }, []);

    const filteredAnnouncements = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();

        if (!search) {
            return announcements;
        }

        return announcements.filter((announcement) => {
            const searchableText = `
                ${announcement.title || ""}
                ${getAnnouncementMessage(announcement)}
                ${getAnnouncementAudience(announcement)}
                ${announcement.target_department_name || ""}
                ${announcement.priority || ""}
                ${announcement.status || ""}
                ${announcement.announcement_date || ""}
                ${announcement.created_at || ""}
                ${announcement.posted_by_name || ""}
            `.toLowerCase();

            return searchableText.includes(search);
        });
    }, [announcements, searchTerm]);

    const publishedCount = announcements.filter(
        (announcement) =>
            (announcement.status || "Published") === "Published"
    ).length;

    const draftCount = announcements.filter(
        (announcement) => announcement.status === "Draft"
    ).length;

    const urgentCount = announcements.filter(
        (announcement) => announcement.priority === "Urgent"
    ).length;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));

        if (name === "audience" && value !== "Department") {
            setFormData((previousData) => ({
                ...previousData,
                target_department_id: ""
            }));
        }
    };

    const openAddForm = () => {
        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError("");
        setSuccess("");

        scrollToForm();
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        setError("");
        setSuccess("");

        if (!formData.title.trim()) {
            setError("Announcement title is required.");
            return;
        }

        if (!formData.message.trim()) {
            setError("Announcement message is required.");
            return;
        }

        const selectedAudience =
            audienceMap[formData.audience] || "All";

        if (
            selectedAudience === "Department" &&
            !formData.target_department_id
        ) {
            setError(
                "Please select a department when the audience is Department."
            );
            return;
        }

        const payload = {
            title: formData.title.trim(),
            message: formData.message.trim(),

            /*
             * IMPORTANT:
             * The backend/database expects target_audience,
             * not "All Members", "Leaders Only", etc.
             */
            target_audience: selectedAudience,

            target_department_id:
                selectedAudience === "Department"
                    ? Number(formData.target_department_id)
                    : null,

            /*
             * These are included because your database has them.
             * The backend controller must also save them.
             */
            announcement_date:
                formData.announcement_date || null,

            priority: formData.priority,

            status: formData.status
        };

        try {
            setSaving(true);

            if (editingId) {
                await API.put(
                    `/announcements/${editingId}`,
                    payload
                );

                setSuccess(
                    "Announcement updated successfully."
                );
            } else {
                await API.post(
                    "/announcements",
                    payload
                );

                setSuccess(
                    "Announcement created successfully."
                );
            }

            setFormData(emptyForm);
            setEditingId(null);
            setShowForm(false);

            await fetchAnnouncements();
        } catch (error) {
            console.error("Failed to save announcement:", error);

            setError(
                error.response?.data?.message ||
                    "Failed to save announcement. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (announcement) => {
        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        const announcementId =
            getAnnouncementId(announcement);

        setEditingId(announcementId);

        const databaseAudience =
            announcement.target_audience || "All";

        setFormData({
            title: announcement.title || "",

            message:
                announcement.message ||
                announcement.content ||
                announcement.body ||
                "",

            audience:
                reverseAudienceMap[databaseAudience] ||
                "All Members",

            target_department_id:
                announcement.target_department_id || "",

            announcement_date:
                formatDate(
                    announcement.announcement_date
                ),

            priority:
                announcement.priority || "Normal",

            status:
                announcement.status || "Published"
        });

        setShowForm(true);
        setError("");
        setSuccess("");

        scrollToForm();
    };

    const openDeleteModal = (announcement) => {
        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        setAnnouncementToDelete(announcement);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setAnnouncementToDelete(null);
    };

    const confirmDelete = async () => {
        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!announcementToDelete) {
            return;
        }

        const announcementId =
            getAnnouncementId(announcementToDelete);

        if (!announcementId) {
            setError("Unable to identify this announcement.");
            return;
        }

        try {
            setDeleting(true);
            setError("");
            setSuccess("");

            await API.delete(
                `/announcements/${announcementId}`
            );

            setAnnouncements((previousAnnouncements) =>
                previousAnnouncements.filter(
                    (announcement) =>
                        String(
                            getAnnouncementId(announcement)
                        ) !== String(announcementId)
                )
            );

            setAnnouncementToDelete(null);

            setSuccess(
                "Announcement deleted successfully."
            );
        } catch (error) {
            console.error(
                "Failed to delete announcement:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to delete announcement. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const generateWhatsappMessage = async (announcement) => {
        const announcementId =
            getAnnouncementId(announcement);

        if (!announcementId) {
            setError(
                "Unable to generate the WhatsApp message because this announcement has no ID."
            );
            return;
        }

        try {
            setLoadingWhatsapp(true);
            setError("");
            setSuccess("");

            const response = await API.get(
                `/announcements/${announcementId}/whatsapp`
            );

            const generatedMessage =
                response.data?.whatsapp_message ||
                response.data?.whatsappMessage ||
                response.data?.message ||
                response.data?.text ||
                `📢 *${announcement.title}*\n\n${getAnnouncementMessage(
                    announcement
                )}`;

            setWhatsappMessage(generatedMessage);
            setShowWhatsappModal(true);
        } catch (error) {
            console.error(
                "Failed to generate WhatsApp message:",
                error
            );

            const fallbackMessage =
                `📢 *${announcement.title}*\n\n` +
                `${getAnnouncementMessage(announcement)}`;

            setWhatsappMessage(fallbackMessage);
            setShowWhatsappModal(true);
        } finally {
            setLoadingWhatsapp(false);
        }
    };

    const copyWhatsappMessage = async () => {
        try {
            await navigator.clipboard.writeText(
                whatsappMessage
            );

            setSuccess(
                "WhatsApp message copied successfully."
            );
        } catch (error) {
            console.error(error);

            setError(
                "Failed to copy message. Please copy it manually."
            );
        }
    };

    return (
        <div className="page page-fade">

            {/* PAGE HEADER */}
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">
                        Church Communication
                    </span>

                    <h1>Announcements</h1>

                    <p>
                        Create church announcements and
                        generate WhatsApp-ready messages.
                    </p>
                </div>

                {canEditAnnouncements && (
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={openAddForm}
                    >
                        <FaPlus />
                        Add Announcement
                    </button>
                )}
            </div>

            {!canEditAnnouncements && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

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

            {/* DELETE MODAL */}
            {announcementToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">

                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>
                            Delete Announcement?
                        </h2>

                        <p>
                            Are you sure you want to
                            delete{" "}
                            <strong>
                                {announcementToDelete.title}
                            </strong>
                            ?
                        </p>

                        <p className="delete-warning">
                            This action cannot be undone.
                        </p>

                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="danger-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                <FaTrash />

                                {deleting
                                    ? "Deleting..."
                                    : "Yes, Delete"}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* WHATSAPP MODAL */}
            {showWhatsappModal && (
                <div className="modal-overlay">
                    <div className="delete-modal">

                        <div className="delete-modal-icon">
                            <FaWhatsapp />
                        </div>

                        <h2>
                            WhatsApp Message
                        </h2>

                        <textarea
                            className="copy-textarea"
                            rows="8"
                            value={whatsappMessage}
                            onChange={(event) =>
                                setWhatsappMessage(
                                    event.target.value
                                )
                            }
                        />

                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                    setShowWhatsappModal(false)
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="primary-btn"
                                onClick={
                                    copyWhatsappMessage
                                }
                            >
                                <FaCopy />
                                Copy Message
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* STATISTICS */}
            <div className="dashboard-grid">

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBullhorn />
                    </div>

                    <h3>
                        Total Announcements
                    </h3>

                    <p>
                        {announcements.length}
                    </p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaCheckCircle />
                    </div>

                    <h3>
                        Published
                    </h3>

                    <p>
                        {publishedCount}
                    </p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaEdit />
                    </div>

                    <h3>
                        Drafts
                    </h3>

                    <p>
                        {draftCount}
                    </p>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FaBullhorn />
                    </div>

                    <h3>
                        Urgent
                    </h3>

                    <p>
                        {urgentCount}
                    </p>
                </div>

            </div>

            {/* ADD / EDIT FORM */}
            {showForm && canEditAnnouncements && (
                <div className="form-card">

                    <div className="section-header">

                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Announcement"
                                    : "Add New Announcement"}
                            </h2>

                            <p>
                                Enter announcement
                                details below.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="icon-btn"
                            onClick={resetForm}
                        >
                            <FaTimes />
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            {/* TITLE */}
                            <div>
                                <label>
                                    Title
                                </label>

                                <input
                                    name="title"
                                    value={
                                        formData.title
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Sabbath Program Notice"
                                    required
                                />
                            </div>

                            {/* AUDIENCE */}
                            <div>
                                <label>
                                    Audience
                                </label>

                                <select
                                    name="audience"
                                    value={
                                        formData.audience
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option value="All Members">
                                        All Members
                                    </option>

                                    <option value="Members">
                                        Members
                                    </option>

                                    <option value="Leaders Only">
                                        Leaders Only
                                    </option>

                                    <option value="Department">
                                        Department
                                    </option>
                                </select>
                            </div>

                            {/* DEPARTMENT */}
                            {formData.audience ===
                                "Department" && (
                                <div>
                                    <label>
                                        Department
                                    </label>

                                    <select
                                        name="target_department_id"
                                        value={
                                            formData.target_department_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select department
                                        </option>

                                        {departments.map(
                                            (department) => (
                                                <option
                                                    key={
                                                        department.id
                                                    }
                                                    value={
                                                        department.id
                                                    }
                                                >
                                                    {department.name}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {departments.length ===
                                        0 && (
                                        <small>
                                            No departments
                                            available.
                                            Please add a
                                            department first.
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* DATE */}
                            <div>
                                <label>
                                    Date
                                </label>

                                <input
                                    name="announcement_date"
                                    type="date"
                                    value={
                                        formData.announcement_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            {/* PRIORITY */}
                            <div>
                                <label>
                                    Priority
                                </label>

                                <select
                                    name="priority"
                                    value={
                                        formData.priority
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option value="Low">
                                        Low
                                    </option>

                                    <option value="Normal">
                                        Normal
                                    </option>

                                    <option value="High">
                                        High
                                    </option>

                                    <option value="Urgent">
                                        Urgent
                                    </option>
                                </select>
                            </div>

                            {/* STATUS */}
                            <div>
                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option value="Published">
                                        Published
                                    </option>

                                    <option value="Draft">
                                        Draft
                                    </option>
                                </select>
                            </div>

                            {/* MESSAGE */}
                            <div className="full-width">

                                <label>
                                    Message
                                </label>

                                <textarea
                                    name="message"
                                    value={
                                        formData.message
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="5"
                                    placeholder="Write announcement message"
                                    required
                                />

                            </div>

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={saving}
                            >
                                <FaSave />

                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Announcement"
                                    : "Save Announcement"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* ANNOUNCEMENT TABLE */}
            <div className="table-card">

                <div className="table-toolbar">

                    <div>
                        <h2>
                            Church Announcements
                        </h2>

                        <p>
                            {
                                filteredAnnouncements.length
                            }{" "}
                            announcement(s) found
                        </p>
                    </div>

                    <div className="toolbar-actions">

                        <div className="search-box">
                            <FaSearch />

                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                placeholder="Search announcements..."
                            />
                        </div>

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={
                                fetchAnnouncements
                            }
                            disabled={loading}
                        >
                            <FaSyncAlt />

                            {loading
                                ? "Loading..."
                                : "Refresh"}
                        </button>

                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">
                        Loading announcements...
                    </div>
                ) : filteredAnnouncements.length ===
                  0 ? (
                    <div className="empty-state">

                        <FaBullhorn />

                        <h3>
                            No announcements found
                        </h3>

                        <p>
                            Add an announcement to
                            get started.
                        </p>

                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>
                                <tr>
                                    <th>
                                        Announcement
                                    </th>

                                    <th>
                                        Audience
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Priority
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredAnnouncements.map(
                                    (announcement) => {

                                        const id =
                                            getAnnouncementId(
                                                announcement
                                            );

                                        const audience =
                                            getAnnouncementAudience(
                                                announcement
                                            );

                                        return (
                                            <tr key={id}>

                                                <td>
                                                    <strong>
                                                        {
                                                            announcement.title
                                                        }
                                                    </strong>

                                                    <br />

                                                    <small>
                                                        {
                                                            getAnnouncementMessage(
                                                                announcement
                                                            )
                                                        }
                                                    </small>
                                                </td>

                                                <td>
                                                    {audience}

                                                    {announcement.target_department_name && (
                                                        <>
                                                            <br />
                                                            <small>
                                                                {
                                                                    announcement.target_department_name
                                                                }
                                                            </small>
                                                        </>
                                                    )}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        announcement.announcement_date
                                                    ) || "-"}
                                                </td>

                                                <td>
                                                    <span className="status-badge">
                                                        {
                                                            announcement.priority ||
                                                            "Normal"
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status-badge ${
                                                            announcement.status ||
                                                            "Published"
                                                        }`}
                                                    >
                                                        {
                                                            announcement.status ||
                                                            "Published"
                                                        }
                                                    </span>
                                                </td>

                                                <td>

                                                    <div className="table-actions-inline">

                                                        <button
                                                            type="button"
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                generateWhatsappMessage(
                                                                    announcement
                                                                )
                                                            }
                                                            disabled={
                                                                loadingWhatsapp
                                                            }
                                                        >
                                                            <FaWhatsapp />

                                                            WhatsApp
                                                        </button>

                                                        {canEditAnnouncements && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="table-action-btn"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            announcement
                                                                        )
                                                                    }
                                                                >
                                                                    <FaEdit />

                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="table-delete-btn"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            announcement
                                                                        )
                                                                    }
                                                                >
                                                                    <FaTrash />

                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
};

export default Announcements;