import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaHeart,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    member_id: "",
    reason: "Missed Services",
    description: "",
    assigned_to: "",
    due_date: "",
    status: "Pending"
};

const CareFollowups = () => {
    const [careItems, setCareItems] = useState([]);
    const [members, setMembers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [careToDelete, setCareToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getCareId = (item) => {
        return item.id || item.care_followup_id || item.followup_id;
    };

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getMemberName = (member) => {
        return `${member.first_name || ""} ${member.last_name || ""}`.trim();
    };

    const getCareMemberName = (item) => {
        return (
            item.member_name ||
            `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
            "Member"
        );
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [careResponse, membersResponse] = await Promise.all([
                API.get("/care"),
                API.get("/members")
            ]);

            const careList =
                careResponse.data.care_followups ||
                careResponse.data.followups ||
                careResponse.data.data ||
                careResponse.data;

            const memberList =
                membersResponse.data.members ||
                membersResponse.data.data ||
                membersResponse.data;

            setCareItems(Array.isArray(careList) ? careList : []);
            setMembers(Array.isArray(memberList) ? memberList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load care follow-ups. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredCareItems = useMemo(() => {
        return careItems.filter((item) => {
            const searchableText = `
                ${getCareMemberName(item)}
                ${item.reason || ""}
                ${item.status || ""}
                ${item.description || ""}
                ${item.due_date || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [careItems, searchTerm]);

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

        if (!formData.member_id || !formData.reason || !formData.status) {
            setError("Member, reason, and status are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                member_id: formData.member_id,
                reason: formData.reason,
                description: formData.description,
                assigned_to: formData.assigned_to || null,
                status: formData.status,
                due_date: formData.due_date || null
            };

            if (editingId) {
                await API.put(`/care/${editingId}`, payload);
                setSuccess("Care follow-up updated successfully.");
            } else {
                await API.post("/care", payload);
                setSuccess("Care follow-up added successfully.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save care follow-up. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (item) => {
        setCareToDelete(item);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setCareToDelete(null);
    };

    const confirmDelete = async () => {
        if (!careToDelete) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/care/${getCareId(careToDelete)}`);
            setSuccess("Care follow-up deleted successfully.");
            setCareToDelete(null);
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete care follow-up. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(getCareId(item));

        setFormData({
            member_id: item.member_id || "",
            reason: item.reason || "Missed Services",
            description: item.description || "",
            assigned_to: item.assigned_to || "",
            due_date: formatDate(item.due_date),
            status: item.status || "Pending"
        });

        setShowForm(true);
        setSuccess("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Care Ministry</span>
                    <h1>Care Follow-ups</h1>
                    <p>Track members needing visitation, prayer, or support.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Follow-up
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {careToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Care Follow-up?</h2>

                        <p>
                            Are you sure you want to delete this care follow-up
                            for <strong>{getCareMemberName(careToDelete)}</strong>?
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

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Care Follow-up"
                                    : "Add Care Follow-up"}
                            </h2>
                            <p>
                                Record care, visitation, prayer, or follow-up work.
                            </p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Member</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select member</option>

                                    {members.map((member) => (
                                        <option
                                            key={getMemberId(member)}
                                            value={getMemberId(member)}
                                        >
                                            {getMemberName(member)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Reason</label>
                                <select
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                >
                                    <option value="Missed Services">Missed Services</option>
                                    <option value="Sick Member">Sick Member</option>
                                    <option value="Visitation">Visitation</option>
                                    <option value="New Convert">New Convert</option>
                                    <option value="Prayer Request">Prayer Request</option>
                                    <option value="Bereavement">Bereavement</option>
                                    <option value="Counselling">Counselling</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label>Assigned To User ID</label>
                                <input
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label>Follow-up Date</label>
                                <input
                                    name="due_date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Describe the follow-up"
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
                                    ? "Update Follow-up"
                                    : "Save Follow-up"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Care Follow-up Records</h2>
                        <p>{filteredCareItems.length} record(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search care records..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchData}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading care follow-ups...</div>
                ) : filteredCareItems.length === 0 ? (
                    <div className="empty-state">
                        <FaHeart />
                        <h3>No care follow-ups found</h3>
                        <p>Add a care follow-up record to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Follow-up Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredCareItems.map((item) => (
                                    <tr key={getCareId(item)}>
                                        <td>
                                            <strong>{getCareMemberName(item)}</strong>
                                        </td>

                                        <td>{item.reason || "-"}</td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    item.status || "Pending"
                                                }`}
                                            >
                                                {item.status || "Pending"}
                                            </span>
                                        </td>

                                        <td>{formatDate(item.due_date) || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(item)
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

export default CareFollowups;