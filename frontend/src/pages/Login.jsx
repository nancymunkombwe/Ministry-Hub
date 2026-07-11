import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import "../styles/auth.css";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("admin@ministryhub.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (error) {
            setError(
                error.response?.data?.message || "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <section className="login-brand-panel">
                <div className="login-brand-content">
                    <Link to="/" className="back-home-link">
                        <FaArrowLeft /> Back to Home
                    </Link>

                    <BrandLogo size="large" />

                    <div className="login-message">
                        <h1>Church Management Made Simple</h1>
                        <p>
                            Serving the church through organized ministry,
                            thoughtful follow-up, and clear leadership tools.
                        </p>
                    </div>

                    <div className="login-illustration">
                        <img
                            src="/images/login-church-people.png"
                            alt="Church community illustration"
                        />
                    </div>
                </div>

                <div className="login-panel-footer">
                    <img
                        src="/images/sda-logo.png"
                        alt="Seventh-day Adventist Logo"
                        className="login-sda-logo"
                    />
                    <span>Faith-based ministry administration</span>
                </div>
            </section>

            <section className="login-form-panel">
                <div className="login-card">
                    <div className="login-card-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to continue to Ministry Hub.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <label>Email address</label>
                        <div className="input-group">
                            <FaEnvelope />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter email"
                            />
                        </div>

                        <label>Password</label>
                        <div className="input-group">
                            <FaLock />
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter password"
                            />
                        </div>

                        <div className="form-row">
                            <label className="remember-me">
                                <input type="checkbox" defaultChecked />
                                Remember me
                            </label>

                            <Link to="/login">Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>

                    <p className="login-footer-text">
                        © 2026 Ministry Hub. Built for organized ministry.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Login;