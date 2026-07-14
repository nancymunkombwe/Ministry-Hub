import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaHandHoldingUsd,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";

const emptyForm = {
    member_id: "",
    contribution_category: "Tithe",
    amount: "",
    contribution_date: "",
    payment_method: "Cash",
    notes: ""
};

const Contributions = () => {
    const [contributions, setContributions] = useState([]);
    const [members, setMembers] = useState([]);

    const [formData, setFormData] = useState(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [contributionToDelete, setContributionToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getContributionId = (item) => {
        return item.id || item.contribution_id;
    };

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getMemberName = (member) => {
        return `${member.first_name || ""} ${member.last_name || ""}`.trim();
    };

    const getContributionCategory = (item) => {
        return (
            item.contribution_category ||
            item.contribution_type ||
            item.category ||
            ""
        );
    };

    const getContributionDate = (item) => {
        return item.contribution_date || item.date || item.created_at || "";
    };

    const getContributionMemberName = (item) => {
        return (
            item.member_name ||
            `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
            "General"
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
            const [contributionsResponse, membersResponse] = await Promise.all([
                API.get("/contributions"),
                API.get("/members")
            ]);

            const contributionList =
                contributionsResponse.data.contributions ||
                contributionsResponse.data.data ||
                contributionsResponse.data;

            const memberList =
                membersResponse.data.members ||
                membersResponse.data.data ||
                membersResponse.data;

            setContributions(
                Array.isArray(contributionList) ? contributionList : []
            );

            setMembers(Array.isArray(memberList) ? memberList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load contributions. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredContributions = useMemo(() => {
        return contributions.filter((item) => {
            const searchableText = `
                ${getContributionMemberName(item)}
                ${getContributionCategory(item)}
                ${item.payment_method || ""}
                ${item.amount || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [contributions, searchTerm]);

    const totalAmount = filteredContributions.reduce((total, item) => {
        return total + Number(item.amount || 0);
    }, 0);

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

        if (
            !formData.contribution_category ||
            !formData.amount ||
            !formData.contribution_date
        ) {
            setError(
                "Contribution category, amount, and contribution date are required."
            );
            setSaving(false);
            return;
        }

        try {
            const payload = {
                member_id: formData.member_id || null,

                contribution_category: formData.contribution_category,
                contribution_type: formData.contribution_category,
                category: formData.contribution_category,

                amount: Number(formData.amount),
                contribution_date: formData.contribution_date,
                payment_method: formData.payment_method,
                notes: formData.notes
            };

            if (editingId) {
                await API.put(`/contributions/${editingId}`, payload);
                setSuccess("Contribution updated successfully.");
            } else {
                await API.post("/contributions", payload);
                setSuccess("Contribution recorded successfully.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save contribution. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (item) => {
        setContributionToDelete(item);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setContributionToDelete(null);
    };

    const confirmDelete = async () => {
        if (!contributionToDelete) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(
                `/contributions/${getContributionId(contributionToDelete)}`
            );
            setSuccess("Contribution deleted successfully.");
            setContributionToDelete(null);
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete contribution. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(getContributionId(item));

        setFormData({
            member_id: item.member_id || "",
            contribution_category: getContributionCategory(item) || "Tithe",
            amount: item.amount || "",
            contribution_date: formatDate(getContributionDate(item)),
            payment_method: item.payment_method || "Cash",
            notes: item.notes || ""
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
                    <span className="eyebrow">Finance Management</span>
                    <h1>Contributions</h1>
                    <p>
                        Record tithes, offerings, donations, and monthly summaries.
                    </p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Record Contribution
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {contributionToDelete && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>

                        <h2>Delete Contribution?</h2>

                        <p>
                            Are you sure you want to delete this{" "}
                            <strong>
                                {getContributionCategory(contributionToDelete)}
                            </strong>{" "}
                            record of{" "}
                            <strong>
                                K
                                {Number(
                                    contributionToDelete.amount || 0
                                ).toFixed(2)}
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
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaHandHoldingUsd />
                    </div>
                    <h3>Displayed Total</h3>
                    <p>K{totalAmount.toFixed(2)}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaHandHoldingUsd />
                    </div>
                    <h3>Records</h3>
                    <p>{filteredContributions.length}</p>
                </div>
            </div>

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Contribution"
                                    : "Record Contribution"}
                            </h2>
                            <p>Enter contribution details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Member</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Anonymous / General</option>

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
                                <label>Contribution Category</label>
                                <select
                                    name="contribution_category"
                                    value={formData.contribution_category}
                                    onChange={handleChange}
                                >
                                    <option value="Tithe">Tithe</option>
                                    <option value="Offering">Offering</option>
                                    <option value="Donation">Donation</option>
                                    <option value="Project">Project</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label>Amount</label>
                                <input
                                    name="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="e.g. 500"
                                />
                            </div>

                            <div>
                                <label>Contribution Date</label>
                                <input
                                    name="contribution_date"
                                    type="date"
                                    value={formData.contribution_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label>Payment Method</label>
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleChange}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Optional notes"
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
                                    ? "Update Contribution"
                                    : "Save Contribution"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Contribution Records</h2>
                        <p>{filteredContributions.length} contribution(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search contributions..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchData}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading contributions...</div>
                ) : filteredContributions.length === 0 ? (
                    <div className="empty-state">
                        <FaHandHoldingUsd />
                        <h3>No contributions found</h3>
                        <p>Record a contribution to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredContributions.map((item) => (
                                    <tr key={getContributionId(item)}>
                                        <td>
                                            <strong>
                                                {getContributionMemberName(item)}
                                            </strong>
                                        </td>

                                        <td>{getContributionCategory(item) || "-"}</td>

                                        <td>
                                            K{Number(item.amount || 0).toFixed(2)}
                                        </td>

                                        <td>
                                            {formatDate(getContributionDate(item)) ||
                                                "-"}
                                        </td>

                                        <td>{item.payment_method || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(item)
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

export default Contributions;