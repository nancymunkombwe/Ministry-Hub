import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageCareFollowups,
    getNoPermissionMessage
} from "../utils/permissions";

const emptyForm = {
    member_id: "",
    assigned_to: "",
    reason: "Prayer Request",
    description: "",
    status: "Pending",
    due_date: ""
};

const CareFollowups = () => {
    const { user } = useAuth();

    const canManage = canManageCareFollowups(user?.role);

    const [followups, setFollowups] = useState([]);
    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                followupsResponse,
                membersResponse,
                usersResponse
            ] = await Promise.all([
                API.get("/care"),
                API.get("/members"),
                API.get("/users")
            ]);

            const followupData = followupsResponse.data || {};
            const memberData = membersResponse.data || {};
            const userData = usersResponse.data || {};

            setFollowups(
                Array.isArray(followupData)
                    ? followupData
                    : Array.isArray(followupData.care_followups)
                      ? followupData.care_followups
                      : Array.isArray(followupData.data)
                        ? followupData.data
                        : []
            );

            setMembers(
                Array.isArray(memberData)
                    ? memberData
                    : Array.isArray(memberData.members)
                      ? memberData.members
                      : Array.isArray(memberData.data)
                        ? memberData.data
                        : []
            );

            setUsers(
                Array.isArray(userData)
                    ? userData
                    : Array.isArray(userData.users)
                      ? userData.users
                      : Array.isArray(userData.data)
                        ? userData.data
                        : []
            );
        } catch (err) {
            console.error("CARE DATA ERROR:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load care follow-ups."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canManage) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!formData.member_id || !formData.reason || !formData.due_date) {
            setError("Please select a member, care reason, and due date.");
            return;
        }

        const payload = {
            member_id: Number(formData.member_id),
            assigned_to: formData.assigned_to
                ? Number(formData.assigned_to)
                : null,
            reason: formData.reason,
            description: formData.description.trim(),
            status: formData.status,
            due_date: formData.due_date
        };

        try {
            setSaving(true);
            setError("");
            setMessage("");

            if (editingId) {
                await API.put(`/care/${editingId}`, payload);
                setMessage("Care follow-up updated successfully.");
            } else {
                await API.post("/care", payload);
                setMessage("Care follow-up added successfully.");
            }

            resetForm();
            await fetchData();
        } catch (err) {
            console.error("SAVE CARE ERROR:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to save care follow-up. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (followup) => {
        if (!canManage) {
            setError(getNoPermissionMessage());
            return;
        }

        setError("");
        setMessage("");
        setEditingId(followup.id);

        setFormData({
            member_id: followup.member_id || "",
            assigned_to: followup.assigned_to || "",
            reason: followup.reason || "Other",
            description: followup.description || "",
            status: followup.status || "Pending",
            due_date: formatDateForInput(followup.due_date)
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        if (!canManage) {
            setError(getNoPermissionMessage());
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this care follow-up?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            await API.delete(`/care/${id}`);

            setMessage(
                "Care follow-up deleted successfully."
            );

            await fetchData();

        } catch (err) {
            console.error("DELETE CARE ERROR:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to delete care follow-up."
            );
        }
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";

        return String(dateValue).split("T")[0];
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getMemberName = (followup) => {
        if (followup.member_name) {
            return followup.member_name;
        }

        const member = members.find(
            (item) =>
                Number(item.id) === Number(followup.member_id)
        );

        if (!member) return "Unknown member";

        return (
            member.full_name ||
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            "Unknown member"
        );
    };

    const getMemberOptionName = (member) => {
        return (
            member.full_name ||
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            `Member #${member.id}`
        );
    };

    const getAssignedUserName = (followup) => {
        if (followup.assigned_user_name) {
            return followup.assigned_user_name;
        }

        const assignedUser = users.find(
            (item) =>
                Number(item.id) === Number(followup.assigned_to)
        );

        return assignedUser?.full_name || "Not assigned";
    };

    const getStatusClass = (status) => {
        return String(status || "Pending")
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    const filteredFollowups = followups.filter((followup) => {
        const searchText = `
            ${getMemberName(followup)}
            ${getAssignedUserName(followup)}
            ${followup.reason || ""}
            ${followup.status || ""}
            ${followup.description || ""}
        `.toLowerCase();

        return searchText.includes(
            searchTerm.toLowerCase()
        );
    });

    return (
        <div className="page page-fade">

            {/* ================= HEADER ================= */}

            <div className="page-header">
                <span className="eyebrow">
                    PASTORAL CARE
                </span>

                <div className="page-header-row">
                    <div>
                        <h1>Care Follow-ups</h1>

                        <p>
                            Track pastoral care, prayer,
                            counselling, visits, and member
                            support.
                        </p>
                    </div>
                </div>
            </div>


            {/* ================= MESSAGES ================= */}

            {!canManage && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}


            {/* ================= FORM ================= */}

            {canManage && (
                <div className="form-card care-form-card">

                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Care Follow-up"
                                    : "Add Care Follow-up"}
                            </h2>

                            <p>
                                Record the care provided and
                                schedule any required follow-up.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="form-grid"
                    >

                        {/* MEMBER */}
                        <div>
                            <label>Member</label>

                            <select
                                name="member_id"
                                value={formData.member_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Select member
                                </option>

                                {members.map((member) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                    >
                                        {getMemberOptionName(member)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ASSIGNED TO */}
                        <div>
                            <label>Assigned To</label>

                            <select
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Not assigned
                                </option>

                                {users.map((systemUser) => (
                                    <option
                                        key={systemUser.id}
                                        value={systemUser.id}
                                    >
                                        {systemUser.full_name} ({systemUser.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CARE REASON */}
                        <div>
                            <label>Care Reason</label>

                            <select
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                            >
                                <option value="Missed Services">Missed Services</option>
                                <option value="Sick Member">Sick Member</option>
                                <option value="Visitation">Visitation</option>
                                <option value="New Convert">New Convert</option>
                                <option value="Prayer Request">Prayer Request</option>
                                <option value="Bereavement">Bereavement</option>
                                <option value="Counselling">Counselling</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* DUE DATE */}
                        <div>
                            <label>Due Date</label>

                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* STATUS */}
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

                        {/* DESCRIPTION */}
                        <div className="full-width">
                            <label>Care Description / Notes</label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Record relevant care notes..."
                                rows="4"
                            />
                        </div>

                        {/* ACTIONS */}

                        <div className="form-actions full-width">

                            {editingId && (
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                      ? "Update Follow-up"
                                      : "Add Follow-up"}
                            </button>

                        </div>

                    </form>
                </div>
            )}


            {/* ================= RECORDS ================= */}

            <div className="table-card care-records-card">

                <div className="table-toolbar">

                    <div>
                        <h2>
                            Care Follow-up Records
                        </h2>

                        <p>
                            {filteredFollowups.length}{" "}
                            record
                            {filteredFollowups.length === 1
                                ? ""
                                : "s"}{" "}
                            found
                        </p>
                    </div>

                    <div className="search-box">

                        <input
                            type="text"
                            placeholder="Search by member, type, status..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {/* LOADING */}

                {loading ? (
                    <div className="loading-box">
                        Loading care follow-ups...
                    </div>

                ) : filteredFollowups.length === 0 ? (

                    <div className="empty-state">

                        <h3>
                            No care follow-ups found
                        </h3>

                        <p>
                            {searchTerm
                                ? "Try a different search term."
                                : "Care follow-up records will appear here."}
                        </p>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Reason</th>
                                    <th>Assigned To</th>
                                    <th>Due Date</th>
                                    <th>Created</th>
                                    <th>Status</th>
                                    <th>Description</th>

                                    {canManage && (
                                        <th>Actions</th>
                                    )}
                                </tr>
                            </thead>


                            <tbody>

                                {filteredFollowups.map(
                                    (followup) => (

                                        <tr
                                            key={
                                                followup.id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {getMemberName(
                                                        followup
                                                    )}
                                                </strong>
                                            </td>


                                            <td>
                                                {followup.reason ||
                                                    "—"}
                                            </td>


                                            <td>
                                                {getAssignedUserName(
                                                    followup
                                                )}
                                            </td>


                                            <td>
                                                {formatDate(
                                                    followup.due_date
                                                )}
                                            </td>


                                            <td>
                                                {formatDate(
                                                    followup.created_at
                                                )}
                                            </td>


                                            <td>

                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        followup.status
                                                    )}`}
                                                >
                                                    {followup.status ||
                                                        "Pending"}
                                                </span>

                                            </td>


                                            <td className="care-notes-cell">

                                                {followup.description ||
                                                    "—"}

                                            </td>


                                            {canManage && (

                                                <td>

                                                    <div className="table-actions-inline">

                                                        <button
                                                            type="button"
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    followup
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="table-delete-btn"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    followup.id
                                                                )
                                                            }
                                                        >
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

        </div>
    );
};

export default CareFollowups;