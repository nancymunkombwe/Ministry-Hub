import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaTimes,
    FaSave,
    FaClipboardCheck,
    FaEye,
    FaUserCheck,
    FaUserTimes,
    FaExclamationTriangle,
    FaUsers,
    FaTrash
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
    canManageAttendance,
    getNoPermissionMessage
} from "../utils/permissions";

const emptySessionForm = {
    session_date: "",
    service_type: "Sabbath Service",
    department_id: "",
    notes: ""
};

const Attendance = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canEditAttendance = canManageAttendance(role);

    const [sessions, setSessions] = useState([]);
    const [members, setMembers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [records, setRecords] = useState([]);
    const [missingMembers, setMissingMembers] = useState([]);

    const [sessionForm, setSessionForm] = useState(emptySessionForm);
    const [selectedSession, setSelectedSession] = useState(null);

    const [bulkAttendance, setBulkAttendance] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [memberSearchTerm, setMemberSearchTerm] = useState("");

    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [savingSession, setSavingSession] = useState(false);
    const [savingBulk, setSavingBulk] = useState(false);
    const [deletingSession, setDeletingSession] = useState(false);

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

    const getSessionId = (session) => {
        return session.id;
    };

    const getMemberId = (member) => {
        return member.id || member.member_id;
    };

    const getDepartmentId = (department) => {
        return department.id || department.department_id;
    };

    const getDepartmentName = (department) => {
        return (
            department.department_name ||
            department.name ||
            "Department"
        );
    };

    const getRecordId = (record) => {
        return (
            record.id ||
            record.record_id ||
            record.attendance_record_id
        );
    };

    const getMemberName = (member) => {
        return (
            member.member_name ||
            member.full_name ||
            `${member.first_name || ""} ${
                member.last_name || ""
            }`.trim() ||
            "Member"
        );
    };

    const getRecordMemberName = (record) => {
        return (
            record.member_name ||
            record.full_name ||
            `${record.first_name || ""} ${
                record.last_name || ""
            }`.trim() ||
            "Member"
        );
    };

    const getServiceType = (session) => {
        return session.service_type || "Attendance Session";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return String(dateValue).split("T")[0];
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [
                sessionsResponse,
                membersResponse,
                departmentsResponse,
                missingResponse
            ] = await Promise.allSettled([
                API.get("/attendance/sessions"),
                API.get("/members"),
                API.get("/departments"),
                API.get("/attendance/missing-members")
            ]);

            if (sessionsResponse.status === "fulfilled") {
                const sessionList =
                    sessionsResponse.value.data.sessions || [];

                setSessions(
                    Array.isArray(sessionList)
                        ? sessionList
                        : []
                );
            }

            if (membersResponse.status === "fulfilled") {
                const memberList =
                    membersResponse.value.data.members || [];

                setMembers(
                    Array.isArray(memberList)
                        ? memberList
                        : []
                );
            }

            if (departmentsResponse.status === "fulfilled") {
                const departmentList =
                    departmentsResponse.value.data.departments ||
                    [];

                setDepartments(
                    Array.isArray(departmentList)
                        ? departmentList
                        : []
                );
            }

            if (missingResponse.status === "fulfilled") {
                const missingList =
                    missingResponse.value.data.missing_members ||
                    [];

                setMissingMembers(
                    Array.isArray(missingList)
                        ? missingList
                        : []
                );
            }
        } catch (error) {
            console.error(
                "Fetch attendance data error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to load attendance data. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionRecords = async (session) => {
        const sessionId = getSessionId(session);

        if (!sessionId) {
            setError("Invalid session selected.");
            return;
        }

        setSelectedSession(session);
        setRecordsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await API.get(
                `/attendance/sessions/${sessionId}/records`
            );

            const recordList =
                response.data.records || [];

            setRecords(
                Array.isArray(recordList)
                    ? recordList
                    : []
            );
        } catch (error) {
            console.error(
                "Fetch session records error:",
                error
            );

            setRecords([]);

            setError(
                error.response?.data?.message ||
                    "Failed to load session records."
            );
        } finally {
            setRecordsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSessions = useMemo(() => {
        const search = searchTerm
            .toLowerCase()
            .trim();

        return sessions.filter((session) => {
            const searchableText = `
                ${getServiceType(session)}
                ${session.department_name || ""}
                ${session.notes || ""}
                ${session.session_date || ""}
            `.toLowerCase();

            return searchableText.includes(search);
        });
    }, [sessions, searchTerm]);

    const filteredBulkMembers = useMemo(() => {
        const search = memberSearchTerm
            .toLowerCase()
            .trim();

        return bulkAttendance.filter((item) => {
            const searchableText = `
                ${item.member_name || ""}
                ${item.status || ""}
                ${item.remarks || ""}
            `.toLowerCase();

            return searchableText.includes(search);
        });
    }, [bulkAttendance, memberSearchTerm]);

    const presentCount = records.filter(
        (record) =>
            String(record.status || "").toLowerCase() ===
            "present"
    ).length;

    const absentCount = records.filter(
        (record) =>
            String(record.status || "").toLowerCase() ===
            "absent"
    ).length;

    const bulkPresentCount = bulkAttendance.filter(
        (item) => item.status === "Present"
    ).length;

    const bulkAbsentCount = bulkAttendance.filter(
        (item) => item.status === "Absent"
    ).length;

    const handleSessionChange = (event) => {
        const { name, value } = event.target;

        setSessionForm((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const resetSessionForm = () => {
        setSessionForm(emptySessionForm);
        setShowSessionForm(false);
        setError("");
    };

    const openSessionForm = () => {
        if (!canEditAttendance) {
            setError(getNoPermissionMessage());
            return;
        }

        setSessionForm(emptySessionForm);
        setShowSessionForm(true);
        setShowBulkForm(false);
        setError("");
        setSuccess("");

        scrollToForm();
    };

    const prepareBulkAttendance = async (session) => {
        if (!canEditAttendance) {
            setError(getNoPermissionMessage());
            return;
        }

        const sessionId = getSessionId(session);

        if (!sessionId) {
            setError("Invalid session selected.");
            return;
        }

        setSelectedSession(session);
        setShowBulkForm(true);
        setShowSessionForm(false);
        setMemberSearchTerm("");
        setError("");
        setSuccess("");

        scrollToForm();

        let existingRecords = [];

        try {
            const response = await API.get(
                `/attendance/sessions/${sessionId}/records`
            );

            existingRecords =
                response.data.records || [];

            existingRecords = Array.isArray(existingRecords)
                ? existingRecords
                : [];

            setRecords(existingRecords);
        } catch (error) {
            console.error(
                "Load existing attendance error:",
                error
            );

            existingRecords = [];
            setRecords([]);

            setError(
                error.response?.data?.message ||
                    "Could not load existing attendance records."
            );
        }

        const preparedList = members.map((member) => {
            const memberId = getMemberId(member);

            const existingRecord =
                existingRecords.find(
                    (record) =>
                        String(record.member_id) ===
                        String(memberId)
                );

            return {
                member_id: memberId,
                member_name: getMemberName(member),
                status:
                    existingRecord?.status ||
                    "Present",
                remarks:
                    existingRecord?.remarks || ""
            };
        });

        setBulkAttendance(preparedList);
    };

    const updateBulkStatus = (
        memberId,
        status
    ) => {
        setBulkAttendance((previousList) =>
            previousList.map((item) =>
                String(item.member_id) ===
                String(memberId)
                    ? {
                          ...item,
                          status
                      }
                    : item
            )
        );
    };

    const updateBulkRemarks = (
        memberId,
        remarks
    ) => {
        setBulkAttendance((previousList) =>
            previousList.map((item) =>
                String(item.member_id) ===
                String(memberId)
                    ? {
                          ...item,
                          remarks
                      }
                    : item
            )
        );
    };

    const markAll = (status) => {
        setBulkAttendance((previousList) =>
            previousList.map((item) => ({
                ...item,
                status
            }))
        );
    };

    const handleCreateSession = async (event) => {
        event.preventDefault();

        if (!canEditAttendance) {
            setError(getNoPermissionMessage());
            return;
        }

        setSavingSession(true);
        setError("");
        setSuccess("");

        if (
            !sessionForm.session_date ||
            !sessionForm.service_type
        ) {
            setError(
                "Session date and service type are required."
            );

            setSavingSession(false);
            return;
        }

        try {
            const payload = {
                session_date:
                    sessionForm.session_date,
                service_type:
                    sessionForm.service_type,
                department_id:
                    sessionForm.department_id || null,
                notes:
                    sessionForm.notes?.trim() || null
            };

            await API.post(
                "/attendance/sessions",
                payload
            );

            setSuccess(
                "Attendance session created successfully."
            );

            setSessionForm(emptySessionForm);
            setShowSessionForm(false);

            await fetchData();
        } catch (error) {
            console.error(
                "Create attendance session error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to create attendance session."
            );
        } finally {
            setSavingSession(false);
        }
    };

    const handleSaveBulkAttendance = async () => {
        if (!canEditAttendance) {
            setError(getNoPermissionMessage());
            return;
        }

        if (!selectedSession) {
            setError(
                "Please select a session first."
            );
            return;
        }

        if (bulkAttendance.length === 0) {
            setError(
                "No members found to mark attendance."
            );
            return;
        }

        const selectedSessionId =
            getSessionId(selectedSession);

        if (!selectedSessionId) {
            setError(
                "Invalid attendance session."
            );
            return;
        }

        setSavingBulk(true);
        setError("");
        setSuccess("");

        try {
            for (const item of bulkAttendance) {
                const payload = {
                    session_id:
                        selectedSessionId,
                    member_id: item.member_id,
                    status: item.status,
                    remarks:
                        item.remarks?.trim() || null
                };

                await API.post(
                    "/attendance/records",
                    payload
                );
            }

            setSuccess(
                "Bulk attendance saved successfully."
            );

            setShowBulkForm(false);

            await fetchSessionRecords(
                selectedSession
            );

            await fetchData();
        } catch (error) {
            console.error(
                "Save bulk attendance error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to save bulk attendance. Please try again."
            );
        } finally {
            setSavingBulk(false);
        }
    };

    // =====================================================
    // DELETE SESSION
    // =====================================================
    const handleDeleteSession = async (session) => {
        if (!canEditAttendance) {
            setError(getNoPermissionMessage());
            return;
        }

        const sessionId = getSessionId(session);

        if (!sessionId) {
            setError(
                "Invalid attendance session."
            );
            return;
        }

        const serviceType =
            getServiceType(session);

        const sessionDate =
            formatDate(session.session_date);

        const confirmed = window.confirm(
            `Delete this attendance session?\n\n` +
                `${serviceType} - ${sessionDate}\n\n` +
                `This will permanently delete the session and all attendance records belonging to it.\n\n` +
                `This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setDeletingSession(true);
        setError("");
        setSuccess("");

        try {
            await API.delete(
                `/attendance/sessions/${sessionId}`
            );

            if (
                selectedSession &&
                String(
                    getSessionId(selectedSession)
                ) === String(sessionId)
            ) {
                setSelectedSession(null);
                setRecords([]);
                setBulkAttendance([]);
                setShowBulkForm(false);
            }

            setSuccess(
                "Attendance session deleted successfully."
            );

            await fetchData();
        } catch (error) {
            console.error(
                "Delete attendance session error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to delete attendance session."
            );
        } finally {
            setDeletingSession(false);
        }
    };

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">
                        Attendance Tracking
                    </span>

                    <h1>Attendance</h1>

                    <p>
                        Create attendance sessions
                        and mark all members at
                        once.
                    </p>
                </div>

                {canEditAttendance && (
                    <button
                        className="primary-btn"
                        onClick={openSessionForm}
                    >
                        <FaPlus /> New Session
                    </button>
                )}
            </div>

            {!canEditAttendance && (
                <div className="info-message">
                    {getNoPermissionMessage()}
                </div>
            )}

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

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClipboardCheck />
                    </div>

                    <h3>Total Sessions</h3>
                    <p>{sessions.length}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserCheck />
                    </div>

                    <h3>
                        Present In Selected
                        Session
                    </h3>

                    <p>{presentCount}</p>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserTimes />
                    </div>

                    <h3>
                        Absent In Selected
                        Session
                    </h3>

                    <p>{absentCount}</p>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FaExclamationTriangle />
                    </div>

                    <h3>
                        Missing Members Alert
                    </h3>

                    <p>
                        {missingMembers.length}
                    </p>
                </div>
            </div>

            {showSessionForm &&
                canEditAttendance && (
                    <div className="form-card">
                        <div className="section-header">
                            <div>
                                <h2>
                                    Create Attendance
                                    Session
                                </h2>

                                <p>
                                    Start a new
                                    attendance
                                    register.
                                </p>
                            </div>

                            <button
                                className="icon-btn"
                                onClick={
                                    resetSessionForm
                                }
                                type="button"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleCreateSession
                            }
                        >
                            <div className="form-grid">
                                <div>
                                    <label>
                                        Session Date
                                    </label>

                                    <input
                                        name="session_date"
                                        type="date"
                                        value={
                                            sessionForm.session_date
                                        }
                                        onChange={
                                            handleSessionChange
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label>
                                        Service Type
                                    </label>

                                    <select
                                        name="service_type"
                                        value={
                                            sessionForm.service_type
                                        }
                                        onChange={
                                            handleSessionChange
                                        }
                                        required
                                    >
                                        <option value="Sabbath Service">
                                            Sabbath
                                            Service
                                        </option>

                                        <option value="Sabbath School">
                                            Sabbath
                                            School
                                        </option>

                                        <option value="Midweek Service">
                                            Midweek
                                            Service
                                        </option>

                                        <option value="Vespers">
                                            Vespers
                                        </option>

                                        <option value="Department Meeting">
                                            Department
                                            Meeting
                                        </option>

                                        <option value="Special Program">
                                            Special
                                            Program
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label>
                                        Department
                                    </label>

                                    <select
                                        name="department_id"
                                        value={
                                            sessionForm.department_id
                                        }
                                        onChange={
                                            handleSessionChange
                                        }
                                    >
                                        <option value="">
                                            General
                                            Church
                                            Session
                                        </option>

                                        {departments.map(
                                            (
                                                department
                                            ) => (
                                                <option
                                                    key={getDepartmentId(
                                                        department
                                                    )}
                                                    value={getDepartmentId(
                                                        department
                                                    )}
                                                >
                                                    {getDepartmentName(
                                                        department
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="full-width">
                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        value={
                                            sessionForm.notes
                                        }
                                        onChange={
                                            handleSessionChange
                                        }
                                        rows="3"
                                        placeholder="Optional notes"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={
                                        resetSessionForm
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={
                                        savingSession
                                    }
                                >
                                    <FaSave />

                                    {savingSession
                                        ? "Saving..."
                                        : "Save Session"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            {showBulkForm &&
                selectedSession &&
                canEditAttendance && (
                    <div className="form-card">
                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaUsers /> Bulk
                                    Attendance
                                </h2>

                                <p>
                                    Session:{" "}
                                    <strong>
                                        {getServiceType(
                                            selectedSession
                                        )}
                                    </strong>{" "}
                                    on{" "}
                                    {formatDate(
                                        selectedSession.session_date
                                    )}
                                </p>
                            </div>

                            <button
                                className="icon-btn"
                                onClick={() =>
                                    setShowBulkForm(
                                        false
                                    )
                                }
                                type="button"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bulk-summary">
                            <div>
                                <strong>
                                    {
                                        bulkAttendance.length
                                    }
                                </strong>

                                <span>
                                    Total Members
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        bulkPresentCount
                                    }
                                </strong>

                                <span>
                                    Present
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        bulkAbsentCount
                                    }
                                </strong>

                                <span>
                                    Absent
                                </span>
                            </div>
                        </div>

                        <div className="table-toolbar">
                            <div className="toolbar-actions">
                                <button
                                    className="secondary-btn"
                                    onClick={() =>
                                        markAll(
                                            "Present"
                                        )
                                    }
                                    type="button"
                                >
                                    <FaUserCheck /> Mark
                                    All Present
                                </button>

                                <button
                                    className="secondary-btn"
                                    onClick={() =>
                                        markAll(
                                            "Absent"
                                        )
                                    }
                                    type="button"
                                >
                                    <FaUserTimes /> Mark
                                    All Absent
                                </button>
                            </div>

                            <div className="search-box">
                                <FaSearch />

                                <input
                                    value={
                                        memberSearchTerm
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setMemberSearchTerm(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search members..."
                                />
                            </div>
                        </div>

                        <div className="table-wrapper bulk-attendance-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Member
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBulkMembers.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.member_id
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {
                                                            item.member_name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    <div className="attendance-toggle">
                                                        <button
                                                            type="button"
                                                            className={
                                                                item.status ===
                                                                "Present"
                                                                    ? "attendance-pill active-present"
                                                                    : "attendance-pill"
                                                            }
                                                            onClick={() =>
                                                                updateBulkStatus(
                                                                    item.member_id,
                                                                    "Present"
                                                                )
                                                            }
                                                        >
                                                            Present
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                item.status ===
                                                                "Absent"
                                                                    ? "attendance-pill active-absent"
                                                                    : "attendance-pill"
                                                            }
                                                            onClick={() =>
                                                                updateBulkStatus(
                                                                    item.member_id,
                                                                    "Absent"
                                                                )
                                                            }
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>

                                                <td>
                                                    <input
                                                        value={
                                                            item.remarks
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateBulkRemarks(
                                                                item.member_id,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Optional remarks"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="form-actions">
                            <button
                                className="secondary-btn"
                                onClick={() =>
                                    setShowBulkForm(
                                        false
                                    )
                                }
                                type="button"
                                disabled={savingBulk}
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-btn"
                                onClick={
                                    handleSaveBulkAttendance
                                }
                                type="button"
                                disabled={savingBulk}
                            >
                                <FaSave />

                                {savingBulk
                                    ? "Saving Attendance..."
                                    : "Save All Attendance"}
                            </button>
                        </div>
                    </div>
                )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>
                            Attendance Sessions
                        </h2>

                        <p>
                            {
                                filteredSessions.length
                            }{" "}
                            session(s) found
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
                                placeholder="Search sessions..."
                            />
                        </div>

                        <button
                            className="secondary-btn"
                            onClick={fetchData}
                            type="button"
                        >
                            <FaSyncAlt /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-box">
                        Loading attendance
                        sessions...
                    </div>
                ) : filteredSessions.length ===
                  0 ? (
                    <div className="empty-state">
                        <FaClipboardCheck />

                        <h3>
                            No attendance sessions
                            found
                        </h3>

                        <p>
                            Create an attendance
                            session to get
                            started.
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>
                                        Service Type
                                    </th>

                                    <th>Date</th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Notes
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSessions.map(
                                    (session) => (
                                        <tr
                                            key={getSessionId(
                                                session
                                            )}
                                        >
                                            <td>
                                                <strong>
                                                    {getServiceType(
                                                        session
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    session.session_date
                                                ) || "-"}
                                            </td>

                                            <td>
                                                {session.department_name ||
                                                    "General Church"}
                                            </td>

                                            <td>
                                                {session.notes ||
                                                    "-"}
                                            </td>

                                            <td>
                                                <div className="table-actions-inline">
                                                    <button
                                                        className="table-action-btn"
                                                        onClick={() =>
                                                            fetchSessionRecords(
                                                                session
                                                            )
                                                        }
                                                        type="button"
                                                    >
                                                        <FaEye />{" "}
                                                        View
                                                        Records
                                                    </button>

                                                    {canEditAttendance && (
                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                prepareBulkAttendance(
                                                                    session
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            <FaUsers />{" "}
                                                            Take
                                                            Attendance
                                                        </button>
                                                    )}

                                                    {canEditAttendance && (
                                                        <button
                                                            className="table-action-btn"
                                                            onClick={() =>
                                                                handleDeleteSession(
                                                                    session
                                                                )
                                                            }
                                                            type="button"
                                                            disabled={
                                                                deletingSession
                                                            }
                                                        >
                                                            <FaTrash />{" "}
                                                            {deletingSession
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedSession && (
                <div className="table-card">
                    <div className="table-toolbar">
                        <div>
                            <h2>
                                Session Records
                            </h2>

                            <p>
                                {getServiceType(
                                    selectedSession
                                )}{" "}
                                -{" "}
                                {formatDate(
                                    selectedSession.session_date
                                )}
                            </p>
                        </div>

                        {canEditAttendance && (
                            <button
                                className="primary-btn"
                                onClick={() =>
                                    prepareBulkAttendance(
                                        selectedSession
                                    )
                                }
                                type="button"
                            >
                                <FaUsers /> Take
                                Attendance
                            </button>
                        )}
                    </div>

                    {recordsLoading ? (
                        <div className="loading-box">
                            Loading records...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="empty-state">
                            <FaClipboardCheck />

                            <h3>
                                No records for this
                                session
                            </h3>

                            <p>
                                Take attendance for
                                this session.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Member
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {records.map(
                                        (record) => (
                                            <tr
                                                key={getRecordId(
                                                    record
                                                )}
                                            >
                                                <td>
                                                    <strong>
                                                        {getRecordMemberName(
                                                            record
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status-badge ${
                                                            record.status ||
                                                            "Present"
                                                        }`}
                                                    >
                                                        {record.status ||
                                                            "Present"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {record.remarks ||
                                                        "-"}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="table-card">
                <div className="table-toolbar">
                    <div>
                        <h2>
                            Missing Members Alert
                        </h2>

                        <p>
                            Members repeatedly
                            marked absent will
                            appear here.
                        </p>
                    </div>
                </div>

                {missingMembers.length === 0 ? (
                    <div className="empty-state">
                        <FaUserCheck />

                        <h3>
                            No missing member
                            alerts
                        </h3>

                        <p>
                            No member has reached
                            the missing alert
                            threshold.
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>
                                        Member
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Absent Count
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {missingMembers.map(
                                    (member) => (
                                        <tr
                                            key={getMemberId(
                                                member
                                            )}
                                        >
                                            <td>
                                                <strong>
                                                    {getMemberName(
                                                        member
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {member.phone ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {member.missed_services ||
                                                    "-"}
                                            </td>
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

export default Attendance;