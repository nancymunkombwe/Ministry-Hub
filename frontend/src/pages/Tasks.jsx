import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTasks,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    title: "",
    description: "",
    assigned_to: "",
    department_id: "",
    related_member_id: "",
    due_date: "",
    priority: "Medium",
    status: "Pending"
};

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [taskToDelete, setTaskToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getTaskId = (task) => task.id || task.task_id;

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchTasks = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/tasks");

            const taskList =
                response.data.tasks ||
                response.data.data ||
                response.data;

            setTasks(Array.isArray(taskList) ? taskList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load tasks. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const searchableText = `
                ${task.title || ""}
                ${task.description || ""}
                ${task.status || ""}
                ${task.priority || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [tasks, searchTerm]);

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

        if (!formData.title.trim()) {
            setError("Task title is required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                assigned_to: formData.assigned_to || null,
                department_id: formData.department_id || null,
                related_member_id: formData.related_member_id || null,
                due_date: formData.due_date || null
            };

            if (editingId) {
                await API.put(`/tasks/${editingId}`, payload);
                setSuccess("Task updated successfully.");
            } else {
                await API.post("/tasks", payload);
                setSuccess("Task added successfully.");
            }

            resetForm();
            await fetchTasks();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save task. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (task) => {
        setTaskToDelete(task);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setTaskToDelete(null);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/tasks/${getTaskId(taskToDelete)}`);
            setSuccess("Task deleted successfully.");
            setTaskToDelete(null);
            await fetchTasks();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete task. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (task) => {
        setEditingId(getTaskId(task));

        setFormData({
            title: task.title || "",
            description: task.description || "",
            assigned_to: task.assigned_to || "",
            department_id: task.department_id || "",
            related_member_id: task.related_member_id || "",
            due_date: formatDate(task.due_date),
            priority: task.priority || "Medium",
            status: task.status || "Pending"
        });

        setShowForm(true);
        setSuccess("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const quickUpdateStatus = async (task, status) => {
        setError("");
        setSuccess("");

        try {
            await API.patch(`/tasks/${getTaskId(task)}/status`, { status });
            setSuccess("Task status updated successfully.");
            await fetchTasks();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to update task status."
            );
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Task Management</span>
                    <h1>Tasks</h1>
                    <p>Assign and track church leader tasks.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Task
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {taskToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Task?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{taskToDelete.title}</strong>?
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
                            <h2>{editingId ? "Edit Task" : "Add New Task"}</h2>
                            <p>Create or update a ministry task.</p>
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
                                    placeholder="e.g. Follow up John Banda"
                                />
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
                                <label>Department ID</label>
                                <input
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label>Related Member ID</label>
                                <input
                                    name="related_member_id"
                                    value={formData.related_member_id}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label>Due Date</label>
                                <input
                                    name="due_date"
                                    type="date"
                                    value={formData.due_date}
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
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
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
                                    placeholder="Describe the task"
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
                                    ? "Update Task"
                                    : "Save Task"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Ministry Tasks</h2>
                        <p>{filteredTasks.length} task(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search tasks..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchTasks}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <FaTasks />
                        <h3>No tasks found</h3>
                        <p>Add a task to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr key={getTaskId(task)}>
                                        <td>
                                            <strong>{task.title}</strong>
                                        </td>

                                        <td>{task.priority || "-"}</td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    task.status || "Pending"
                                                }`}
                                            >
                                                {task.status || "Pending"}
                                            </span>
                                        </td>

                                        <td>{formatDate(task.due_date) || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => handleEdit(task)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        quickUpdateStatus(
                                                            task,
                                                            "Completed"
                                                        )
                                                    }
                                                >
                                                    Complete
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(task)
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

export default Tasks;