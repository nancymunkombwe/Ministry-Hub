import { useEffect, useState } from "react";
import {
    FaChartLine,
    FaUsers,
    FaUserPlus,
    FaClipboardCheck,
    FaHandHoldingUsd,
    FaHeart,
    FaTasks,
    FaCalendarAlt,
    FaBullhorn,
    FaSyncAlt
} from "react-icons/fa";

import API from "../api/api";

const Reports = () => {
    const [dashboard, setDashboard] = useState(null);
    const [churchHealth, setChurchHealth] = useState(null);
    const [memberReport, setMemberReport] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [contributionReport, setContributionReport] = useState(null);
    const [visitorReport, setVisitorReport] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const formatDate = (dateValue) => {
        if (!dateValue) return "-";
        return String(dateValue).split("T")[0];
    };

    const getArray = (response, possibleKeys) => {
        for (const key of possibleKeys) {
            if (Array.isArray(response?.data?.[key])) {
                return response.data[key];
            }
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        return [];
    };

    const getObject = (response, possibleKeys) => {
        for (const key of possibleKeys) {
            if (response?.data?.[key]) {
                return response.data[key];
            }
        }

        return response?.data || null;
    };

    const fetchReports = async () => {
        setLoading(true);
        setError("");

        try {
            const [
                dashboardResult,
                churchHealthResult,
                membersResult,
                attendanceResult,
                contributionsResult,
                visitorsResult,
                eventsResult,
                announcementsResult
            ] = await Promise.allSettled([
                API.get("/reports/dashboard"),
                API.get("/reports/church-health"),
                API.get("/reports/members"),
                API.get(`/reports/attendance?year=${currentYear}&month=${currentMonth}`),
                API.get(`/reports/contributions?year=${currentYear}&month=${currentMonth}`),
                API.get(`/reports/visitors?year=${currentYear}&month=${currentMonth}`),
                API.get("/reports/upcoming-events"),
                API.get("/reports/recent-announcements")
            ]);

            if (dashboardResult.status === "fulfilled") {
                setDashboard(
                    getObject(dashboardResult.value, ["dashboard", "data", "report"])
                );
            }

            if (churchHealthResult.status === "fulfilled") {
                setChurchHealth(
                    getObject(churchHealthResult.value, [
                        "church_health",
                        "health",
                        "data",
                        "report"
                    ])
                );
            }

            if (membersResult.status === "fulfilled") {
                setMemberReport(
                    getObject(membersResult.value, [
                        "member_report",
                        "members",
                        "data",
                        "report"
                    ])
                );
            }

            if (attendanceResult.status === "fulfilled") {
                setAttendanceReport(
                    getObject(attendanceResult.value, [
                        "attendance_report",
                        "attendance",
                        "data",
                        "report"
                    ])
                );
            }

            if (contributionsResult.status === "fulfilled") {
                setContributionReport(
                    getObject(contributionsResult.value, [
                        "contribution_report",
                        "contributions",
                        "data",
                        "report"
                    ])
                );
            }

            if (visitorsResult.status === "fulfilled") {
                setVisitorReport(
                    getObject(visitorsResult.value, [
                        "visitor_report",
                        "visitors",
                        "data",
                        "report"
                    ])
                );
            }

            if (eventsResult.status === "fulfilled") {
                setUpcomingEvents(
                    getArray(eventsResult.value, [
                        "events",
                        "upcoming_events",
                        "data"
                    ])
                );
            }

            if (announcementsResult.status === "fulfilled") {
                setRecentAnnouncements(
                    getArray(announcementsResult.value, [
                        "announcements",
                        "recent_announcements",
                        "data"
                    ])
                );
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to load reports. Please check if the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="page page-fade">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">Reports & Insights</span>
                    <h1>Reports</h1>
                    <p>
                        View church health, attendance, visitors, events, and
                        finance summaries.
                    </p>
                </div>

                <button className="primary-btn" onClick={fetchReports}>
                    <FaSyncAlt /> Refresh Reports
                </button>
            </div>

            {error && <div className="page-error">{error}</div>}

            {loading ? (
                <div className="loading-box">Loading reports...</div>
            ) : (
                <>
                    <div className="dashboard-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUsers />
                            </div>
                            <h3>Total Members</h3>
                            <p>{dashboard?.total_members ?? 0}</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUsers />
                            </div>
                            <h3>Active Members</h3>
                            <p>{dashboard?.active_members ?? 0}</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUserPlus />
                            </div>
                            <h3>Total Visitors</h3>
                            <p>{dashboard?.total_visitors ?? 0}</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaHandHoldingUsd />
                            </div>
                            <h3>Monthly Contributions</h3>
                            <p>K{dashboard?.monthly_contributions ?? 0}</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaHeart />
                            </div>
                            <h3>Pending Care Follow-ups</h3>
                            <p>{dashboard?.pending_care_followups ?? 0}</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaTasks />
                            </div>
                            <h3>Pending Tasks</h3>
                            <p>{dashboard?.pending_tasks ?? 0}</p>
                        </div>

                        <div className="stat-card warning">
                            <div className="stat-icon">
                                <FaClipboardCheck />
                            </div>
                            <h3>Missing Members</h3>
                            <p>{dashboard?.missing_members ?? 0}</p>
                        </div>
                    </div>

                    <div className="report-grid">
                        <div className="table-card">
                            <div className="section-header">
                                <div>
                                    <h2>
                                        <FaChartLine /> Church Health
                                    </h2>
                                    <p>General ministry health indicators.</p>
                                </div>
                            </div>

                            <div className="report-list">
                                <div>
                                    <span>Member Status Groups</span>
                                    <strong>
                                        {churchHealth?.member_status?.length ??
                                            churchHealth?.members_by_status?.length ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Care Cases</span>
                                    <strong>
                                        {churchHealth?.care_cases?.length ??
                                            churchHealth?.care_followups?.length ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Task Groups</span>
                                    <strong>
                                        {churchHealth?.task_status?.length ??
                                            churchHealth?.tasks_by_status?.length ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Visitor Follow-up Groups</span>
                                    <strong>
                                        {churchHealth?.visitor_followups?.length ??
                                            churchHealth?.visitors_by_status?.length ??
                                            0}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-card">
                            <div className="section-header">
                                <div>
                                    <h2>
                                        <FaUsers /> Member Report
                                    </h2>
                                    <p>Member summary information.</p>
                                </div>
                            </div>

                            <div className="report-list">
                                <div>
                                    <span>Total Members</span>
                                    <strong>
                                        {memberReport?.total_members ??
                                            dashboard?.total_members ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Active Members</span>
                                    <strong>
                                        {memberReport?.active_members ??
                                            dashboard?.active_members ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Inactive Members</span>
                                    <strong>
                                        {memberReport?.inactive_members ?? 0}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-card">
                            <div className="section-header">
                                <div>
                                    <h2>
                                        <FaClipboardCheck /> Attendance Report
                                    </h2>
                                    <p>
                                        Current month attendance summary.
                                    </p>
                                </div>
                            </div>

                            <div className="report-list">
                                <div>
                                    <span>Sessions</span>
                                    <strong>
                                        {attendanceReport?.sessions?.length ??
                                            attendanceReport?.total_sessions ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Present Records</span>
                                    <strong>
                                        {attendanceReport?.present_count ??
                                            attendanceReport?.total_present ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Absent Records</span>
                                    <strong>
                                        {attendanceReport?.absent_count ??
                                            attendanceReport?.total_absent ??
                                            0}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-card">
                            <div className="section-header">
                                <div>
                                    <h2>
                                        <FaHandHoldingUsd /> Finance Report
                                    </h2>
                                    <p>
                                        Current month contribution summary.
                                    </p>
                                </div>
                            </div>

                            <div className="report-list">
                                <div>
                                    <span>Total Contributions</span>
                                    <strong>
                                        K
                                        {contributionReport?.total_contributions ??
                                            contributionReport?.monthly_total ??
                                            dashboard?.monthly_contributions ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Contribution Records</span>
                                    <strong>
                                        {contributionReport?.records?.length ??
                                            contributionReport?.count ??
                                            0}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-card">
                            <div className="section-header">
                                <div>
                                    <h2>
                                        <FaUserPlus /> Visitor Report
                                    </h2>
                                    <p>Visitor and follow-up summary.</p>
                                </div>
                            </div>

                            <div className="report-list">
                                <div>
                                    <span>Total Visitors</span>
                                    <strong>
                                        {visitorReport?.total_visitors ??
                                            dashboard?.total_visitors ??
                                            0}
                                    </strong>
                                </div>

                                <div>
                                    <span>Visitors This Month</span>
                                    <strong>
                                        {visitorReport?.visitors_this_month ??
                                            dashboard?.visitors_this_month ??
                                            0}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-card">
                        <div className="table-toolbar">
                            <div>
                                <h2>
                                    <FaCalendarAlt /> Upcoming Events
                                </h2>
                                <p>{upcomingEvents.length} event(s) found</p>
                            </div>
                        </div>

                        {upcomingEvents.length === 0 ? (
                            <div className="empty-state">
                                <FaCalendarAlt />
                                <h3>No upcoming events</h3>
                                <p>Upcoming events will appear here.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Event</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Location</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {upcomingEvents.map((event) => (
                                            <tr key={event.id || event.event_id}>
                                                <td>
                                                    <strong>{event.title}</strong>
                                                </td>
                                                <td>{formatDate(event.event_date)}</td>
                                                <td>{event.event_time || "-"}</td>
                                                <td>{event.location || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="table-card">
                        <div className="table-toolbar">
                            <div>
                                <h2>
                                    <FaBullhorn /> Recent Announcements
                                </h2>
                                <p>
                                    {recentAnnouncements.length} announcement(s)
                                    found
                                </p>
                            </div>
                        </div>

                        {recentAnnouncements.length === 0 ? (
                            <div className="empty-state">
                                <FaBullhorn />
                                <h3>No recent announcements</h3>
                                <p>Recent announcements will appear here.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Message</th>
                                            <th>Audience</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentAnnouncements.map(
                                            (announcement) => (
                                                <tr
                                                    key={
                                                        announcement.id ||
                                                        announcement.announcement_id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {announcement.title}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        {announcement.message ||
                                                            announcement.content ||
                                                            "-"}
                                                    </td>
                                                    <td>
                                                        {announcement.target_audience ||
                                                            "All Members"}
                                                    </td>
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

export default Reports;