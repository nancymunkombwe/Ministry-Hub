import { Link } from "react-router-dom";
import {
    FaUsers,
    FaClipboardCheck,
    FaUserPlus,
    FaHandHoldingUsd,
    FaBullhorn,
    FaChartLine,
    FaBible,
    FaMusic,
    FaArrowRight
} from "react-icons/fa";

const LandingPage = () => {
    return (
        <div className="landing-page">
            <header className="landing-navbar">
                <Link to="/" className="landing-logo">
                    <img
                        src="/images/ministry-hub-logo.png"
                        alt="Ministry Hub Logo"
                    />
                    <div>
                        <h2>Ministry Hub</h2>
                        <p>Church Management System</p>
                    </div>
                </Link>

                <nav className="landing-nav-links">
                    <a href="#features">Features</a>
                    <a href="#ministry">Ministry Tools</a>
                    <a href="#about">About</a>
                </nav>

                <Link to="/login" className="landing-login-btn">
                    Login
                </Link>
            </header>

            <main>
                <section className="landing-hero">
                    <div className="hero-content">
                        <span className="hero-eyebrow">
                            Organized ministry. Stronger fellowship.
                        </span>

                        <h1>
                            Church management made simple for modern ministry.
                        </h1>

                        <p>
                            Ministry Hub helps churches manage members, visitors,
                            attendance, contributions, announcements, events,
                            care follow-ups, and reports in one organized system.
                        </p>

                        <div className="hero-actions">
                            <Link to="/login" className="hero-primary-btn">
                                Login to Ministry Hub <FaArrowRight />
                            </Link>

                            <a href="#features" className="hero-secondary-btn">
                                Explore Features
                            </a>
                        </div>

                        <div className="hero-trust-row">
                            <img
                                src="/images/sda-logo.png"
                                alt="Seventh-day Adventist Logo"
                            />
                            <span>
                                Serving the church through organized ministry.
                            </span>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-image-card">
                            <img
                                src="/images/login-church-people.png"
                                alt="Church community illustration"
                            />
                        </div>

                        <div className="floating-card floating-card-one">
                            <FaUsers />
                            <div>
                                <strong>Members</strong>
                                <span>Organized records</span>
                            </div>
                        </div>

                        <div className="floating-card floating-card-two">
                            <FaClipboardCheck />
                            <div>
                                <strong>Attendance</strong>
                                <span>Track participation</span>
                            </div>
                        </div>

                        <div className="floating-card floating-card-three">
                            <FaHandHoldingUsd />
                            <div>
                                <strong>Contributions</strong>
                                <span>Tithes & offerings</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="landing-section">
                    <div className="landing-section-header">
                        <span className="hero-eyebrow">Core Features</span>
                        <h2>Everything your church needs in one place.</h2>
                        <p>
                            Designed to support church leaders with simple,
                            organized, and reliable ministry tools.
                        </p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <FaUsers />
                            <h3>Member Management</h3>
                            <p>
                                Register, update, and manage church member
                                profiles and statuses.
                            </p>
                        </div>

                        <div className="feature-card">
                            <FaUserPlus />
                            <h3>Visitor Follow-up</h3>
                            <p>
                                Record visitors and track follow-up actions for
                                stronger care.
                            </p>
                        </div>

                        <div className="feature-card">
                            <FaClipboardCheck />
                            <h3>Attendance Tracking</h3>
                            <p>
                                Track Sabbath services, departments, and member
                                participation.
                            </p>
                        </div>

                        <div className="feature-card">
                            <FaHandHoldingUsd />
                            <h3>Contributions</h3>
                            <p>
                                Record tithes, offerings, donations, and monthly
                                summaries.
                            </p>
                        </div>

                        <div className="feature-card">
                            <FaBullhorn />
                            <h3>Announcements</h3>
                            <p>
                                Create church announcements and WhatsApp-ready
                                messages.
                            </p>
                        </div>

                        <div className="feature-card">
                            <FaChartLine />
                            <h3>Reports</h3>
                            <p>
                                View church health, attendance, finance, and
                                ministry summaries.
                            </p>
                        </div>
                    </div>
                </section>

                <section id="ministry" className="ministry-tools-section">
                    <div>
                        <span className="hero-eyebrow">Spiritual Support</span>
                        <h2>Built with ministry work in mind.</h2>
                        <p>
                            Ministry Hub keeps practical administration close to
                            worship planning, Bible study, and Sabbath service
                            preparation.
                        </p>
                    </div>

                    <div className="ministry-tools-grid">
                        <a
                            href="https://www.bible.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="ministry-tool-card"
                        >
                            <FaBible />
                            <div>
                                <h3>Bible</h3>
                                <p>Quick access to Bible resources.</p>
                            </div>
                        </a>

                        <a
                            href="https://sdahymnals.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="ministry-tool-card"
                        >
                            <FaMusic />
                            <div>
                                <h3>Hymns</h3>
                                <p>Support worship and song planning.</p>
                            </div>
                        </a>
                    </div>
                </section>

                <section id="about" className="about-landing-section">
                    <div className="about-card">
                        <h2>Why Ministry Hub?</h2>
                        <p>
                            Many churches rely on paper records, scattered
                            messages, and manual tracking. Ministry Hub brings
                            those activities into one simple platform so leaders
                            can spend less time searching for information and
                            more time serving people.
                        </p>

                        <Link to="/login" className="hero-primary-btn">
                            Continue to Login <FaArrowRight />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div>
                    <img
                        src="/images/sda-logo.png"
                        alt="Seventh-day Adventist Logo"
                    />
                    <span>© 2026 Ministry Hub. Built for organized ministry.</span>
                </div>

                <Link to="/login">Login</Link>
            </footer>
        </div>
    );
};

export default LandingPage;