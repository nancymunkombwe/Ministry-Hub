import { useEffect, useState } from "react";
import { FaChurch, FaSave, FaSyncAlt, FaUserTie, FaMapMarkerAlt } from "react-icons/fa";
import API from "../api/api";

const emptyProfile = {
    church_name: "", address: "", phone: "", email: "", district: "", conference: "",
    pastor_name: "", pastor_phone: "", first_elder_name: "", first_elder_phone: "",
    clerk_name: "", clerk_phone: "", treasurer_name: "", treasurer_phone: ""
};

const fieldGroups = [
    {
        title: "Church information",
        description: "Basic information used to identify the church.",
        icon: <FaChurch />,
        fields: [
            ["church_name", "Church name", true, "e.g. Example Seventh-day Adventist Church"],
            ["address", "Physical address", false, "Street, area or town"],
            ["phone", "Church phone", false, "Contact number"],
            ["email", "Church email", false, "name@example.com", "email"],
            ["district", "District", false, "Church district"],
            ["conference", "Conference", false, "Local conference"]
        ]
    },
    {
        title: "Church leadership",
        description: "Record key officers for reference. These details do not create user accounts.",
        icon: <FaUserTie />,
        fields: [
            ["pastor_name", "Pastor's name", false, "Full name"],
            ["pastor_phone", "Pastor's phone", false, "Contact number"],
            ["first_elder_name", "First elder's name", false, "Full name"],
            ["first_elder_phone", "First elder's phone", false, "Contact number"],
            ["clerk_name", "Church clerk's name", false, "Full name"],
            ["clerk_phone", "Church clerk's phone", false, "Contact number"],
            ["treasurer_name", "Treasurer's name", false, "Full name"],
            ["treasurer_phone", "Treasurer's phone", false, "Contact number"]
        ]
    }
];

export default function Settings() {
    const [profile, setProfile] = useState(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfile = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await API.get("/church-profile");
            setProfile({ ...emptyProfile, ...(response.data.profile || {}) });
        } catch (err) {
            setError(err.response?.data?.message || "Could not load church profile. Check that the backend is running and the database migration has been applied.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfile((current) => ({ ...current, [name]: value }));
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await API.put("/church-profile", profile);
            setSuccess("Church profile saved successfully.");
            await loadProfile();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save the church profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page page-fade church-settings-page">
            <div className="page-header page-header-row">
                <div>
                    <span className="eyebrow">System configuration</span>
                    <h1>Settings</h1>
                    <p>Manage your church's profile and key leadership details.</p>
                </div>
                <button type="button" className="secondary-btn" onClick={loadProfile} disabled={loading || saving}>
                    <FaSyncAlt /> Refresh
                </button>
            </div>

            <div className="church-settings-note">
                <FaMapMarkerAlt /> <span>Only administrators can edit this profile. Other authorised staff can view it.</span>
            </div>
            {error && <div className="page-error" role="alert">{error}</div>}
            {success && <div className="success-message" role="status">{success}</div>}

            {loading ? <div className="table-card"><p>Loading church profile…</p></div> : (
                <form onSubmit={handleSubmit}>
                    {fieldGroups.map((group) => (
                        <section className="form-card church-settings-card" key={group.title}>
                            <div className="church-settings-section-title">
                                <span className="church-settings-icon">{group.icon}</span>
                                <div><h2>{group.title}</h2><p>{group.description}</p></div>
                            </div>
                            <div className="form-grid church-settings-grid">
                                {group.fields.map(([name, label, required, placeholder, type]) => (
                                    <div className="form-group" key={name}>
                                        <label htmlFor={name}>{label}{required ? " *" : ""}</label>
                                        <input
                                            id={name}
                                            name={name}
                                            type={type || "text"}
                                            value={profile[name] || ""}
                                            onChange={handleChange}
                                            placeholder={placeholder}
                                            required={required}
                                            maxLength={name === "address" ? 255 : 200}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                    <div className="church-settings-actions">
                        <button type="submit" className="primary-btn" disabled={saving}>
                            <FaSave /> {saving ? "Saving…" : "Save Church Profile"}
                        </button>
                    </div>
                </form>
            )}
            <style>{`
                .church-settings-page { padding-bottom: 36px; }
                .church-settings-note { display:flex; align-items:center; gap:10px; padding:13px 16px; margin-bottom:18px; border:1px solid #d9e4ef; border-radius:12px; background:#edf4fa; color:#284765; font-size:14px; }
                .church-settings-card { margin-bottom:20px; }
                .church-settings-section-title { display:flex; align-items:center; gap:14px; margin-bottom:22px; }
                .church-settings-icon { display:flex; align-items:center; justify-content:center; width:44px; height:44px; flex-shrink:0; border-radius:12px; background:var(--primary-soft); color:var(--primary); font-size:18px; }
                .church-settings-section-title h2 { margin:0 0 5px; font-size:19px; }
                .church-settings-section-title p { margin:0; color:var(--muted); font-size:13px; }
                .church-settings-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
                .church-settings-grid .form-group { min-width:0; }
                .church-settings-grid input { width:100%; }
                .church-settings-actions { display:flex; justify-content:flex-end; margin-top:4px; }
                .church-settings-actions button { display:inline-flex; align-items:center; gap:9px; }
                @media(max-width:720px) { .church-settings-grid { grid-template-columns:1fr; } .church-settings-section-title { align-items:flex-start; } }
            `}</style>
        </div>
    );
}
