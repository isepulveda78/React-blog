const { React } = window;

const AdminPosts = ({ user }) => {
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
      <h1 className="display-4 fw-bold text-primary mb-4">Manage Posts</h1>
      <div className="alert alert-info">
        <h4>Posts Management</h4>
        <p>This section is under development. Full post management features coming soon!</p>
      </div>
    </div>
  );
};

window.AdminPosts = AdminPosts;