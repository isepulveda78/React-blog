import { useState, useEffect } from 'react';

export default function AdminChatrooms({ user }) {
  const [chatrooms, setChatrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newChatroom, setNewChatroom] = useState({
    name: '',
    description: '',
    invitedUserIds: []
  });

  useEffect(() => {
    fetchChatrooms();
    fetchUsers();
  }, []);

  const fetchChatrooms = async () => {
    try {
      console.log('[AdminChatrooms] Fetching chatrooms...');
      const response = await fetch('/api/admin/chatrooms', { credentials: 'include' });
      console.log('[AdminChatrooms] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminChatrooms] Chatrooms received:', data);
        setChatrooms(data);
      } else {
        const errorText = await response.text();
        console.error('[AdminChatrooms] Error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('[AdminChatrooms] Fetching users for invitation list...');
      const response = await fetch('/api/users', { credentials: 'include' });
      console.log('[AdminChatrooms] Users response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminChatrooms] Users received:', data.length);
        setUsers(data.filter(u => !u.isAdmin)); // Don't include admins in invitation list
      } else {
        const errorText = await response.text();
        console.error('[AdminChatrooms] Users error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateChatroom = async (e) => {
    e.preventDefault();
    
    if (!newChatroom.name.trim()) {
      alert('Please enter a chatroom name');
      return;
    }

    try {
      const response = await fetch('/api/admin/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChatroom)
      });

      if (response.ok) {
        await fetchChatrooms();
        setShowCreateModal(false);
        setNewChatroom({ name: '', description: '', invitedUserIds: [] });
        alert('Chatroom created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating chatroom:', error);
      alert('Failed to create chatroom');
    }
  };

  const handleDeleteChatroom = async (chatroomId, chatroomName) => {
    if (!confirm(`Are you sure you want to delete the chatroom "${chatroomName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chatrooms/${chatroomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchChatrooms();
        alert('Chatroom deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting chatroom:', error);
      alert('Failed to delete chatroom');
    }
  };

  const toggleChatroomStatus = async (chatroomId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/chatrooms/${chatroomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        await fetchChatrooms();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating chatroom status:', error);
      alert('Failed to update chatroom status');
    }
  };

  const handleUserInviteChange = (userId, checked) => {
    if (checked) {
      setNewChatroom(prev => ({
        ...prev,
        invitedUserIds: [...prev.invitedUserIds, userId]
      }));
    } else {
      setNewChatroom(prev => ({
        ...prev,
        invitedUserIds: prev.invitedUserIds.filter(id => id !== userId)
      }));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-comments me-2"></i>
          Chatroom Management
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Create Chatroom
        </button>
      </div>

      {/* Chatrooms List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Active Chatrooms ({chatrooms.length})</h5>
            </div>
            <div className="card-body">
              {chatrooms.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No chatrooms created yet</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create Your First Chatroom
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Invited Users</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chatrooms.map(chatroom => (
                        <tr key={chatroom.id}>
                          <td>
                            <strong>{chatroom.name}</strong>
                          </td>
                          <td>
                            {chatroom.description || <em className="text-muted">No description</em>}
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {chatroom.invitedUserIds?.length || 0} users
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${chatroom.isActive ? 'bg-success' : 'bg-secondary'}`}>
                              {chatroom.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(chatroom.createdAt).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className={`btn btn-outline-${chatroom.isActive ? 'warning' : 'success'}`}
                                onClick={() => toggleChatroomStatus(chatroom.id, chatroom.isActive)}
                                title={chatroom.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <i className={`fas fa-${chatroom.isActive ? 'pause' : 'play'}`}></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteChatroom(chatroom.id, chatroom.name)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Chatroom Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Chatroom</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateChatroom}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Chatroom Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={newChatroom.name}
                      onChange={(e) => setNewChatroom(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter chatroom name"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newChatroom.description}
                      onChange={(e) => setNewChatroom(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description for the chatroom"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Invite Users</label>
                    <div className="border p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {users.length === 0 ? (
                        <p className="text-muted mb-0">No users available to invite</p>
                      ) : (
                        users.map(user => (
                          <div key={user.id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={newChatroom.invitedUserIds.includes(user.id)}
                              onChange={(e) => handleUserInviteChange(user.id, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`user-${user.id}`}>
                              {user.name} ({user.email})
                              <span className={`badge ms-2 ${user.role === 'student' ? 'bg-primary' : 'bg-info'}`}>
                                {user.role || 'student'}
                              </span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <small className="form-text text-muted">
                      Selected users will be able to join this chatroom
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Create Chatroom
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}