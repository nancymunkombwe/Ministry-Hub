import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import "./styles/main.css";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />

                        <Route
                            path="/members"
                            element={
                                <PlaceholderPage
                                    title="Members"
                                    description="Manage church member records and profiles."
                                />
                            }
                        />

                        <Route
                            path="/visitors"
                            element={
                                <PlaceholderPage
                                    title="Visitors"
                                    description="Manage visitor records and follow-up status."
                                />
                            }
                        />

                        <Route
                            path="/departments"
                            element={
                                <PlaceholderPage
                                    title="Departments"
                                    description="Manage SDA departments and member assignments."
                                />
                            }
                        />

                        <Route
                            path="/attendance"
                            element={
                                <PlaceholderPage
                                    title="Attendance"
                                    description="Track Sabbath and departmental attendance."
                                />
                            }
                        />

                        <Route
                            path="/events"
                            element={
                                <PlaceholderPage
                                    title="Events"
                                    description="Manage church events and Sabbath programs."
                                />
                            }
                        />

                        <Route
                            path="/announcements"
                            element={
                                <PlaceholderPage
                                    title="Announcements"
                                    description="Create announcements and WhatsApp-ready messages."
                                />
                            }
                        />

                        <Route
                            path="/contributions"
                            element={
                                <PlaceholderPage
                                    title="Contributions"
                                    description="Record tithes, offerings, and donations."
                                />
                            }
                        />

                        <Route
                            path="/care"
                            element={
                                <PlaceholderPage
                                    title="Care Follow-ups"
                                    description="Track members needing visitation, prayer, or care."
                                />
                            }
                        />

                        <Route
                            path="/tasks"
                            element={
                                <PlaceholderPage
                                    title="Tasks"
                                    description="Assign and track church leader tasks."
                                />
                            }
                        />

                        <Route
                            path="/reports"
                            element={
                                <PlaceholderPage
                                    title="Reports"
                                    description="View church health, attendance, and finance summaries."
                                />
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;