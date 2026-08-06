import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaUserShield,
    FaUserCheck,
    FaUserSlash,
    FaUsers
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    full_name: "",
    email: "",
    password: "",
    role: "leader",
    status: "Active"
};

const Users = () => {
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const getUserId = (user) => {
        return user.id || user.user_id;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/users");

            const userList =
                response.data.users ||
                response.data.data ||
                response.data;

            setUsers(Array.isArray(userList) ? userList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load users. Make sure you are logged in as admin."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const searchableText = `
                ${user.full_name || ""}
                ${user.email || ""}
                ${user.role || ""}
                ${user.status || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [users, searchTerm]);

    const adminCount = users.filter((user) => user.role === "admin").length;
    const leaderCount = users.filter((user) => user.role === "leader").length;
    const treasurerCount = users.filter((user) => user.role === "treasurer").length;
    const activeCount = users.filter(
        (user) => (user.status || "Active") === "Active"
    ).length;

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

        setSaving(true);
        setError("");
        setSuccess("");

        if (!formData.full_name.trim() || !formData.email.trim() || !formData.role) {
            setError("Full name, email, and role are required.");
            setSaving(false);
            return;
        }

        if (!editingId && !formData.password.trim()) {
            setError("Password is required when creating a new user.");
            setSaving(false);
            return;
        }

        if (formData.password && formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                full_name: formData.full_name,
                email: formData.email,
                role: formData.role,
                status: formData.status
            };

            if (formData.password.trim()) {
                payload.password = formData.password;
            }

            if (editingId) {
                await API.put(`/users/${editingId}`, payload);
                setSuccess("User updated successfully.");
            } else {
                await API.post("/users", payload);
                setSuccess("User created successfully.");
            }

            resetForm();
            await fetchUsers();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save user. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(getUserId(user));

        setFormData({
            full_name: user.full_name || "",
            email: user.email || "",
            password: "",
            role: user.role || "leader",
            status: user.status || "Active"
        });

        setShowForm(true);
        setError("");
        setSuccess("");
        scrollToForm();
    };

    const openStatusModal = (user) => {
        setUserToToggle(user);
        setError("");
        setSuccess("");
    };

    const closeStatusModal = () => {
        setUserToToggle(null);
    };

    const confirmStatusChange = async () => {
        if (!userToToggle) return;

        const currentStatus = userToToggle.status || "Active";
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

        setUpdatingStatus(true);
        setError("");
        setSuccess("");

        try {
            await API.patch(`/users/${getUserId(userToToggle)}/status`, {
                status: newStatus
            });

            setSuccess(
                newStatus === "Inactive"
                    ? "User deactivated successfully."
                    : "User activated successfully."
            );

            setUserToToggle(null);
            await fetchUsers();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to update user status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Admin Only</span>
                    <h1>User Management</h1>
                    <p>
                        Create and manage system users who can log in to Ministry Hub.
                    </p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add User
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {userToToggle && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            {(userToToggle.status || "Active") === "Active" ? (
                                <FaUserSlash />
                            ) : (
                                <FaUserCheck />
                            )}
                        </div>

                        <h2>
                            {(userToToggle.status || "Active") === "Active"
                                ? "Deactivate User?"
                                : "Activate User?"}
                        </h2>

                        <p>
                            Are you sure you want to{" "}
                            {(userToToggle.status || "Active") === "Active"
                                ? "deactivate"
                                : "activate"}{" "}
                            <strong>{userToToggle.full_name}</strong>?
                        </p>

                        <p className="delete-warning">
                            Inactive users should not be allowed to use the system.
                        </p>

                        <div className="delete-modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={closeStatusModal}
                                disabled={updatingStatus}
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-btn"
                                onClick={confirmStatusChange}
                                disabled={updatingStatus}
                            >
                                {updatingStatus
                                    ? "Updating..."
                                    : (userToToggle.status || "Active") === "Active"
                                    ? "Yes, Deactivate"
                                    : "Yes, Activate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <h3>Total Users</h3>
                    <p>{users.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>
                    <h3>Active Users</h3>
                    <p>{activeCount}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserShield />
                    </div>
                    <h3>Admins</h3>
                    <p>{adminCount}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <h3>Leaders / Treasurers</h3>
                    <p>{leaderCount + treasurerCount}</p>
                </div>
            </div>

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>{editingId ? "Edit User" : "Add New User"}</h2>
                            <p>
                                {editingId
                                    ? "Leave password blank if you do not want to change it."
                                    : "Create a login account for an authorized church worker."}
                            </p>
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
                                    placeholder="e.g. Youth Leader"
                                />
                            </div>

                            <div>
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g. leader@church.com"
                                />
                            </div>

                            <div>
                                <label>
                                    {editingId
                                        ? "New Password Optional"
                                        : "Password"}
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={
                                        editingId
                                            ? "Leave blank to keep old password"
                                            : "At least 6 characters"
                                    }
                                />
                            </div>

                            <div>
                                <label>Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="leader">Leader</option>
                                    <option value="treasurer">Treasurer</option>
                                </select>
                            </div>

                            <div>
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
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
                                    ? "Update User"
                                    : "Save User"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>System Users</h2>
                        <p>{filteredUsers.length} user(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search users..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchUsers}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <FaUserShield />
                        <h3>No users found</h3>
                        <p>Add a system user to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={getUserId(user)}>
                                        <td>
                                            <strong>{user.full_name}</strong>
                                            <br />
                                            <small>{user.email}</small>
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                {user.role}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    user.status || "Active"
                                                }`}
                                            >
                                                {user.status || "Active"}
                                            </span>
                                        </td>

                                        <td>{formatDate(user.created_at) || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openStatusModal(user)
                                                    }
                                                >
                                                    {(user.status || "Active") ===
                                                    "Active" ? (
                                                        <>
                                                            <FaUserSlash /> Deactivate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaUserCheck /> Activate
                                                        </>
                                                    )}
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

export default Users;