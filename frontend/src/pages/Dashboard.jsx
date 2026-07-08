import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { user, logout } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const response = await API.get("/reports/dashboard");
            setDashboard(response.data.dashboard);
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    return (
        <div className="page">
            <div className="topbar">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome, {user?.full_name}</p>
                </div>

                <button onClick={logout} className="logout-btn">
                    Logout
                </button>
            </div>

            {loading ? (
                <p>Loading dashboard...</p>
            ) : (
                <div className="dashboard-grid">
                    <div className="stat-card">
                        <h3>Total Members</h3>
                        <p>{dashboard?.total_members}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Active Members</h3>
                        <p>{dashboard?.active_members}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Total Visitors</h3>
                        <p>{dashboard?.total_visitors}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Monthly Contributions</h3>
                        <p>K{dashboard?.monthly_contributions}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Pending Care Follow-ups</h3>
                        <p>{dashboard?.pending_care_followups}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Pending Tasks</h3>
                        <p>{dashboard?.pending_tasks}</p>
                    </div>

                    <div className="stat-card warning">
                        <h3>Missing Members</h3>
                        <p>{dashboard?.missing_members}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;