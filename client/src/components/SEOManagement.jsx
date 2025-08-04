const { React } = window;

const SEOManagement = ({ user }) => {
  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">SEO Management</h1>
      <div className="alert alert-info">
        <h4>SEO Tools</h4>
        <p>This section is under development. Full SEO management features coming soon!</p>
      </div>
    </div>
  );
};

window.SEOManagement = SEOManagement;