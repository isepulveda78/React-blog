const { React } = window;

const AdminUsers = ({ user }) => {
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
      <h1 className="display-4 fw-bold text-primary mb-4">Manage Users</h1>
      <div className="alert alert-info">
        <h4>User Management</h4>
        <p>This section is under development. Full user management features coming soon!</p>
      </div>
    </div>
  );
};

window.AdminUsers = AdminUsers;