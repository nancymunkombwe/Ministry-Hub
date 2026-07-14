import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaLayerGroup,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    name: "",
    description: ""
};

const Departments = () => {
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getDepartmentId = (department) => {
        return department.id || department.department_id;
    };

    const getDepartmentName = (department) => {
        return department.name || department.department_name || "Department";
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
                ${department.name || ""}
                ${department.department_name || ""}
                ${department.description || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [departments, searchTerm]);

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

        if (!formData.name.trim()) {
            setError("Department name is required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description
            };

            if (editingId) {
                await API.put(`/departments/${editingId}`, payload);
                setSuccess("Department updated successfully.");
            } else {
                await API.post("/departments", payload);
                setSuccess("Department added successfully.");
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

    const openDeleteModal = (department) => {
        setDepartmentToDelete(department);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setDepartmentToDelete(null);
    };

    const removeDepartmentFromTable = (departmentId) => {
        setDepartments((previousDepartments) =>
            previousDepartments.filter(
                (department) =>
                    String(getDepartmentId(department)) !== String(departmentId)
            )
        );
    };

    const confirmDelete = async () => {
        if (!departmentToDelete) {
            return;
        }

        const deletedDepartmentId = getDepartmentId(departmentToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/departments/${deletedDepartmentId}`);

            removeDepartmentFromTable(deletedDepartmentId);

            setSuccess("Department deleted successfully.");
            setDepartmentToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete department. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (department) => {
        setEditingId(getDepartmentId(department));

        setFormData({
            name: getDepartmentName(department),
            description: department.description || ""
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
                    <span className="eyebrow">Department Management</span>
                    <h1>Departments</h1>
                    <p>Create and manage church departments and ministries.</p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Department
                </button>
            </div>

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
                            <strong>
                                {getDepartmentName(departmentToDelete)}
                            </strong>
                            ?
                        </p>

                        <p className="delete-warning">
                            Members assigned to this department will be unassigned first.
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
            </div>

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Department"
                                    : "Add New Department"}
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
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Youth Ministry"
                                />
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

                        <button
                            className="secondary-btn"
                            onClick={fetchDepartments}
                        >
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
                                    <th>Description</th>
                                    <th>Actions</th>
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

                                        <td>{department.description || "-"}</td>

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
                                                        openDeleteModal(
                                                            department
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

export default Departments;