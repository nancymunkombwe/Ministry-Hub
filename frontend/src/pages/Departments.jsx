import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTrash,
    FaLayerGroup,
    FaUsers,
    FaUserCheck
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageDepartments,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    department_name: "",
    description: "",
    leader_name: "",
    status: "Active"
};

const Departments = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditDepartments = canManageDepartments(role);

    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const getDepartmentId = (department) => {
        return department.id || department.department_id;
    };

    const getDepartmentName = (department) => {
        return (
            department.department_name ||
            department.name ||
            department.title ||
            "Department"
        );
    };

    const getDepartmentStatus = (department) => {
        return department.status || "Active";
    };

    const fetchDepartments = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/departments");

            const departmentList =
                response.data.departments ||
                response.data.data ||
                response.data;

            setDepartments(Array.isArray(departmentList) ? departmentList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load departments. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const filteredDepartments = useMemo(() => {
        return departments.filter((department) => {
            const searchableText = `
                ${getDepartmentName(department)}
                ${department.description || ""}
                ${department.leader_name || ""}
                ${department.leader || ""}
                ${department.status || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [departments, searchTerm]);

    const activeDepartments = departments.filter(
        (department) => getDepartmentStatus(department) === "Active"
    ).length;

    const inactiveDepartments = departments.filter(
        (department) => getDepartmentStatus(department) === "Inactive"
    ).length;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const openAddForm = () => {
        if (!canEditDepartments) {
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

        if (!canEditDepartments) {
            setError(getNoPermissionMessage());
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        if (!formData.department_name.trim()) {
            setError("Department name is required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                department_name: formData.department_name,
                name: formData.department_name,
                description: formData.description,
                leader_name: formData.leader_name,
                leader: formData.leader_name,
                status: formData.status
            };

            if (editingId) {
                await API.put(`/departments/${editingId}`, payload);
                setSuccess("Department updated successfully.");
            } else {
                await API.post("/departments", payload);
                setSuccess("Department created successfully.");
            }

            resetForm();
            await fetchDepartments();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save department. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (department) => {
        if (!canEditDepartments) {
            setError(getNoPermissionMessage());
            return;
        }

        setEditingId(getDepartmentId(department));

        setFormData({
            department_name: getDepartmentName(department),
            description: department.description || "",
            leader_name: department.leader_name || department.leader || "",
            status: department.status || "Active"
        });

        setShowForm(true);
        setError("");
        setSuccess("");
        scrollToForm();
    };

    const openDeleteModal = (department) => {
        if (!canEditDepartments) {
            setError(getNoPermissionMessage());
            return;
        }

        setDepartmentToDelete(department);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setDepartmentToDelete(null);
    };

    const confirmDelete = async () => {
        if (!canEditDepartments) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!departmentToDelete) return;

        const departmentId = getDepartmentId(departmentToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/departments/${departmentId}`);

            setDepartments((previousDepartments) =>
                previousDepartments.filter(
                    (department) =>
                        String(getDepartmentId(department)) !== String(departmentId)
                )
            );

            setSuccess("Department deleted successfully.");
            setDepartmentToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete department. It may have members assigned to it."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Church Organization</span>
                    <h1>Departments</h1>
                    <p>
                        Manage church departments such as Youth, Music, Sabbath
                        School, and Pathfinders.
                    </p>
                </div>

                {canEditDepartments && (
                    <button className="primary-btn" onClick={openAddForm}>
                        <FaPlus /> Add Department
                    </button>
                )}
            </div>

            {!canEditDepartments && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {departmentToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Department?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{getDepartmentName(departmentToDelete)}</strong>?
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
                        <FaLayerGroup />
                    </div>
                    <h3>Total Departments</h3>
                    <p>{departments.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>
                    <h3>Active Departments</h3>
                    <p>{activeDepartments}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <h3>Inactive Departments</h3>
                    <p>{inactiveDepartments}</p>
                </div>
            </div>

            {showForm && canEditDepartments && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId ? "Edit Department" : "Add New Department"}
                            </h2>
                            <p>Enter department details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Department Name</label>
                                <input
                                    name="department_name"
                                    value={formData.department_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Youth Ministry"
                                />
                            </div>

                            <div>
                                <label>Leader Name</label>
                                <input
                                    name="leader_name"
                                    value={formData.leader_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Youth Leader"
                                />
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

                            <div className="full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Describe the department"
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
                                    ? "Update Department"
                                    : "Save Department"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Church Departments</h2>
                        <p>{filteredDepartments.length} department(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search departments..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchDepartments}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading departments...</div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="empty-state">
                        <FaLayerGroup />
                        <h3>No departments found</h3>
                        <p>Add a department to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Leader</th>
                                    <th>Status</th>
                                    <th>Description</th>
                                    {canEditDepartments && <th>Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredDepartments.map((department) => (
                                    <tr key={getDepartmentId(department)}>
                                        <td>
                                            <strong>
                                                {getDepartmentName(department)}
                                            </strong>
                                        </td>

                                        <td>
                                            {department.leader_name ||
                                                department.leader ||
                                                "-"}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    department.status || "Active"
                                                }`}
                                            >
                                                {department.status || "Active"}
                                            </span>
                                        </td>

                                        <td>{department.description || "-"}</td>

                                        {canEditDepartments && (
                                            <td>
                                                <div className="table-actions-inline">
                                                    <button
                                                        className="table-action-btn"
                                                        onClick={() =>
                                                            handleEdit(department)
                                                        }
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>

                                                    <button
                                                        className="table-delete-btn"
                                                        onClick={() =>
                                                            openDeleteModal(department)
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

export default Departments;