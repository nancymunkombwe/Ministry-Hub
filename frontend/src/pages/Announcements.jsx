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
    announcement_date: "",
    priority: "Normal",
    status: "Published"
};

const Announcements = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditAnnouncements = canManageAnnouncements(role);

    const [announcements, setAnnouncements] = useState([]);

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
        return announcement.message || announcement.content || announcement.body || "";
    };

    const getAnnouncementAudience = (announcement) => {
        return (
            announcement.audience ||
            announcement.target_audience ||
            announcement.department_name ||
            "All Members"
        );
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchAnnouncements = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/announcements");

            const announcementList =
                response.data.announcements ||
                response.data.data ||
                response.data;

            setAnnouncements(
                Array.isArray(announcementList) ? announcementList : []
            );
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
        fetchAnnouncements();
    }, []);

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((announcement) => {
            const searchableText = `
                ${announcement.title || ""}
                ${getAnnouncementMessage(announcement)}
                ${getAnnouncementAudience(announcement)}
                ${announcement.priority || ""}
                ${announcement.status || ""}
                ${announcement.announcement_date || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [announcements, searchTerm]);

    const publishedCount = announcements.filter(
        (announcement) => (announcement.status || "Published") === "Published"
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

        setSaving(true);
        setError("");
        setSuccess("");

        if (!formData.title.trim() || !formData.message.trim()) {
            setError("Title and message are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                title: formData.title,
                message: formData.message,
                content: formData.message,
                body: formData.message,
                audience: formData.audience,
                target_audience: formData.audience,
                announcement_date: formData.announcement_date || null,
                priority: formData.priority,
                status: formData.status
            };

            if (editingId) {
                await API.put(`/announcements/${editingId}`, payload);
                setSuccess("Announcement updated successfully.");
            } else {
                await API.post("/announcements", payload);
                setSuccess("Announcement created successfully.");
            }

            resetForm();
            await fetchAnnouncements();
        } catch (error) {
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

        setEditingId(getAnnouncementId(announcement));

        setFormData({
            title: announcement.title || "",
            message: getAnnouncementMessage(announcement),
            audience: getAnnouncementAudience(announcement),
            announcement_date: formatDate(announcement.announcement_date),
            priority: announcement.priority || "Normal",
            status: announcement.status || "Published"
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
        setAnnouncementToDelete(null);
    };

    const confirmDelete = async () => {
        if (!canEditAnnouncements) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!announcementToDelete) return;

        const announcementId = getAnnouncementId(announcementToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/announcements/${announcementId}`);

            setAnnouncements((previousAnnouncements) =>
                previousAnnouncements.filter(
                    (announcement) =>
                        String(getAnnouncementId(announcement)) !==
                        String(announcementId)
                )
            );

            setSuccess("Announcement deleted successfully.");
            setAnnouncementToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete announcement. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const generateWhatsappMessage = async (announcement) => {
        const announcementId = getAnnouncementId(announcement);

        setLoadingWhatsapp(true);
        setError("");
        setSuccess("");

        try {
            const response = await API.get(
                `/announcements/${announcementId}/whatsapp`
            );

            const generatedMessage =
                response.data.whatsapp_message ||
                response.data.whatsappMessage ||
                response.data.message ||
                response.data.text ||
                `*${announcement.title}*\n\n${getAnnouncementMessage(announcement)}`;

            setWhatsappMessage(generatedMessage);
            setShowWhatsappModal(true);
        } catch {
            const fallbackMessage = `*${announcement.title}*\n\n${getAnnouncementMessage(
                announcement
            )}`;

            setWhatsappMessage(fallbackMessage);
            setShowWhatsappModal(true);
        } finally {
            setLoadingWhatsapp(false);
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
                    <p>
                        Create church announcements and generate WhatsApp-ready
                        messages.
                    </p>
                </div>

                {canEditAnnouncements && (
                    <button className="primary-btn" onClick={openAddForm}>
                        <FaPlus /> Add Announcement
                    </button>
                )}
            </div>

            {!canEditAnnouncements && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

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

            {showWhatsappModal && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaWhatsapp />
                        </div>

                        <h2>WhatsApp Message</h2>

                        <textarea
                            className="copy-textarea"
                            rows="8"
                            value={whatsappMessage}
                            onChange={(event) =>
                                setWhatsappMessage(event.target.value)
                            }
                        ></textarea>

                        <div className="delete-modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setShowWhatsappModal(false)}
                            >
                                Close
                            </button>

                            <button
                                className="primary-btn"
                                onClick={copyWhatsappMessage}
                            >
                                <FaCopy /> Copy Message
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBullhorn />
                    </div>
                    <h3>Total Announcements</h3>
                    <p>{announcements.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaCheckCircle />
                    </div>
                    <h3>Published</h3>
                    <p>{publishedCount}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaEdit />
                    </div>
                    <h3>Drafts</h3>
                    <p>{draftCount}</p>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FaBullhorn />
                    </div>
                    <h3>Urgent</h3>
                    <p>{urgentCount}</p>
                </div>
            </div>

            {showForm && canEditAnnouncements && (
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
                                    placeholder="e.g. Sabbath Program Notice"
                                />
                            </div>

                            <div>
                                <label>Audience</label>
                                <select
                                    name="audience"
                                    value={formData.audience}
                                    onChange={handleChange}
                                >
                                    <option value="All Members">All Members</option>
                                    <option value="Youth Ministry">Youth Ministry</option>
                                    <option value="Women Ministry">Women Ministry</option>
                                    <option value="Men Ministry">Men Ministry</option>
                                    <option value="Pathfinders">Pathfinders</option>
                                    <option value="Leaders Only">Leaders Only</option>
                                    <option value="Visitors">Visitors</option>
                                </select>
                            </div>

                            <div>
                                <label>Date</label>
                                <input
                                    name="announcement_date"
                                    type="date"
                                    value={formData.announcement_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Write announcement message"
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
                        <p>{filteredAnnouncements.length} announcement(s) found</p>
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

                        <button
                            className="secondary-btn"
                            onClick={fetchAnnouncements}
                        >
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
                                    <th>Announcement</th>
                                    <th>Audience</th>
                                    <th>Date</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAnnouncements.map((announcement) => (
                                    <tr key={getAnnouncementId(announcement)}>
                                        <td>
                                            <strong>{announcement.title}</strong>
                                            <br />
                                            <small>
                                                {getAnnouncementMessage(announcement)}
                                            </small>
                                        </td>

                                        <td>{getAnnouncementAudience(announcement)}</td>

                                        <td>
                                            {formatDate(
                                                announcement.announcement_date
                                            ) || "-"}
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                {announcement.priority || "Normal"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    announcement.status || "Published"
                                                }`}
                                            >
                                                {announcement.status || "Published"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        generateWhatsappMessage(
                                                            announcement
                                                        )
                                                    }
                                                    disabled={loadingWhatsapp}
                                                >
                                                    <FaWhatsapp /> WhatsApp
                                                </button>

                                                {canEditAnnouncements && (
                                                    <>
                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    announcement
                                                                )
                                                            }
                                                        >
                                                            <FaEdit /> Edit
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
                                                    </>
                                                )}
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