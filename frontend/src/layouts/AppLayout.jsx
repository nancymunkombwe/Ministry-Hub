import { NavLink, Outlet } from "react-router-dom";
import {
    FaChartPie,
    FaUsers,
    FaUserPlus,
    FaLayerGroup,
    FaClipboardCheck,
    FaCalendarAlt,
    FaBullhorn,
    FaHandHoldingUsd,
    FaHeart,
    FaTasks,
    FaFileAlt,
    FaSignOutAlt
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import SdaFooter from "../components/SdaFooter";

const AppLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-top">
                    <BrandLogo size="sidebar" />

                    <div className="user-pill">
                        <span>{user?.full_name || "Admin User"}</span>
                        <small>{user?.role || "admin"}</small>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard">
                        <FaChartPie />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/members">
                        <FaUsers />
                        <span>Members</span>
                    </NavLink>

                    <NavLink to="/visitors">
                        <FaUserPlus />
                        <span>Visitors</span>
                    </NavLink>

                    <NavLink to="/departments">
                        <FaLayerGroup />
                        <span>Departments</span>
                    </NavLink>

                    <NavLink to="/attendance">
                        <FaClipboardCheck />
                        <span>Attendance</span>
                    </NavLink>

                    <NavLink to="/events">
                        <FaCalendarAlt />
                        <span>Events</span>
                    </NavLink>

                    <NavLink to="/announcements">
                        <FaBullhorn />
                        <span>Announcements</span>
                    </NavLink>

                    <NavLink to="/contributions">
                        <FaHandHoldingUsd />
                        <span>Contributions</span>
                    </NavLink>

                    <NavLink to="/care">
                        <FaHeart />
                        <span>Care Follow-ups</span>
                    </NavLink>

                    <NavLink to="/tasks">
                        <FaTasks />
                        <span>Tasks</span>
                    </NavLink>

                    <NavLink to="/reports">
                        <FaFileAlt />
                        <span>Reports</span>
                    </NavLink>
                </nav>

                <div className="sidebar-bottom">
                    <SdaFooter />

                    <button onClick={logout} className="sidebar-logout">
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;