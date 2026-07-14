import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaBullhorn,
    FaTrash,
    FaWhatsapp
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    title: "",
    message: "",
    department_id: "",
    target_audience: "All Members"
};

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [showWhatsappBox, setShowWhatsappBox] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getAnnouncementId = (announcement) => {
        return announcement.id || announcement.announcement_id;
    };

    const getDepartmentId = (department) => {
        return department.id || department.department_id;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [announcementsResponse, departmentsResponse] =
                await Promise.allSettled([
                    API.get("/announcements"),
                    API.get("/departments")
                ]);

            if (announcementsResponse.status === "fulfilled") {
                const announcementList =
                    announcementsResponse.value.data.announcements ||
                    announcementsResponse.value.data.data ||
                    announcementsResponse.value.data;

                setAnnouncements(
                    Array.isArray(announcementList) ? announcementList : []
                );
            }

            if (departmentsResponse.status === "fulfilled") {
                const departmentList =
                    departmentsResponse.value.data.departments ||
                    departmentsResponse.value.data.data ||
                    departmentsResponse.value.data;

                setDepartments(Array.isArray(departmentList) ? departmentList : []);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load announcements. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((announcement) => {
            const searchableText = `
                ${announcement.title || ""}
                ${announcement.message || ""}
                ${announcement.content || ""}
                ${announcement.department_name || ""}
                ${announcement.target_audience || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [announcements, searchTerm]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const openAddForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        if (!formData.title.trim() || !formData.message.trim()) {
            setError("Announcement title and message are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                title: formData.title,
                message: formData.message,
                content: formData.message,
                department_id: formData.department_id || null,
                target_audience: formData.target_audience
            };

            if (editingId) {
                await API.put(`/announcements/${editingId}`, payload);
                setSuccess("Announcement updated successfully.");
            } else {
                await API.post("/announcements", payload);
                setSuccess("Announcement added successfully.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save announcement. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (announcement) => {
        setAnnouncementToDelete(announcement);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setAnnouncementToDelete(null);
    };

    const confirmDelete = async () => {
        if (!announcementToDelete) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(
                `/announcements/${getAnnouncementId(announcementToDelete)}`
            );

            setSuccess("Announcement deleted successfully.");
            setAnnouncementToDelete(null);
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete announcement. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (announcement) => {
        setEditingId(getAnnouncementId(announcement));

        setFormData({
            title: announcement.title || "",
            message: announcement.message || announcement.content || "",
            department_id: announcement.department_id || "",
            target_audience: announcement.target_audience || "All Members"
        });

        setShowForm(true);
        setSuccess("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getWhatsappMessage = async (announcement) => {
        setError("");
        setSuccess("");
        setWhatsappMessage("");

        try {
            const response = await API.get(
                `/announcements/${getAnnouncementId(announcement)}/whatsapp`
            );

            const message =
                response.data.whatsapp_message ||
                response.data.whatsappMessage ||
                response.data.message ||
                response.data.data ||
                "";

            setWhatsappMessage(message);
            setShowWhatsappBox(true);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to generate WhatsApp message."
            );
        }
    };

    const copyWhatsappMessage = async () => {
        try {
            await navigator.clipboard.writeText(whatsappMessage);
            setSuccess("WhatsApp message copied successfully.");
        } catch {
            setError("Failed to copy message. Please copy it manually.");
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Church Communication</span>
                    <h1>Announcements</h1>
                    <p>Create and share church announcements with members.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Announcement
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {announcementToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Announcement?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{announcementToDelete.title}</strong>?
                        </p>

                        <p className="delete-warning">
                            This action cannot be undone.
                        </p>

                        <div className="delete-modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWhatsappBox && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                <FaWhatsapp /> WhatsApp Message
                            </h2>
                            <p>Copy and paste this message into WhatsApp.</p>
                        </div>

                        <button
                            className="icon-btn"
                            onClick={() => setShowWhatsappBox(false)}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <textarea
                        value={whatsappMessage}
                        readOnly
                        rows="7"
                        className="full-width"
                    ></textarea>

                    <div className="form-actions">
                        <button
                            className="primary-btn"
                            onClick={copyWhatsappMessage}
                        >
                            <FaWhatsapp /> Copy Message
                        </button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Announcement"
                                    : "Add New Announcement"}
                            </h2>
                            <p>Enter announcement details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Youth Meeting This Friday"
                                />
                            </div>

                            <div>
                                <label>Target Audience</label>
                                <select
                                    name="target_audience"
                                    value={formData.target_audience}
                                    onChange={handleChange}
                                >
                                    <option value="All Members">All Members</option>
                                    <option value="Department">Department</option>
                                    <option value="Leaders">Leaders</option>
                                    <option value="Visitors">Visitors</option>
                                </select>
                            </div>

                            <div>
                                <label>Department</label>
                                <select
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                >
                                    <option value="">No specific department</option>

                                    {departments.map((department) => (
                                        <option
                                            key={getDepartmentId(department)}
                                            value={getDepartmentId(department)}
                                        >
                                            {department.name ||
                                                department.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Write the announcement message"
                                ></textarea>
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

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Church Announcements</h2>
                        <p>
                            {filteredAnnouncements.length} announcement(s) found
                        </p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search announcements..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchData}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading announcements...</div>
                ) : filteredAnnouncements.length === 0 ? (
                    <div className="empty-state">
                        <FaBullhorn />
                        <h3>No announcements found</h3>
                        <p>Add an announcement to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Message</th>
                                    <th>Audience</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAnnouncements.map((announcement) => (
                                    <tr key={getAnnouncementId(announcement)}>
                                        <td>
                                            <strong>{announcement.title}</strong>
                                        </td>

                                        <td>
                                            {announcement.message ||
                                                announcement.content ||
                                                "-"}
                                        </td>

                                        <td>
                                            {announcement.target_audience ||
                                                announcement.department_name ||
                                                "All Members"}
                                        </td>

                                        <td>
                                            {formatDate(
                                                announcement.created_at
                                            ) || "-"}
                                        </td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        handleEdit(announcement)
                                                    }
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        getWhatsappMessage(
                                                            announcement
                                                        )
                                                    }
                                                >
                                                    <FaWhatsapp /> WhatsApp
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            announcement
                                                        )
                                                    }
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Announcements;