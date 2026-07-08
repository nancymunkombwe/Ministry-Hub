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
                        <span>{user?.full_name}</span>
                        <small>{user?.role}</small>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard">
                        <FaChartPie /> Dashboard
                    </NavLink>

                    <NavLink to="/members">
                        <FaUsers /> Members
                    </NavLink>

                    <NavLink to="/visitors">
                        <FaUserPlus /> Visitors
                    </NavLink>

                    <NavLink to="/departments">
                        <FaLayerGroup /> Departments
                    </NavLink>

                    <NavLink to="/attendance">
                        <FaClipboardCheck /> Attendance
                    </NavLink>

                    <NavLink to="/events">
                        <FaCalendarAlt /> Events
                    </NavLink>

                    <NavLink to="/announcements">
                        <FaBullhorn /> Announcements
                    </NavLink>

                    <NavLink to="/contributions">
                        <FaHandHoldingUsd /> Contributions
                    </NavLink>

                    <NavLink to="/care">
                        <FaHeart /> Care Follow-ups
                    </NavLink>

                    <NavLink to="/tasks">
                        <FaTasks /> Tasks
                    </NavLink>

                    <NavLink to="/reports">
                        <FaFileAlt /> Reports
                    </NavLink>
                </nav>

                <div className="sidebar-bottom">
                    <SdaFooter />

                    <button onClick={logout} className="sidebar-logout">
                        <FaSignOutAlt /> Logout
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