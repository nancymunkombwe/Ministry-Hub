import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaUsers,
    FaUserSlash,
    FaUserCheck,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageMembers,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    first_name: "",
    last_name: "",
    gender: "Female",
    phone: "",
    email: "",
    address: "",
    department: "",
    baptism_date: "",
    status: "Active"
};

const createEmptyBulkRow = () => ({
    first_name: "",
    last_name: "",
    gender: "Female",
    phone: "",
    email: "",
    department: "",
    baptism_date: "",
    status: "Active",
    address: ""
});

const Members = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditMembers = canManageMembers(role);

    const [members, setMembers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [bulkRows, setBulkRows] = useState([
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow(),
        createEmptyBulkRow()
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);

    const [memberToToggle, setMemberToToggle] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingBulk, setSavingBulk] = useState(false);

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

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getMemberName = (member) => {
        return `${member.first_name || ""} ${member.last_name || ""}`.trim();
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchMembers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/members");

            const memberList =
                response.data.members ||
                response.data.data ||
                response.data;

            setMembers(Array.isArray(memberList) ? memberList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load members. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const searchableText = `
                ${member.first_name || ""}
                ${member.last_name || ""}
                ${member.gender || ""}
                ${member.phone || ""}
                ${member.email || ""}
                ${member.department || ""}
                ${member.status || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [members, searchTerm]);

    const activeMembers = members.filter(
        (member) => (member.status || "Active") === "Active"
    ).length;

    const inactiveMembers = members.filter(
        (member) => member.status === "Inactive"
    ).length;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const handleBulkChange = (index, field, value) => {
        setBulkRows((previousRows) =>
            previousRows.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                          ...row,
                          [field]: value
                      }
                    : row
            )
        );
    };

    const addBulkRow = () => {
        setBulkRows((previousRows) => [
            ...previousRows,
            createEmptyBulkRow()
        ]);
    };

    const removeBulkRow = (index) => {
        setBulkRows((previousRows) => {
            if (previousRows.length === 1) {
                return previousRows;
            }

            return previousRows.filter((_, rowIndex) => rowIndex !== index);
        });
    };

    const openAddForm = () => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setShowBulkForm(false);
        setError("");
        setSuccess("");
        scrollToForm();
    };

    const openBulkForm = () => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setBulkRows([
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow()
        ]);

        setShowBulkForm(true);
        setShowForm(false);
        setEditingId(null);
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

    const resetBulkForm = () => {
        setBulkRows([
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow(),
            createEmptyBulkRow()
        ]);

        setShowBulkForm(false);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        if (
            !formData.first_name.trim() ||
            !formData.last_name.trim() ||
            !formData.gender
        ) {
            setError("First name, last name, and gender are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                gender: formData.gender,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                department: formData.department,
                baptism_date: formData.baptism_date || null,
                status: formData.status
            };

            if (editingId) {
                await API.put(`/members/${editingId}`, payload);
                setSuccess("Member updated successfully.");
            } else {
                await API.post("/members", payload);
                setSuccess("Member added successfully.");
            }

            resetForm();
            await fetchMembers();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save member. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBulkMembers = async () => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setSavingBulk(true);
        setError("");
        setSuccess("");

        const rowsWithData = bulkRows.filter((row) => {
            return (
                row.first_name.trim() ||
                row.last_name.trim() ||
                row.phone.trim() ||
                row.email.trim() ||
                row.department.trim()
            );
        });

        if (rowsWithData.length === 0) {
            setError("Please enter at least one member.");
            setSavingBulk(false);
            return;
        }

        const hasInvalidRow = rowsWithData.some((row) => {
            return !row.first_name.trim() || !row.last_name.trim() || !row.gender;
        });

        if (hasInvalidRow) {
            setError("Each member must have first name, last name, and gender.");
            setSavingBulk(false);
            return;
        }

        try {
            for (const row of rowsWithData) {
                const payload = {
                    first_name: row.first_name,
                    last_name: row.last_name,
                    gender: row.gender,
                    phone: row.phone,
                    email: row.email,
                    address: row.address,
                    department: row.department,
                    baptism_date: row.baptism_date || null,
                    status: row.status
                };

                await API.post("/members", payload);
            }

            setSuccess(`${rowsWithData.length} member(s) added successfully.`);
            resetBulkForm();
            await fetchMembers();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save bulk members. Some members may have already been saved."
            );
        } finally {
            setSavingBulk(false);
        }
    };

    const openStatusModal = (member) => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setMemberToToggle(member);
        setError("");
        setSuccess("");
    };

    const closeStatusModal = () => {
        setMemberToToggle(null);
    };

    const confirmStatusChange = async () => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!memberToToggle) {
            return;
        }

        setUpdatingStatus(true);
        setError("");
        setSuccess("");

        const currentStatus = memberToToggle.status || "Active";
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

        try {
            const payload = {
                first_name: memberToToggle.first_name || "",
                last_name: memberToToggle.last_name || "",
                gender: memberToToggle.gender || "Female",
                phone: memberToToggle.phone || "",
                email: memberToToggle.email || "",
                address: memberToToggle.address || "",
                department: memberToToggle.department || "",
                baptism_date: formatDate(memberToToggle.baptism_date) || null,
                status: newStatus
            };

            await API.put(`/members/${getMemberId(memberToToggle)}`, payload);

            setSuccess(
                newStatus === "Inactive"
                    ? "Member deactivated successfully."
                    : "Member activated successfully."
            );

            setMemberToToggle(null);
            await fetchMembers();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to update member status. Please try again."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleEdit = (member) => {
        if (!canEditMembers) {
            setError(getNoPermissionMessage());
            return;
        }

        setEditingId(getMemberId(member));

        setFormData({
            first_name: member.first_name || "",
            last_name: member.last_name || "",
            gender: member.gender || "Female",
            phone: member.phone || "",
            email: member.email || "",
            address: member.address || "",
            department: member.department || "",
            baptism_date: formatDate(member.baptism_date),
            status: member.status || "Active"
        });

        setShowForm(true);
        setShowBulkForm(false);
        setSuccess("");
        setError("");
        scrollToForm();
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Member Management</span>
                    <h1>Members</h1>
                    <p>Register, update, bulk add, and manage church members.</p>
                </div>

                {canEditMembers && (
                    <div className="toolbar-actions">
                        <button className="secondary-btn" onClick={openBulkForm}>
                            <FaUsers /> Add Multiple
                        </button>

                        <button className="primary-btn" onClick={openAddForm}>
                            <FaPlus /> Add Member
                        </button>
                    </div>
                )}
            </div>

            {!canEditMembers && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {memberToToggle && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            {(memberToToggle.status || "Active") === "Active" ? (
                                <FaUserSlash />
                            ) : (
                                <FaUserCheck />
                            )}
                        </div>

                        <h2>
                            {(memberToToggle.status || "Active") === "Active"
                                ? "Deactivate Member?"
                                : "Activate Member?"}
                        </h2>

                        <p>
                            Are you sure you want to{" "}
                            {(memberToToggle.status || "Active") === "Active"
                                ? "deactivate"
                                : "activate"}{" "}
                            <strong>{getMemberName(memberToToggle)}</strong>?
                        </p>

                        <p className="delete-warning">
                            The member record will remain in the system for history.
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
                                    : (memberToToggle.status || "Active") === "Active"
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
                    <h3>Total Members</h3>
                    <p>{members.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>
                    <h3>Active Members</h3>
                    <p>{activeMembers}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserSlash />
                    </div>
                    <h3>Inactive Members</h3>
                    <p>{inactiveMembers}</p>
                </div>
            </div>

            {showBulkForm && canEditMembers && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>Add Multiple Members</h2>
                            <p>Enter many members and save them all at once.</p>
                        </div>

                        <button className="icon-btn" onClick={resetBulkForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="bulk-member-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={addBulkRow}
                        >
                            <FaPlus /> Add Row
                        </button>

                        <span>{bulkRows.length} row(s)</span>
                    </div>

                    <div className="table-wrapper bulk-members-wrapper">
                        <table className="data-table bulk-members-table">
                            <thead>
                                <tr>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>

                            <tbody>
                                {bulkRows.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                value={row.first_name}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "first_name",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="First name"
                                            />
                                        </td>

                                        <td>
                                            <input
                                                value={row.last_name}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "last_name",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Last name"
                                            />
                                        </td>

                                        <td>
                                            <select
                                                value={row.gender}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "gender",
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                            </select>
                                        </td>

                                        <td>
                                            <input
                                                value={row.phone}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "phone",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Phone"
                                            />
                                        </td>

                                        <td>
                                            <input
                                                value={row.email}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "email",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Email"
                                            />
                                        </td>

                                        <td>
                                            <input
                                                value={row.department}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "department",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Department"
                                            />
                                        </td>

                                        <td>
                                            <select
                                                value={row.status}
                                                onChange={(event) =>
                                                    handleBulkChange(
                                                        index,
                                                        "status",
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="table-delete-btn"
                                                onClick={() => removeBulkRow(index)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={resetBulkForm}
                            disabled={savingBulk}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={handleSaveBulkMembers}
                            disabled={savingBulk}
                        >
                            <FaSave />
                            {savingBulk ? "Saving Members..." : "Save All Members"}
                        </button>
                    </div>
                </div>
            )}

            {showForm && canEditMembers && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>{editingId ? "Edit Member" : "Add New Member"}</h2>
                            <p>Enter the member details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>First Name</label>
                                <input
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="e.g. John"
                                />
                            </div>

                            <div>
                                <label>Last Name</label>
                                <input
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Banda"
                                />
                            </div>

                            <div>
                                <label>Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
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
                                    placeholder="e.g. member@email.com"
                                />
                            </div>

                            <div>
                                <label>Department</label>
                                <input
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="e.g. Youth Ministry"
                                />
                            </div>

                            <div>
                                <label>Baptism Date</label>
                                <input
                                    name="baptism_date"
                                    type="date"
                                    value={formData.baptism_date}
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
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter member address"
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
                                    ? "Update Member"
                                    : "Save Member"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Church Members</h2>
                        <p>{filteredMembers.length} member(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search members..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchMembers}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="empty-state">
                        <FaUsers />
                        <h3>No members found</h3>
                        <p>Add a member to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    {canEditMembers && <th>Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={getMemberId(member)}>
                                        <td>
                                            <strong>{getMemberName(member)}</strong>
                                            <br />
                                            <small>{member.email || ""}</small>
                                        </td>

                                        <td>{member.gender || "-"}</td>
                                        <td>{member.phone || "-"}</td>
                                        <td>{member.department || "-"}</td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    member.status || "Active"
                                                }`}
                                            >
                                                {member.status || "Active"}
                                            </span>
                                        </td>

                                        {canEditMembers && (
                                            <td>
                                                <div className="table-actions-inline">
                                                    <button
                                                        className="table-action-btn"
                                                        onClick={() =>
                                                            handleEdit(member)
                                                        }
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>

                                                    <button
                                                        className="table-delete-btn"
                                                        onClick={() =>
                                                            openStatusModal(member)
                                                        }
                                                    >
                                                        {(member.status || "Active") ===
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

export default Members;