import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/main.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./layouts/AppLayout";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Visitors from "./pages/Visitors";
import Departments from "./pages/Departments";
import Attendance from "./pages/Attendance";
import Events from "./pages/Events";
import Announcements from "./pages/Announcements";
import Contributions from "./pages/Contributions";
import CareFollowups from "./pages/CareFollowups";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/members" element={<Members />} />
                        <Route path="/visitors" element={<Visitors />} />
                        <Route path="/departments" element={<Departments />} />
                        <Route path="/attendance" element={<Attendance />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/announcements" element={<Announcements />} />
                        <Route path="/contributions" element={<Contributions />} />
                        <Route path="/care" element={<CareFollowups />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/reports" element={<Reports />} />

                        <Route
                            path="/users"
                            element={
                                <AdminRoute>
                                    <Users />
                                </AdminRoute>
                            }
                        />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;