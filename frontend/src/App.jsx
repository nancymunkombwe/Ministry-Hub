import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

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

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import "./styles/main.css";

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
                        <Route
                            path="/announcements"
                            element={<Announcements />}
                        />
                        <Route
                            path="/contributions"
                            element={<Contributions />}
                        />
                        <Route path="/care" element={<CareFollowups />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/reports" element={<Reports />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;