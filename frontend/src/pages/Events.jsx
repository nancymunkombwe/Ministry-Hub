import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTrash,
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaUsers
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageEvents,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    event_type: "Other",
    department_id: ""
};

const Events = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditEvents = canManageEvents(role);

    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState(emptyForm);

    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================================
    // HELPERS
    // =====================================================

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

    const getEventId = (event) => {
        return event.id || event.event_id;
    };

    const getEventTitle = (event) => {
        return (
            event.title ||
            event.event_title ||
            event.event_name ||
            event.name ||
            "Event"
        );
    };

    const getEventType = (event) => {
        return event.event_type || "Other";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const formatTime = (timeValue) => {
        if (!timeValue) return "";
        return String(timeValue).slice(0, 5);
    };

    // =====================================================
    // FETCH EVENTS
    // =====================================================

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

    // =====================================================
    // FILTER EVENTS
    // =====================================================

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const searchableText = `
                ${getEventTitle(event)}
                ${event.description || ""}
                ${event.location || ""}
                ${getEventType(event)}
                ${event.event_date || ""}
                ${event.event_time || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [events, searchTerm]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const today = new Date().toISOString().split("T")[0];

    const upcomingEvents = events.filter((event) => {
        const eventDate = formatDate(event.event_date);

        return eventDate >= today;
    }).length;

    const thisMonthEvents = events.filter((event) => {
        const eventDate = formatDate(event.event_date);
        const currentMonth = today.slice(0, 7);

        return eventDate.startsWith(currentMonth);
    }).length;

    // =====================================================
    // FORM
    // =====================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const openAddForm = () => {
        if (!canEditEvents) {
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

    // =====================================================
    // CREATE / UPDATE EVENT
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canEditEvents) {
            setError(getNoPermissionMessage());
            return;
        }

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
                title: formData.title.trim(),
                description: formData.description.trim(),
                event_type: formData.event_type,
                event_date: formData.event_date,
                event_time: formData.event_time || null,
                location: formData.location.trim() || null,
                department_id: formData.department_id
                    ? Number(formData.department_id)
                    : null
            };

            if (editingId) {
                await API.put(`/events/${editingId}`, payload);

                setSuccess("Event updated successfully.");
            } else {
                await API.post("/events", payload);

                setSuccess("Event created successfully.");
            }

            resetForm();
            await fetchEvents();
        } catch (error) {
            console.error("SAVE EVENT ERROR:", error);

            setError(
                error.response?.data?.message ||
                    "Failed to save event. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // EDIT EVENT
    // =====================================================

    const handleEdit = (event) => {
        if (!canEditEvents) {
            setError(getNoPermissionMessage());
            return;
        }

        setEditingId(getEventId(event));

        setFormData({
            title: getEventTitle(event),
            description: event.description || "",
            event_date: formatDate(event.event_date),
            event_time: formatTime(event.event_time),
            location: event.location || "",
            event_type: getEventType(event),
            department_id: event.department_id || ""
        });

        setShowForm(true);
        setError("");
        setSuccess("");

        scrollToForm();
    };

    // =====================================================
    // DELETE
    // =====================================================

    const openDeleteModal = (event) => {
        if (!canEditEvents) {
            setError(getNoPermissionMessage());
            return;
        }

        setEventToDelete(event);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setEventToDelete(null);
    };

    const confirmDelete = async () => {
        if (!canEditEvents) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!eventToDelete) return;

        const eventId = getEventId(eventToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/events/${eventId}`);

            setEvents((previousEvents) =>
                previousEvents.filter(
                    (event) =>
                        String(getEventId(event)) !== String(eventId)
                )
            );

            setSuccess("Event deleted successfully.");
            setEventToDelete(null);
        } catch (error) {
            console.error("DELETE EVENT ERROR:", error);

            setError(
                error.response?.data?.message ||
                    "Failed to delete event. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="page page-fade">

            {/* PAGE HEADER */}
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Church Calendar</span>

                    <h1>Events</h1>

                    <p>
                        Create and manage church services, meetings, and
                        programs.
                    </p>
                </div>

                {canEditEvents && (
                    <button
                        className="primary-btn"
                        onClick={openAddForm}
                    >
                        <FaPlus /> Add Event
                    </button>
                )}
            </div>

            {/* PERMISSION MESSAGE */}
            {!canEditEvents && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {/* SUCCESS */}
            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {/* DELETE MODAL */}
            {eventToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">

                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Event?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {getEventTitle(eventToDelete)}
                            </strong>
                            ?
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
                                {deleting
                                    ? "Deleting..."
                                    : "Yes, Delete"}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* STATISTICS */}
            <div className="dashboard-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        <FaCalendarAlt />
                    </div>

                    <h3>Total Events</h3>

                    <p>{events.length}</p>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        <FaClock />
                    </div>

                    <h3>Upcoming Events</h3>

                    <p>{upcomingEvents}</p>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <h3>This Month</h3>

                    <p>{thisMonthEvents}</p>

                </div>

            </div>

            {/* ADD / EDIT FORM */}
            {showForm && canEditEvents && (
                <div className="form-card">

                    <div className="section-header">

                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Event"
                                    : "Add New Event"}
                            </h2>

                            <p>
                                Enter the event details below.
                            </p>
                        </div>

                        <button
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
                                <label>Event Title</label>

                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Sabbath Worship Service"
                                    required
                                />
                            </div>

                            {/* EVENT TYPE */}
                            <div>
                                <label>Event Type</label>

                                <select
                                    name="event_type"
                                    value={formData.event_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Sabbath Program">
                                        Sabbath Program
                                    </option>

                                    <option value="Midweek Service">
                                        Midweek Service
                                    </option>

                                    <option value="Vespers">
                                        Vespers
                                    </option>

                                    <option value="Seminar">
                                        Seminar
                                    </option>

                                    <option value="Baptism">
                                        Baptism
                                    </option>

                                    <option value="Department Meeting">
                                        Department Meeting
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>

                            {/* DATE */}
                            <div>
                                <label>Event Date</label>

                                <input
                                    name="event_date"
                                    type="date"
                                    value={formData.event_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* TIME */}
                            <div>
                                <label>Event Time</label>

                                <input
                                    name="event_time"
                                    type="time"
                                    value={formData.event_time}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* LOCATION */}
                            <div>
                                <label>Location</label>

                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Main Church"
                                />
                            </div>

                            {/* DEPARTMENT */}
                            <div>
                                <label>Department ID</label>

                                <input
                                    name="department_id"
                                    type="number"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            {/* DESCRIPTION */}
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

            {/* EVENTS TABLE */}
            <div className="table-card">

                <div className="table-toolbar">

                    <div>

                        <h2>Church Events</h2>

                        <p>
                            {filteredEvents.length} event(s) found
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
                                placeholder="Search events..."
                            />

                        </div>

                        <button
                            className="secondary-btn"
                            onClick={fetchEvents}
                        >
                            <FaSyncAlt /> Refresh
                        </button>

                    </div>

                </div>

                {/* LOADING */}
                {loading ? (
                    <div className="loading-box">
                        Loading events...
                    </div>

                ) : filteredEvents.length === 0 ? (

                    <div className="empty-state">

                        <FaCalendarAlt />

                        <h3>No events found</h3>

                        <p>
                            Add an event to get started.
                        </p>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>

                                <tr>
                                    <th>Event</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Location</th>

                                    {canEditEvents && (
                                        <th>Actions</th>
                                    )}
                                </tr>

                            </thead>

                            <tbody>

                                {filteredEvents.map((event) => (

                                    <tr
                                        key={getEventId(event)}
                                    >

                                        <td>

                                            <strong>
                                                {getEventTitle(event)}
                                            </strong>

                                            <br />

                                            <small>
                                                {event.description || ""}
                                            </small>

                                        </td>

                                        <td>

                                            <span className="status-badge">
                                                {getEventType(event)}
                                            </span>

                                        </td>

                                        <td>
                                            {formatDate(
                                                event.event_date
                                            ) || "-"}
                                        </td>

                                        <td>

                                            <FaClock />{" "}

                                            {formatTime(
                                                event.event_time
                                            ) || "-"}

                                        </td>

                                        <td>

                                            <FaMapMarkerAlt />{" "}

                                            {event.location || "-"}

                                        </td>

                                        {canEditEvents && (

                                            <td>

                                                <div className="table-actions-inline">

                                                    <button
                                                        className="table-action-btn"
                                                        onClick={() =>
                                                            handleEdit(event)
                                                        }
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>

                                                    <button
                                                        className="table-delete-btn"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>

                                                </div>

                                            </td>

                                        )}

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