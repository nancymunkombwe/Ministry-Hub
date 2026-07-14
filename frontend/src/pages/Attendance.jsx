import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaClipboardCheck,
    FaTimes,
    FaSave,
    FaUsers
} from "react-icons/fa";

import API from "../api/api";

const emptySessionForm = {
    session_name: "",
    session_date: "",
    session_type: "Sabbath Service",
    department_id: "",
    notes: ""
};

const emptyRecordForm = {
    session_id: "",
    member_id: "",
    status: "Present",
    remarks: ""
};

const Attendance = () => {
    const [sessions, setSessions] = useState([]);
    const [members, setMembers] = useState([]);
    const [missingMembers, setMissingMembers] = useState([]);

    const [sessionForm, setSessionForm] = useState(emptySessionForm);
    const [recordForm, setRecordForm] = useState(emptyRecordForm);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showRecordForm, setShowRecordForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getSessionId = (session) => session.id || session.session_id;
    const getMemberId = (member) => member.id || member.member_id;

    const formatDate = (dateValue) => {
        if (!dateValue) return "-";
        return String(dateValue).split("T")[0];
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [sessionsResponse, membersResponse, missingResponse] =
                await Promise.all([
                    API.get("/attendance/sessions"),
                    API.get("/members"),
                    API.get("/attendance/missing-members")
                ]);

            const sessionList =
                sessionsResponse.data.sessions ||
                sessionsResponse.data.data ||
                sessionsResponse.data;

            const memberList =
                membersResponse.data.members ||
                membersResponse.data.data ||
                membersResponse.data;

            const missingList =
                missingResponse.data.missing_members ||
                missingResponse.data.members ||
                missingResponse.data.data ||
                missingResponse.data;

            setSessions(Array.isArray(sessionList) ? sessionList : []);
            setMembers(Array.isArray(memberList) ? memberList : []);
            setMissingMembers(Array.isArray(missingList) ? missingList : []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load attendance data. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            const searchableText = `
                ${session.session_name || ""}
                ${session.session_type || ""}
                ${session.session_date || ""}
                ${session.notes || ""}
            `.toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }, [sessions, searchTerm]);

    const handleSessionChange = (event) => {
        const { name, value } = event.target;

        setSessionForm((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const handleRecordChange = (event) => {
        const { name, value } = event.target;

        setRecordForm((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const resetForms = () => {
        setSessionForm(emptySessionForm);
        setRecordForm(emptyRecordForm);
        setShowSessionForm(false);
        setShowRecordForm(false);
        setError("");
    };

    const handleCreateSession = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        if (!sessionForm.session_name.trim() || !sessionForm.session_date) {
            setError("Session name and session date are required.");
            setSaving(false);
            return;
        }

        try {
            await API.post("/attendance/sessions", {
                ...sessionForm,
                department_id: sessionForm.department_id || null
            });

            setSuccess("Attendance session created successfully.");
            resetForms();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to create attendance session."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleMarkAttendance = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        if (!recordForm.session_id || !recordForm.member_id) {
            setError("Please select a session and a member.");
            setSaving(false);
            return;
        }

        try {
            await API.post("/attendance/records", {
                ...recordForm,
                attendance_session_id: recordForm.session_id
            });

            setSuccess("Attendance marked successfully.");
            resetForms();
            await fetchData();
        } catch (error) {
            setError(
                error.response?.data?.message || "Failed to mark attendance."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Attendance Tracking</span>
                    <h1>Attendance</h1>
                    <p>Create attendance sessions and mark member attendance.</p>
                </div>

                <div className="toolbar-actions">
                    <button
                        className="secondary-btn"
                        onClick={() => setShowRecordForm(true)}
                    >
                        <FaClipboardCheck /> Mark Attendance
                    </button>

                    <button
                        className="primary-btn"
                        onClick={() => setShowSessionForm(true)}
                    >
                        <FaPlus /> New Session
                    </button>
                </div>
            </div>

            {error && <div className="page-error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {showSessionForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>Create Attendance Session</h2>
                            <p>Create a Sabbath service or department attendance session.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForms}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleCreateSession}>
                        <div className="form-grid">
                            <div>
                                <label>Session Name</label>
                                <input
                                    name="session_name"
                                    value={sessionForm.session_name}
                                    onChange={handleSessionChange}
                                    placeholder="e.g. Sabbath Divine Service"
                                />
                            </div>

                            <div>
                                <label>Session Date</label>
                                <input
                                    name="session_date"
                                    type="date"
                                    value={sessionForm.session_date}
                                    onChange={handleSessionChange}
                                />
                            </div>

                            <div>
                                <label>Session Type</label>
                                <select
                                    name="session_type"
                                    value={sessionForm.session_type}
                                    onChange={handleSessionChange}
                                >
                                    <option value="Sabbath Service">Sabbath Service</option>
                                    <option value="Department Meeting">Department Meeting</option>
                                    <option value="Prayer Meeting">Prayer Meeting</option>
                                    <option value="Special Program">Special Program</option>
                                </select>
                            </div>

                            <div>
                                <label>Department ID</label>
                                <input
                                    name="department_id"
                                    value={sessionForm.department_id}
                                    onChange={handleSessionChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="full-width">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={sessionForm.notes}
                                    onChange={handleSessionChange}
                                    rows="3"
                                    placeholder="Optional notes"
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="secondary-btn" onClick={resetForms}>
                                Cancel
                            </button>

                            <button type="submit" className="primary-btn" disabled={saving}>
                                <FaSave /> {saving ? "Saving..." : "Save Session"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showRecordForm && (
                <div className="form-card">
                    <div className="section-header">
                        <div>
                            <h2>Mark Attendance</h2>
                            <p>Select a session and mark a member as present or absent.</p>
                        </div>

                        <button className="icon-btn" onClick={resetForms}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleMarkAttendance}>
                        <div className="form-grid">
                            <div>
                                <label>Session</label>
                                <select
                                    name="session_id"
                                    value={recordForm.session_id}
                                    onChange={handleRecordChange}
                                >
                                    <option value="">Select session</option>
                                    {sessions.map((session) => (
                                        <option key={getSessionId(session)} value={getSessionId(session)}>
                                            {session.session_name || session.title || "Attendance Session"} - {formatDate(session.session_date)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Member</label>
                                <select
                                    name="member_id"
                                    value={recordForm.member_id}
                                    onChange={handleRecordChange}
                                >
                                    <option value="">Select member</option>
                                    {members.map((member) => (
                                        <option key={getMemberId(member)} value={getMemberId(member)}>
                                            {member.first_name} {member.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={recordForm.status}
                                    onChange={handleRecordChange}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="Excused">Excused</option>
                                </select>
                            </div>

                            <div className="full-width">
                                <label>Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={recordForm.remarks}
                                    onChange={handleRecordChange}
                                    rows="3"
                                    placeholder="Optional remarks"
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="secondary-btn" onClick={resetForms}>
                                Cancel
                            </button>

                            <button type="submit" className="primary-btn" disabled={saving}>
                                <FaSave /> {saving ? "Saving..." : "Save Attendance"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClipboardCheck />
                    </div>
                    <h3>Total Sessions</h3>
                    <p>{sessions.length}</p>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <h3>Missing Members</h3>
                    <p>{missingMembers.length}</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>Attendance Sessions</h2>
                        <p>{filteredSessions.length} session(s) found</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search sessions..."
                            />
                        </div>

                        <button className="secondary-btn" onClick={fetchData}>
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading attendance...</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="empty-state">
                        <FaClipboardCheck />
                        <h3>No attendance sessions found</h3>
                        <p>Create an attendance session to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Session</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSessions.map((session) => (
                                    <tr key={getSessionId(session)}>
                                        <td>
                                            <strong>{session.session_name || session.title || "Attendance Session"}</strong>
                                        </td>
                                        <td>{formatDate(session.session_date)}</td>
                                        <td>{session.session_type || "-"}</td>
                                        <td>{session.notes || "-"}</td>
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

export default Attendance;