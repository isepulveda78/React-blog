const { React, useState, useEffect } = window;

const AdminUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const toggleUserApproval = async (userId, currentApproval) => {
    try {
      const response = await fetch(`/api/users/${userId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved: !currentApproval })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error updating user approval:', error);
    }
  };

  const toggleUserAdmin = async (userId, currentAdmin) => {
    if (userId === user.id) {
      alert('You cannot change your own admin status');
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: !currentAdmin })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error updating user admin status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (userId === user.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">Manage Users</h1>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id}>
                <td>
                  <div className="d-flex align-items-center">
                    {userItem.profileImage && (
                      <img
                        src={userItem.profileImage}
                        alt={userItem.username}
                        className="rounded-circle me-2"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <strong>{userItem.name || userItem.username}</strong>
                      <br />
                      <small className="text-muted">@{userItem.username}</small>
                    </div>
                  </div>
                </td>
                <td>{userItem.email}</td>
                <td>
                  <span className={`badge ${userItem.approved ? 'bg-success' : 'bg-warning'}`}>
                    {userItem.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${userItem.isAdmin ? 'bg-danger' : 'bg-secondary'}`}>
                    {userItem.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className={`btn ${userItem.approved ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => toggleUserApproval(userItem.id, userItem.approved)}
                    >
                      {userItem.approved ? 'Suspend' : 'Approve'}
                    </button>
                    <button 
                      className={`btn ${userItem.isAdmin ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                      onClick={() => toggleUserAdmin(userItem.id, userItem.isAdmin)}
                      disabled={userItem.id === user.id}
                    >
                      {userItem.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => deleteUser(userItem.id)}
                      disabled={userItem.id === user.id}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-5">
          <h4>No users found</h4>
        </div>
      )}
    </div>
  );
};

window.AdminUsers = AdminUsers;