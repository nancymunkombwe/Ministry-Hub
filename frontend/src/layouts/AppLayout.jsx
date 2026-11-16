import { NavLink, Outlet } from "react-router-dom";
import {
    FaUsers,
    FaUserPlus,
    FaClipboardCheck,
    FaCalendarAlt,
    FaBullhorn,
    FaHandHoldingUsd,
    FaHeart,
    FaTasks,
    FaSignOutAlt,
    FaUserShield,
    FaChartPie,
    FaLayerGroup,
    FaFileAlt,
    FaCog
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import SdaFooter from "../components/SdaFooter";

const AppLayout = () => {
    const { user, logout } = useAuth();

    const role = user?.role || "";

    const navItems = [
        {
            path: "/dashboard",
            label: "Dashboard",
            icon: <FaChartPie />
        },
        {
            path: "/members",
            label: "Members",
            icon: <FaUsers />
        },
        {
            path: "/visitors",
            label: "Visitors",
            icon: <FaUserPlus />
        },
        {
            path: "/departments",
            label: "Ministries",
            icon: <FaLayerGroup />
        },
        {
            path: "/attendance",
            label: "Attendance",
            icon: <FaClipboardCheck />
        },
        {
            path: "/events",
            label: "Events",
            icon: <FaCalendarAlt />
        },
        {
            path: "/announcements",
            label: "Announcements",
            icon: <FaBullhorn />
        },
        {
            path: "/contributions",
            label: "Tithes & Offerings",
            icon: <FaHandHoldingUsd />
        },
        {
            path: "/care",
            label: "Care Follow-ups",
            icon: <FaHeart />
        },
        {
            path: "/tasks",
            label: "Tasks",
            icon: <FaTasks />
        },
        {
            path: "/reports",
            label: "Reports",
            icon: <FaFileAlt />
        }
    ];

    const adminItems = [
        {
            path: "/users",
            label: "Users",
            icon: <FaUserShield />
        },
        {
            path: "/settings",
            label: "Settings",
            icon: <FaCog />
        }
    ];

    const visibleNavItems =
        role === "admin"
            ? [...navItems, ...adminItems]
            : navItems.filter((item) => role === "treasurer" || item.path !== "/contributions");

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-top">
                    <BrandLogo size="sidebar" />

                    <div className="user-pill">
                        <span>
                            {user?.full_name || "Admin User"}
                        </span>

                        <small>{role}</small>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <SdaFooter />

                    <button
                        onClick={logout}
                        className="sidebar-logout"
                    >
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