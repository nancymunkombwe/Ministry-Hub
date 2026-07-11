import { FaChurch } from "react-icons/fa";

const BrandLogo = ({ size = "normal" }) => {
    return (
        <div className={`brand-logo brand-logo-${size}`}>
            <div className="brand-logo-icon">
                <FaChurch />
            </div>

            <div>
                <h2>Ministry Hub</h2>
                <p>Church Management System</p>
            </div>
        </div>
    );
};

export default BrandLogo;
