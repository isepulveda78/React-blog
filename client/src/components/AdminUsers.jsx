import React, { useState, useEffect } from 'react';

const AdminUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
      console.log('[AdminUsers] Fetching users...');
      const response = await fetch('/api/users', { credentials: 'include' });
      console.log('[AdminUsers] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminUsers] Users received:', data.length);
        setUsers(data);
      } else {
        const errorText = await response.text();
        console.error('[AdminUsers] Error response:', response.status, errorText);
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

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
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

  const changeUserRole = async (userId, newRole) => {
    if (userId === user.id) {
      alert('You cannot change your own role');
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
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

  const openPasswordModal = (userItem) => {
    setSelectedUser(userItem);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword })
      });

      if (response.ok) {
        alert(`Password reset successfully for ${selectedUser.name || selectedUser.username}`);
        setShowPasswordModal(false);
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || 'Failed to reset password');
      }
    } catch (error) {
      setPasswordError('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
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
                  <div className="d-flex flex-column">
                    <select 
                      className="form-select form-select-sm mb-1"
                      value={userItem.role || 'student'}
                      onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                      disabled={userItem.id === user.id}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                    {userItem.isAdmin && (
                      <span className="badge bg-danger">Admin</span>
                    )}
                  </div>
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
                      className="btn btn-outline-info"
                      onClick={() => openPasswordModal(userItem)}
                      title="Reset Password"
                    >
                      Reset Password
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

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Reset Password for {selectedUser?.name || selectedUser?.username}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPasswordModal(false)}
                ></button>
              </div>
              <form onSubmit={handlePasswordReset}>
                <div className="modal-body">
                  {passwordError && (
                    <div className="alert alert-danger">{passwordError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength="6"
                      required
                    />
                    <div className="form-text">Minimum 6 characters</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength="6"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;