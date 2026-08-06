import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSave,
    FaTrash,
    FaHandHoldingUsd,
    FaMoneyBillWave,
    FaChartLine
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

    const getContributionId = (contribution) => {
        return contribution.id || contribution.contribution_id;
    };

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getMemberName = (member) => {
        return (
            member.member_name ||
            member.full_name ||
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            "Member"
        );
    };

    const getContributionMemberName = (contribution) => {
        return (
            contribution.member_name ||
            contribution.full_name ||
            `${contribution.first_name || ""} ${contribution.last_name || ""}`.trim() ||
            "General Church Offering / Anonymous"
        );
    };

    const getContributionCategory = (contribution) => {
        return (
            contribution.contribution_category ||
            contribution.contribution_type ||
            contribution.category ||
            "Tithe"
        );
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const formatMoney = (amount) => {
        const value = Number(amount || 0);

        return `K ${value.toLocaleString("en-ZM", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [contributionsResponse, membersResponse] =
                await Promise.allSettled([
                    API.get("/contributions"),
                    API.get("/members")
                ]);

            if (contributionsResponse.status === "fulfilled") {
                const contributionList =
                    contributionsResponse.value.data.contributions ||
                    contributionsResponse.value.data.data ||
                    contributionsResponse.value.data;

                setContributions(
                    Array.isArray(contributionList) ? contributionList : []
                );
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
                    "Failed to load tithes and offerings. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredContributions = useMemo(() => {
        return contributions.filter((contribution) => {
            const searchableText = `
                ${getContributionMemberName(contribution)}
                ${getContributionCategory(contribution)}
                ${contribution.amount || ""}
                ${contribution.payment_method || ""}
                ${contribution.notes || ""}
                ${contribution.contribution_date || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [contributions, searchTerm]);

    const totalAmount = contributions.reduce((total, contribution) => {
        return total + Number(contribution.amount || 0);
    }, 0);

    const titheAmount = contributions
        .filter((contribution) => getContributionCategory(contribution) === "Tithe")
        .reduce((total, contribution) => total + Number(contribution.amount || 0), 0);

    const offeringAmount = contributions
        .filter((contribution) =>
            ["Offering", "Special Offering"].includes(
                getContributionCategory(contribution)
            )
        )
        .reduce((total, contribution) => total + Number(contribution.amount || 0), 0);

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

        if (
            !formData.contribution_category ||
            !formData.amount ||
            !formData.contribution_date
        ) {
            setError("Category, amount, and date are required.");
            setSaving(false);
            return;
        }

        if (Number(formData.amount) <= 0) {
            setError("Amount must be greater than 0.");
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
                setSuccess("Tithe / offering record updated successfully.");
            } else {
                await API.post("/contributions", payload);
                setSuccess("Tithe / offering recorded successfully.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to save tithe / offering record. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (contribution) => {
        setEditingId(getContributionId(contribution));

        setFormData({
            member_id: contribution.member_id || "",
            contribution_category: getContributionCategory(contribution),
            amount: contribution.amount || "",
            contribution_date: formatDate(contribution.contribution_date),
            payment_method: contribution.payment_method || "Cash",
            notes: contribution.notes || ""
        });

        setShowForm(true);
        setError("");
        setSuccess("");
        scrollToForm();
    };

    const openDeleteModal = (contribution) => {
        setContributionToDelete(contribution);
        setError("");
        setSuccess("");
    };

    const closeDeleteModal = () => {
        setContributionToDelete(null);
    };

    const confirmDelete = async () => {
        if (!contributionToDelete) return;

        const contributionId = getContributionId(contributionToDelete);

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(`/contributions/${contributionId}`);

            setContributions((previousContributions) =>
                previousContributions.filter(
                    (contribution) =>
                        String(getContributionId(contribution)) !==
                        String(contributionId)
                )
            );

            setSuccess("Tithe / offering record deleted successfully.");
            setContributionToDelete(null);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to delete tithe / offering record. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Church Finance</span>
                    <h1>Tithes & Offerings</h1>
                    <p>
                        Record tithes, offerings, donations, and special church
                        contributions.
                    </p>
                </div>

                <button className="primary-btn" onClick={openAddForm}>
                    <FaPlus /> Add Record
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

                        <h2>Delete Record?</h2>

                        <p>
                            Are you sure you want to delete this{" "}
                            <strong>{getContributionCategory(contributionToDelete)}</strong>{" "}
                            record of{" "}
                            <strong>{formatMoney(contributionToDelete.amount)}</strong>?
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
                    <h3>Total Records</h3>
                    <p>{contributions.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <h3>Total Amount</h3>
                    <p>{formatMoney(totalAmount)}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaChartLine />
                    </div>
                    <h3>Total Tithe</h3>
                    <p>{formatMoney(titheAmount)}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaHandHoldingUsd />
                    </div>
                    <h3>Total Offerings</h3>
                    <p>{formatMoney(offeringAmount)}</p>
                </div>
            </div>

            {showForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Tithe / Offering Record"
                                    : "Add Tithe / Offering Record"}
                            </h2>
                            <p>Enter the financial record details below.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForm}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Member / Source</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        General Church Offering / Anonymous
                                    </option>

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
                                <label>Category</label>
                                <select
                                    name="contribution_category"
                                    value={formData.contribution_category}
                                    onChange={handleChange}
                                >
                                    <option value="Tithe">Tithe</option>
                                    <option value="Offering">Offering</option>
                                    <option value="Special Offering">
                                        Special Offering
                                    </option>
                                    <option value="Donation">Donation</option>
                                    <option value="Building Fund">
                                        Building Fund
                                    </option>
                                    <option value="Welfare">Welfare</option>
                                    <option value="Camp Meeting">
                                        Camp Meeting
                                    </option>
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
                                    placeholder="e.g. 250"
                                />
                            </div>

                            <div>
                                <label>Date</label>
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
                                    <option value="Other">Other</option>
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
                                    ? "Update Record"
                                    : "Save Record"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Tithes & Offerings Records</h2>
                        <p>{filteredContributions.length} record(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search records..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchData}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">
                        Loading tithes and offerings...
                    </div>
                ) : filteredContributions.length === 0 ? (
                    <div className="empty-state">
                        <FaHandHoldingUsd />
                        <h3>No tithes or offerings found</h3>
                        <p>Add a financial record to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Member / Source</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredContributions.map((contribution) => (
                                    <tr key={getContributionId(contribution)}>
                                        <td>
                                            <strong>
                                                {getContributionMemberName(contribution)}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                {getContributionCategory(contribution)}
                                            </span>
                                        </td>

                                        <td>
                                            <strong>
                                                {formatMoney(contribution.amount)}
                                            </strong>
                                        </td>

                                        <td>
                                            {formatDate(
                                                contribution.contribution_date
                                            ) || "-"}
                                        </td>

                                        <td>{contribution.payment_method || "-"}</td>

                                        <td>
                                            <div className="table-actions-inline">
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() =>
                                                        handleEdit(contribution)
                                                    }
                                                >
                                                    <FaEdit /> Edit
                                                </button>

                                                <button
                                                    className="table-delete-btn"
                                                    onClick={() =>
                                                        openDeleteModal(contribution)
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