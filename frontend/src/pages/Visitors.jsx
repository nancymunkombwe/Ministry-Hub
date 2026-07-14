import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaUserPlus,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    full_name: "",
    phone: "",
    email: "",
    address: "",
    visit_date: "",
    invited_by: "",
    follow_up_status: "New Visitor"
};

const Visitors = () => {
    const [visitors, setVisitors] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [visitorToDelete, setVisitorToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getVisitorId = (visitor) => {
        return visitor.id || visitor.visitor_id;
    };

    const getVisitorName = (visitor) => {
        return (
            visitor.full_name ||
            `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim()
        );
    };

    const splitFullName = (fullName) => {
        const nameParts = fullName.trim().split(/\s+/);
        const first_name = nameParts[0] || "";
        const last_name = nameParts.slice(1).join(" ") || "";

        return { first_name, last_name };
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const removeVisitorFromTable = (visitorId) => {
        setVisitors((previousVisitors) =>
            previousVisitors.filter(
                (visitor) => String(getVisitorId(visitor)) !== String(visitorId)
            )
        );
    };

    const fetchVisitors = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/visitors");

            const visitorList =
                response.data.visitors ||
                response.data.data ||
                response.data;

            setVisitors(Array.isArray(visitorList) ? visitorList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load visitors. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const filteredVisitors = useMemo(() => {
        return visitors.filter((visitor) => {
            const searchableText = `
                ${getVisitorName(visitor)}
                ${visitor.phone || ""}
                ${visitor.email || ""}
                ${visitor.address || ""}
                ${visitor.invited_by || ""}
                ${visitor.follow_up_status || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [visitors, searchTerm]);

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

        const { first_name, last_name } = splitFullName(formData.full_name);

        if (!first_name || !last_name || !formData.visit_date) {
            setError("First name, last name, and visit date are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                first_name,
                last_name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                visit_date: formData.visit_date,
                invited_by: formData.invited_by,
                follow_up_status: formData.follow_up_status
            };

            if (editingId) {
                await API.put(`/visitors/${editingId}`, payload);
                setSuccess("Visitor updated successfully.");
            } else {
                await API.post("/visitors", payload);
                setSuccess("Visitor added successfully.");
            }

            resetForm();
            await fetchVisitors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save visitor. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (visitor) => {
        setVisitorToDelete(visitor);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setVisitorToDelete(null);
    };

    const confirmDelete = async () => {
        if (!visitorToDelete) {
            return;
        }

        const deletedVisitorId = getVisitorId(visitorToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/visitors/${deletedVisitorId}`);

            removeVisitorFromTable(deletedVisitorId);

            setSuccess("Visitor deleted successfully.");
            setVisitorToDelete(null);
        } catch (error) {
            if (error.response?.status === 404) {
                removeVisitorFromTable(deletedVisitorId);
                setSuccess("Visitor was already removed from the database.");
                setVisitorToDelete(null);
                return;
            }

            setError(
                error.response?.data?.message ||
                    "Failed to delete visitor. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (visitor) => {
        setEditingId(getVisitorId(visitor));

        setFormData({
            full_name: getVisitorName(visitor),
            phone: visitor.phone || "",
            email: visitor.email || "",
            address: visitor.address || "",
            visit_date: formatDate(visitor.visit_date),
            invited_by: visitor.invited_by || "",
            follow_up_status: visitor.follow_up_status || "New Visitor"
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
                    <span className="eyebrow">Visitor Management</span>
                    <h1>Visitors</h1>
                    <p>Register visitors and track follow-up progress.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Visitor
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {visitorToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Visitor?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{getVisitorName(visitorToDelete)}</strong>?
                        </p>

                        <p className="delete-warning">
                            This will remove the visitor record from the system.
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
                                {editingId ? "Edit Visitor" : "Add New Visitor"}
                            </h2>
                            <p>Enter visitor information below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Full Name</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Mary Phiri"
                                />
                            </div>

                            <div>
                                <label>Phone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. 0970000000"
                                />
                            </div>

                            <div>
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g. visitor@email.com"
                                />
                            </div>

                            <div>
                                <label>Visit Date</label>
                                <input
                                    name="visit_date"
                                    type="date"
                                    value={formData.visit_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Invited By</label>
                                <input
                                    name="invited_by"
                                    value={formData.invited_by}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label>Follow-up Status</label>
                                <select
                                    name="follow_up_status"
                                    value={formData.follow_up_status}
                                    onChange={handleChange}
                                >
                                    <option value="New Visitor">New Visitor</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Joined">Joined</option>
                                    <option value="Not Interested">
                                        Not Interested
                                    </option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter visitor address"
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
                                    ? "Update Visitor"
                                    : "Save Visitor"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Church Visitors</h2>
                        <p>{filteredVisitors.length} visitor(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search visitors..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchVisitors}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading visitors...</div>
                ) : filteredVisitors.length === 0 ? (
                    <div className="empty-state">
                        <FaUserPlus />
                        <h3>No visitors found</h3>
                        <p>Add a visitor to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Visit Date</th>
                                    <th>Invited By</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredVisitors.map((visitor) => (
                                    <tr key={getVisitorId(visitor)}>
                                        <td>
                                            <strong>{getVisitorName(visitor)}</strong>
                                            <br />
                                            <small>{visitor.email || ""}</small>
                                        </td>

                                        <td>{visitor.phone || "-"}</td>

                                        <td>{formatDate(visitor.visit_date) || "-"}</td>

                                        <td>{visitor.invited_by || "-"}</td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    visitor.follow_up_status ||
                                                    "New Visitor"
                                                }`}
                                            >
                                                {visitor.follow_up_status ||
                                                    "New Visitor"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        handleEdit(visitor)
                                                    }
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(visitor)
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

export default Visitors;