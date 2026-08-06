import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTrash,
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaUserCheck
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageTasks,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    title: "",
    description: "",
    assigned_to: "",
    related_member_id: "",
    due_date: "",
    priority: "Medium",
    status: "Pending"
};

const Tasks = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditTasks = canManageTasks(role);

    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

    const getTaskId = (task) => {
        return task.id || task.task_id;
    };

    const getUserId = (user) => {
        return user.id || user.user_id;
    };

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getUserName = (user) => {
        return (
            user.full_name ||
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email ||
            "User"
        );
    };

    const getMemberName = (member) => {
        return (
            member.member_name ||
            member.full_name ||
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            "Member"
        );
    };

    const getAssignedUserName = (task) => {
        return (
            task.assigned_to_name ||
            task.assigned_user_name ||
            task.user_name ||
            task.full_name ||
            task.assigned_to ||
            "Unassigned"
        );
    };

    const getRelatedMemberName = (task) => {
        return (
            task.related_member_name ||
            task.member_name ||
            `${task.member_first_name || ""} ${task.member_last_name || ""}`.trim() ||
            "-"
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
            const [tasksResponse, usersResponse, membersResponse] =
                await Promise.allSettled([
                    API.get("/tasks"),
                    API.get("/users"),
                    API.get("/members")
                ]);

            if (tasksResponse.status === "fulfilled") {
                const taskList =
                    tasksResponse.value.data.tasks ||
                    tasksResponse.value.data.data ||
                    tasksResponse.value.data;

                setTasks(Array.isArray(taskList) ? taskList : []);
            }

            if (usersResponse.status === "fulfilled") {
                const userList =
                    usersResponse.value.data.users ||
                    usersResponse.value.data.data ||
                    usersResponse.value.data;

                setUsers(Array.isArray(userList) ? userList : []);
            }

            if (membersResponse.status === "fulfilled") {
                const memberList =
                    membersResponse.value.data.members ||
                    membersResponse.value.data.data ||
                    membersResponse.value.data;

                setMembers(Array.isArray(memberList) ? memberList : []);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load task data. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const searchableText = `
                ${task.title || ""}
                ${task.description || ""}
                ${task.priority || ""}
                ${task.status || ""}
                ${getAssignedUserName(task)}
                ${getRelatedMemberName(task)}
                ${task.due_date || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [tasks, searchTerm]);

    const pendingTasks = tasks.filter(
        (task) => (task.status || "Pending") === "Pending"
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "Completed"
    ).length;

    const highPriorityTasks = tasks.filter(
        (task) => task.priority === "High"
    ).length;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const openAddForm = () => {
        if (!canEditTasks) {
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

        if (!canEditTasks) {
            setError(getNoPermissionMessage());
            return;
        }

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
                title: formData.title,
                description: formData.description,
                assigned_to: formData.assigned_to || null,
                assigned_to_user_id: formData.assigned_to || null,
                related_member_id: formData.related_member_id || null,
                member_id: formData.related_member_id || null,
                due_date: formData.due_date || null,
                priority: formData.priority,
                status: formData.status
            };

            if (editingId) {
                await API.put(`/tasks/${editingId}`, payload);
                setSuccess("Task updated successfully.");
            } else {
                await API.post("/tasks", payload);
                setSuccess("Task created successfully.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save task. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (task) => {
        if (!canEditTasks) {
            setError(getNoPermissionMessage());
            return;
        }

        setEditingId(getTaskId(task));

        setFormData({
            title: task.title || "",
            description: task.description || "",
            assigned_to: task.assigned_to || task.assigned_to_user_id || "",
            related_member_id: task.related_member_id || task.member_id || "",
            due_date: formatDate(task.due_date),
            priority: task.priority || "Medium",
            status: task.status || "Pending"
        });

        setShowForm(true);
        setError("");
        setSuccess("");
        scrollToForm();
    };

    const openDeleteModal = (task) => {
        if (!canEditTasks) {
            setError(getNoPermissionMessage());
            return;
        }

        setTaskToDelete(task);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setTaskToDelete(null);
    };

    const confirmDelete = async () => {
        if (!canEditTasks) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!taskToDelete) return;

        const taskId = getTaskId(taskToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/tasks/${taskId}`);

            setTasks((previousTasks) =>
                previousTasks.filter(
                    (task) => String(getTaskId(task)) !== String(taskId)
                )
            );

            setSuccess("Task deleted successfully.");
            setTaskToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete task. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const markTaskCompleted = async (task) => {
        if (!canEditTasks) {
            setError(getNoPermissionMessage());
            return;
        }

        const taskId = getTaskId(task);

        setUpdatingStatus(true);
        setError("");
        setSuccess("");

        try {
            await API.patch(`/tasks/${taskId}/status`, {
                status: "Completed"
            });

            setSuccess("Task marked as completed.");
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to update task status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Task Management</span>
                    <h1>Tasks</h1>
                    <p>
                        Assign tasks to church workers and link them to members where
                        needed.
                    </p>
                </div>

                {canEditTasks && (
                    <button className="primary-btn" onClick={openAddForm}>
                        <FaPlus /> Add Task
                    </button>
                )}
            </div>

            {!canEditTasks && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

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

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaTasks />
                    </div>
                    <h3>Total Tasks</h3>
                    <p>{tasks.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClock />
                    </div>
                    <h3>Pending Tasks</h3>
                    <p>{pendingTasks}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaCheckCircle />
                    </div>
                    <h3>Completed Tasks</h3>
                    <p>{completedTasks}</p>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>
                    <h3>High Priority</h3>
                    <p>{highPriorityTasks}</p>
                </div>
            </div>

            {showForm && canEditTasks && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>{editingId ? "Edit Task" : "Add New Task"}</h2>
                            <p>Enter task details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Task Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Follow up with missing member"
                                />
                            </div>

                            <div>
                                <label>Assigned To</label>
                                <select
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                >
                                    <option value="">Unassigned</option>

                                    {users.map((user) => (
                                        <option
                                            key={getUserId(user)}
                                            value={getUserId(user)}
                                        >
                                            {getUserName(user)}{" "}
                                            {user.role ? `(${user.role})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Related Member</label>
                                <select
                                    name="related_member_id"
                                    value={formData.related_member_id}
                                    onChange={handleChange}
                                >
                                    <option value="">No related member</option>

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
                        <h2>Church Tasks</h2>
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

                        <button className="secondary-btn" onClick={fetchData}>
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
                                    <th>Task</th>
                                    <th>Assigned To</th>
                                    <th>Related Member</th>
                                    <th>Due Date</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    {canEditTasks && <th>Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr key={getTaskId(task)}>
                                        <td>
                                            <strong>{task.title}</strong>
                                            <br />
                                            <small>{task.description || ""}</small>
                                        </td>

                                        <td>{getAssignedUserName(task)}</td>

                                        <td>{getRelatedMemberName(task)}</td>

                                        <td>{formatDate(task.due_date) || "-"}</td>

                                        <td>
                                            <span className="status-badge">
                                                {task.priority || "Medium"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    task.status || "Pending"
                                                }`}
                                            >
                                                {task.status || "Pending"}
                                            </span>
                                        </td>

                                        {canEditTasks && (
                                            <td>
                                                <div className="table-actions-inline">
                                                    {task.status !== "Completed" && (
                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                markTaskCompleted(task)
                                                            }
                                                            disabled={updatingStatus}
                                                        >
                                                            <FaCheckCircle /> Complete
                                                        </button>
                                                    )}

                                                    <button
                                                        className="table-action-btn"
                                                        onClick={() => handleEdit(task)}
                                                    >
                                                        <FaEdit /> Edit
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

export default Tasks;