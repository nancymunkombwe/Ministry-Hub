import { useEffect, useState } from "react";
import {
    FaUsers,
    FaUserCheck,
    FaUserPlus,
    FaHandHoldingUsd,
    FaHeart,
    FaTasks,
    FaExclamationTriangle,
    FaBible,
    FaMusic,
    FaCalendarAlt,
    FaBullhorn,
    FaChartLine
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { user } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const response = await API.get(
                "/reports/current-dashboard"
            );

            setDashboard(
                response.data.dashboard
            );
        } catch (error) {
            console.error(
                "Failed to fetch dashboard:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const formatMoney = (amount) => {
        const value = Number(amount || 0);

        return `K ${value.toLocaleString(
            "en-ZM",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    };

    return (
        <div className="page page-fade">

            {/* =================================================
                DASHBOARD HEADER
            ================================================= */}

            <div className="dashboard-hero">
                <div>
                    <span className="eyebrow">
                        Ministry Hub Dashboard
                    </span>

                    <h1>
                        Welcome,{" "}
                        {user?.full_name ||
                            "Admin User"}
                    </h1>

                    <p>
                        A calm workspace for
                        managing members,
                        attendance, visitors,
                        contributions, and
                        ministry follow-ups.
                    </p>
                </div>
            </div>


            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (
                <div className="loading-box">
                    Loading dashboard...
                </div>
            ) : (
                <>

                    {/* =================================================
                        DASHBOARD STATISTICS
                    ================================================= */}

                    <div className="dashboard-grid">

                        {/* TOTAL MEMBERS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUsers />
                            </div>

                            <h3>
                                Total Members
                            </h3>

                            <p>
                                {dashboard?.total_members ||
                                    0}
                            </p>
                        </div>


                        {/* ACTIVE MEMBERS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUserCheck />
                            </div>

                            <h3>
                                Active Members
                            </h3>

                            <p>
                                {dashboard?.active_members ||
                                    0}
                            </p>
                        </div>


                        {/* VISITORS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaUserPlus />
                            </div>

                            <h3>
                                Total Visitors
                            </h3>

                            <p>
                                {dashboard?.total_visitors ||
                                    0}
                            </p>
                        </div>


                        {/* TOTAL CONTRIBUTIONS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaHandHoldingUsd />
                            </div>

                            <h3>
                                Total Contributions
                            </h3>

                            <p>
                                {formatMoney(
                                    dashboard?.total_contributions
                                )}
                            </p>
                        </div>


                        {/* THIS MONTH'S CONTRIBUTIONS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaChartLine />
                            </div>

                            <h3>
                                This Month
                            </h3>

                            <p>
                                {formatMoney(
                                    dashboard?.monthly_contributions
                                )}
                            </p>
                        </div>


                        {/* CARE FOLLOW-UPS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaHeart />
                            </div>

                            <h3>
                                Pending Care
                                Follow-ups
                            </h3>

                            <p>
                                {dashboard?.pending_care_followups ||
                                    0}
                            </p>
                        </div>


                        {/* TASKS */}
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaTasks />
                            </div>

                            <h3>
                                Pending Tasks
                            </h3>

                            <p>
                                {dashboard?.pending_tasks ||
                                    0}
                            </p>
                        </div>


                        {/* MISSING MEMBERS */}
                        <div className="stat-card warning">
                            <div className="stat-icon">
                                <FaExclamationTriangle />
                            </div>

                            <h3>
                                Missing Members
                            </h3>

                            <p>
                                {dashboard?.missing_members ||
                                    0}
                            </p>
                        </div>

                    </div>


                    {/* =================================================
                        SPIRITUAL TOOLS
                    ================================================= */}

                    <section className="quick-links-section">

                        <div className="section-title">

                            <h2>
                                Spiritual Tools
                            </h2>

                            <p>
                                Quick access for
                                worship planning
                                and ministry
                                support.
                            </p>

                        </div>


                        <div className="quick-links-grid">

                            {/* BIBLE */}
                            <a
                                href="https://www.bible.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="quick-link-card"
                            >
                                <FaBible />

                                <div>

                                    <h3>
                                        Bible
                                    </h3>

                                    <p>
                                        Open Bible
                                        resources.
                                    </p>

                                </div>
                            </a>


                            {/* HYMNS */}
                            <a
                                href="https://sdahymnals.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="quick-link-card"
                            >
                                <FaMusic />

                                <div>

                                    <h3>
                                        Hymns
                                    </h3>

                                    <p>
                                        Access hymns
                                        for worship.
                                    </p>

                                </div>
                            </a>


                            {/* EVENTS */}
                            <a
                                href="/events"
                                className="quick-link-card"
                            >
                                <FaCalendarAlt />

                                <div>

                                    <h3>
                                        Sabbath
                                        Program
                                    </h3>

                                    <p>
                                        Plan Sabbath
                                        service flow.
                                    </p>

                                </div>
                            </a>


                            {/* ANNOUNCEMENTS */}
                            <a
                                href="/announcements"
                                className="quick-link-card"
                            >
                                <FaBullhorn />

                                <div>

                                    <h3>
                                        Announcements
                                    </h3>

                                    <p>
                                        Prepare church
                                        notices.
                                    </p>

                                </div>
                            </a>

                        </div>

                    </section>

                </>
            )}

        </div>
    );
};

export default Dashboard;