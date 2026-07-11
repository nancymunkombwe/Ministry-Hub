import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaUsers
} from "react-icons/fa";

import API from "../api/api";

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

const Members = () => {
    const [members, setMembers] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const formatDateForInput = (dateValue) => {
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
            const fullName = `${member.first_name || ""} ${
                member.last_name || ""
            }`.toLowerCase();

            const searchableText = `
                ${fullName}
                ${member.phone || ""}
                ${member.email || ""}
                ${member.department || ""}
                ${member.status || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [members, searchTerm]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            setError("First name and last name are required.");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                baptism_date: formData.baptism_date || null
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

    const handleEdit = (member) => {
        setEditingId(getMemberId(member));

        setFormData({
            first_name: member.first_name || "",
            last_name: member.last_name || "",
            gender: member.gender || "Female",
            phone: member.phone || "",
            email: member.email || "",
            address: member.address || "",
            department: member.department || "",
            baptism_date: formatDateForInput(member.baptism_date),
            status: member.status || "Active"
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
                    <span className="eyebrow">Member Management</span>
                    <h1>Members</h1>
                    <p>Register, view, search, and update church member records.</p>
                </div>

                <button
                    className="primary-btn"
                    onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData(emptyForm);
                    }}
                >
                    <FaPlus /> Add Member
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>{editingId ? "Edit Member" : "Add New Member"}</h2>
                            <p>
                                Fill in the member details below. Required fields are
                                first name and last name.
                            </p>
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
                                    placeholder="e.g. 0977123456"
                                />
                            </div>

                            <div>
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g. john@email.com"
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
                                    <option value="Transferred">Transferred</option>
                                    <option value="Missing">Missing</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter member address"
                                    rows="3"
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
                        <p>Add your first church member to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={getMemberId(member)}>
                                        <td>
                                            <strong>
                                                {member.first_name}{" "}
                                                {member.last_name}
                                            </strong>
                                        </td>
                                        <td>{member.gender || "-"}</td>
                                        <td>{member.phone || "-"}</td>
                                        <td>{member.email || "-"}</td>
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
                                        <td>
                                            <button
                                                className="table-action-btn"
                                                onClick={() => handleEdit(member)}
                                            >
                                                <FaEdit /> Edit
                                            </button>
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

export default Members;