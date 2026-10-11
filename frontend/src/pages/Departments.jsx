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
    FaUserCheck,
    FaArrowLeft,
    FaEnvelope,
    FaPhone
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
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

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

    /*
     * NOTE:
     * The backend still uses /departments and department_name.
     * We are changing the user-facing terminology to "Ministries"
     * without breaking the existing backend.
     */

    const getDepartmentId = (department) => {
        return department.id || department.department_id;
    };

    const getDepartmentName = (department) => {
        return (
            department.department_name ||
            department.name ||
            department.title ||
            "Ministry"
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

            setDepartments(
                Array.isArray(departmentList)
                    ? departmentList
                    : []
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load ministries. Please check if the backend is running."
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

            return searchableText.includes(
                searchTerm.toLowerCase()
            );
        });
    }, [departments, searchTerm]);

    const activeDepartments = departments.filter(
        (department) =>
            getDepartmentStatus(department) === "Active"
    ).length;

    const inactiveDepartments = departments.filter(
        (department) =>
            getDepartmentStatus(department) === "Inactive"
    ).length;

    const openDepartmentDetails = async (department) => {
        const departmentId = getDepartmentId(department);
        setSelectedDepartment(department);
        setDepartmentMembers([]);
        setDetailsLoading(true);
        setDetailsError("");
        try {
            const response = await API.get(`/departments/${departmentId}/members`);
            setDepartmentMembers(response.data.members || []);
        } catch (error) {
            setDetailsError(error.response?.data?.message || "Could not load members for this ministry.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDepartmentDetails = () => {
        setSelectedDepartment(null);
        setDepartmentMembers([]);
        setDetailsError("");
    };

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
            setError("Ministry name is required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                // Keep backend field names unchanged
                department_name: formData.department_name,
                name: formData.department_name,
                description: formData.description,
                leader_name: formData.leader_name,
                leader: formData.leader_name,
                status: formData.status
            };

            if (editingId) {
                await API.put(
                    `/departments/${editingId}`,
                    payload
                );

                setSuccess(
                    "Ministry updated successfully."
                );
            } else {
                await API.post(
                    "/departments",
                    payload
                );

                setSuccess(
                    "Ministry created successfully."
                );
            }

            resetForm();
            await fetchDepartments();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save ministry. Please try again."
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

        setEditingId(
            getDepartmentId(department)
        );

        setFormData({
            department_name:
                getDepartmentName(department),

            description:
                department.description || "",

            leader_name:
                department.leader_name ||
                department.leader ||
                "",

            status:
                department.status || "Active"
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

        const departmentId =
            getDepartmentId(departmentToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(
                `/departments/${departmentId}`
            );

            setDepartments(
                (previousDepartments) =>
                    previousDepartments.filter(
                        (department) =>
                            String(
                                getDepartmentId(
                                    department
                                )
                            ) !==
                            String(departmentId)
                    )
            );

            setSuccess(
                "Ministry deleted successfully."
            );

            setDepartmentToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete ministry. It may have members assigned to it."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="page page-fade">

            {/* PAGE HEADER */}
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">
                        Church Organization
                    </span>

                    <h1>Ministries</h1>

                    <p>
                        Manage church ministries such as
                        Youth, Music, Sabbath School,
                        Pathfinders, and other ministry
                        groups.
                    </p>
                </div>

                {canEditDepartments && (
                    <button
                        className="primary-btn"
                        onClick={openAddForm}
                    >
                        <FaPlus />
                        Add Ministry
                    </button>
                )}
            </div>

            {/* PERMISSION MESSAGE */}
            {!canEditDepartments && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

            {/* ALERTS */}
            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {/* DELETE MODAL */}
            {departmentToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">

                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>
                            Delete Ministry?
                        </h2>

                        <p>
                            Are you sure you want to
                            delete{" "}
                            <strong>
                                {getDepartmentName(
                                    departmentToDelete
                                )}
                            </strong>
                            ?
                        </p>

                        <p className="delete-warning">
                            This action cannot be undone.
                        </p>

                        <div className="delete-modal-actions">

                            <button
                                className="secondary-btn"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                <FaTrash />

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
                        <FaLayerGroup />
                    </div>

                    <h3>
                        Total Ministries
                    </h3>

                    <p>
                        {departments.length}
                    </p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>

                    <h3>
                        Active Ministries
                    </h3>

                    <p>
                        {activeDepartments}
                    </p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <h3>
                        Inactive Ministries
                    </h3>

                    <p>
                        {inactiveDepartments}
                    </p>
                </div>

            </div>

            {/* ADD / EDIT FORM */}
            {showForm && canEditDepartments && (
                <div className="form-card">

                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Ministry"
                                    : "Add New Ministry"}
                            </h2>

                            <p>
                                Enter the ministry
                                information below.
                            </p>
                        </div>

                        <button
                            className="icon-btn"
                            onClick={resetForm}
                            type="button"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            {/* MINISTRY NAME */}
                            <div>
                                <label>
                                    Ministry Name
                                </label>

                                <input
                                    name="department_name"
                                    value={
                                        formData.department_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Youth Ministry"
                                />
                            </div>

                            {/* LEADER */}
                            <div>
                                <label>
                                    Ministry Leader
                                </label>

                                <input
                                    name="leader_name"
                                    value={
                                        formData.leader_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. John Banda"
                                />
                            </div>

                            {/* STATUS */}
                            <div>
                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="full-width">
                                <label>
                                    Ministry Description
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="3"
                                    placeholder="Describe the ministry and its responsibilities"
                                ></textarea>
                            </div>

                        </div>

                        {/* FORM ACTIONS */}
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
                                    ? "Update Ministry"
                                    : "Save Ministry"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* MINISTRY DETAILS */}
            {selectedDepartment ? (
                <div className="table-card">
                    <div className="table-toolbar">
                        <div>
                            <button className="secondary-btn" onClick={closeDepartmentDetails} type="button">
                                <FaArrowLeft /> Back to Ministries
                            </button>
                            <h2 style={{ marginTop: "18px" }}>{getDepartmentName(selectedDepartment)}</h2>
                            <p>{selectedDepartment.description || "Ministry details and assigned members."}</p>
                        </div>
                        <div className="stat-card" style={{ minWidth: "130px", margin: 0 }}>
                            <h3>Assigned Members</h3>
                            <p>{detailsLoading ? "…" : departmentMembers.length}</p>
                        </div>
                    </div>
                    {detailsError && <div className="page-error">{detailsError}</div>}
                    {detailsLoading ? (
                        <div className="loading-box">Loading ministry members...</div>
                    ) : detailsError ? null : departmentMembers.length === 0 ? (
                        <div className="empty-state">
                            <FaUsers />
                            <h3>No members assigned yet</h3>
                            <p>Members assigned to this ministry will appear here. The count reflects actual database assignments.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead><tr><th>Member</th><th>Role</th><th>Membership Status</th><th>Contact</th></tr></thead>
                                <tbody>{departmentMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td><strong>{member.first_name} {member.last_name}</strong><div style={{ color: "#64748b", fontSize: "0.9em" }}>{member.gender || ""}</div></td>
                                        <td>{member.role_in_department || "Member"}</td>
                                        <td><span className={`status-badge ${member.membership_status || "Active"}`}>{member.membership_status || "Unknown"}</span></td>
                                        <td>{member.phone && <div><FaPhone style={{ marginRight: 6 }} />{member.phone}</div>}{member.email && <div><FaEnvelope style={{ marginRight: 6 }} />{member.email}</div>}{!member.phone && !member.email && "—"}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
            <>
            {/* MINISTRY TABLE */}
            <div className="table-card">

                <div className="table-toolbar">

                    <div>
                        <h2>
                            Church Ministries
                        </h2>

                        <p>
                            {filteredDepartments.length}{" "}
                            ministr
                            {filteredDepartments.length === 1
                                ? "y"
                                : "ies"}{" "}
                            found
                        </p>
                    </div>

                    <div className="toolbar-actions">

                        <div className="search-box">
                            <FaSearch />

                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                placeholder="Search ministries..."
                            />
                        </div>

                        <button
                            className="secondary-btn"
                            onClick={fetchDepartments}
                        >
                            <FaSyncAlt />
                            Refresh
                        </button>

                    </div>
                </div>

                {/* LOADING */}
                {loading ? (
                    <div className="loading-box">
                        Loading ministries...
                    </div>

                ) : filteredDepartments.length === 0 ? (

                    /* EMPTY STATE */
                    <div className="empty-state">

                        <FaLayerGroup />

                        <h3>
                            No ministries found
                        </h3>

                        <p>
                            Add a ministry to get
                            started.
                        </p>

                    </div>

                ) : (

                    /* TABLE */
                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>
                                <tr>

                                    <th>
                                        Ministry
                                    </th>

                                    <th>
                                        Leader
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    {canEditDepartments && (
                                        <th>
                                            Actions
                                        </th>
                                    )}

                                </tr>
                            </thead>

                            <tbody>

                                {filteredDepartments.map(
                                    (department) => (

                                        <tr
                                            key={getDepartmentId(
                                                department
                                            )}
                                        >

                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => openDepartmentDetails(department)}
                                                    title={`View ${getDepartmentName(department)} details`}
                                                    style={{ border: 0, background: "transparent", padding: 0, color: "#173b63", font: "inherit", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                                                >
                                                    {getDepartmentName(department)}
                                                </button>
                                                <div style={{ color: "#64748b", fontSize: "0.82em", marginTop: 4 }}>
                                                    {Number(department.member_count || 0)} assigned member(s) · View details →
                                                </div>
                                            </td>

                                            <td>
                                                {department.leader_name ||
                                                    department.leader ||
                                                    "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={`status-badge ${
                                                        department.status ||
                                                        "Active"
                                                    }`}
                                                >
                                                    {department.status ||
                                                        "Active"}
                                                </span>

                                            </td>

                                            <td>
                                                {department.description ||
                                                    "-"}
                                            </td>

                                            {canEditDepartments && (
                                                <td>

                                                    <div className="table-actions-inline">

                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    department
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="table-delete-btn"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    department
                                                                )
                                                            }
                                                        >
                                                            <FaTrash />
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>
                                            )}

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>
            </>
            )}

        </div>
    );
};

export default Departments;