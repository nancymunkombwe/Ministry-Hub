const BrandLogo = ({ size = "normal" }) => {
    return (
        <div className={`brand-logo brand-logo-${size}`}>
            <img
                src="/images/ministry-hub-logo.png"
                alt="Ministry Hub Logo"
                className="brand-logo-image"
            />

            <div>
                <h2>Ministry Hub</h2>
                <p>Church Management System</p>
            </div>
        </div>
    );
};

export default BrandLogo;