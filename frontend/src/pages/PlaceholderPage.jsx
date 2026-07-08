const PlaceholderPage = ({ title, description }) => {
    return (
        <div className="page page-fade">
            <div className="page-header">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <div className="empty-card">
                <h3>{title} module</h3>
                <p>This page will be developed next.</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;