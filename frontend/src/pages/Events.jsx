import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaCalendarAlt,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    event_type: "Sabbath Program"
};

const Events = () => {
    const [events, setEvents] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [eventToDelete, setEventToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getEventId = (event) => {
        return event.id || event.event_id;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchEvents = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/events");

            const eventList =
                response.data.events ||
                response.data.data ||
                response.data;

            setEvents(Array.isArray(eventList) ? eventList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load events. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const searchableText = `
                ${event.title || ""}
                ${event.description || ""}
                ${event.location || ""}
                ${event.event_type || ""}
                ${event.event_date || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [events, searchTerm]);

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

        if (!formData.title.trim() || !formData.event_date) {
            setError("Event title and event date are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                event_date: formData.event_date,
                event_time: formData.event_time || null,
                location: formData.location,
                event_type: formData.event_type
            };

            if (editingId) {
                await API.put(`/events/${editingId}`, payload);
                setSuccess("Event updated successfully.");
            } else {
                await API.post("/events", payload);
                setSuccess("Event added successfully.");
            }

            resetForm();
            await fetchEvents();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save event. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (event) => {
        setEventToDelete(event);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setEventToDelete(null);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/events/${getEventId(eventToDelete)}`);
            setSuccess("Event deleted successfully.");
            setEventToDelete(null);
            await fetchEvents();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete event. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (event) => {
        setEditingId(getEventId(event));

        setFormData({
            title: event.title || "",
            description: event.description || "",
            event_date: formatDate(event.event_date),
            event_time: event.event_time || "",
            location: event.location || "",
            event_type: event.event_type || "Sabbath Program"
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
                    <span className="eyebrow">Church Calendar</span>
                    <h1>Events</h1>
                    <p>Create, update, and manage church events.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Event
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {eventToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Event?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{eventToDelete.title}</strong>?
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
                            <h2>{editingId ? "Edit Event" : "Add New Event"}</h2>
                            <p>Enter the event details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Event Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Sabbath Divine Service"
                                />
                            </div>

                            <div>
                                <label>Event Type</label>
                                <select
                                    name="event_type"
                                    value={formData.event_type}
                                    onChange={handleChange}
                                >
                                    <option value="Sabbath Program">
                                        Sabbath Program
                                    </option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Outreach">Outreach</option>
                                    <option value="Training">Training</option>
                                    <option value="Fundraising">Fundraising</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label>Event Date</label>
                                <input
                                    name="event_date"
                                    type="date"
                                    value={formData.event_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Event Time</label>
                                <input
                                    name="event_time"
                                    type="time"
                                    value={formData.event_time}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Location</label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Main Church"
                                />
                            </div>

                            <div className="full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Describe the event"
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
                                    ? "Update Event"
                                    : "Save Event"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Church Events</h2>
                        <p>{filteredEvents.length} event(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search events..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchEvents}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="empty-state">
                        <FaCalendarAlt />
                        <h3>No events found</h3>
                        <p>Add an event to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEvents.map((event) => (
                                    <tr key={getEventId(event)}>
                                        <td>
                                            <strong>{event.title}</strong>
                                        </td>

                                        <td>{event.event_type || "-"}</td>

                                        <td>
                                            {formatDate(event.event_date) || "-"}
                                        </td>

                                        <td>{event.event_time || "-"}</td>

                                        <td>{event.location || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => handleEdit(event)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(event)
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

export default Events;