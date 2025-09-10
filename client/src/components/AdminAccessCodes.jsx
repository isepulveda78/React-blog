import React, { useState, useEffect } from 'react';

const AdminAccessCodes = ({ user }) => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [newAccessCode, setNewAccessCode] = useState({
    code: '',
    name: '',
    description: '',
    chatroomId: '',
    expiresAt: '',
    maxUses: ''
  });

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>Admin privileges required to access this page.</p>
          <p>Current user: {user ? user.name : 'Not authenticated'}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAccessCodes();
    fetchChatrooms();
  }, []);

  const fetchAccessCodes = async () => {
    try {
      console.log('[AdminAccessCodes] Fetching access codes...');
      const response = await fetch('/api/admin/access-codes', { credentials: 'include' });
      console.log('[AdminAccessCodes] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminAccessCodes] Access codes received:', data);
        setAccessCodes(data);
      } else {
        const errorText = await response.text();
        console.error('[AdminAccessCodes] Error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching access codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatrooms = async () => {
    try {
      console.log('[AdminAccessCodes] Fetching chatrooms for selection...');
      const response = await fetch('/api/admin/chatrooms', { credentials: 'include' });
      console.log('[AdminAccessCodes] Chatrooms response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminAccessCodes] Chatrooms received:', data.length);
        setChatrooms(data);
      } else {
        const errorText = await response.text();
        console.error('[AdminAccessCodes] Chatrooms error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateAccessCode = async (e) => {
    e.preventDefault();
    
    if (!newAccessCode.code.trim()) {
      alert('Please enter an access code');
      return;
    }

    try {
      const codeData = {
        ...newAccessCode,
        maxUses: newAccessCode.maxUses ? parseInt(newAccessCode.maxUses) : null,
        expiresAt: newAccessCode.expiresAt || null
      };

      const response = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(codeData)
      });

      if (response.ok) {
        await fetchAccessCodes();
        setShowCreateModal(false);
        setNewAccessCode({
          code: '',
          name: '',
          description: '',
          chatroomId: '',
          expiresAt: '',
          maxUses: ''
        });
        alert('Access code created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating access code:', error);
      alert('Failed to create access code');
    }
  };

  const handleUpdateAccessCode = async (e) => {
    e.preventDefault();
    
    try {
      const codeData = {
        ...editingCode,
        maxUses: editingCode.maxUses ? parseInt(editingCode.maxUses) : null,
        expiresAt: editingCode.expiresAt || null
      };

      const response = await fetch(`/api/admin/access-codes/${editingCode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(codeData)
      });

      if (response.ok) {
        await fetchAccessCodes();
        setEditingCode(null);
        alert('Access code updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating access code:', error);
      alert('Failed to update access code');
    }
  };

  const handleDeleteAccessCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this access code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/access-codes/${codeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchAccessCodes();
        alert('Access code deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting access code:', error);
      alert('Failed to delete access code');
    }
  };

  const toggleCodeStatus = async (codeId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/access-codes/${codeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        await fetchAccessCodes();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error toggling code status:', error);
      alert('Failed to update code status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date() > new Date(dateString);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading access codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-5 fw-bold text-primary">Manage Access Codes</h1>
              <p className="lead text-muted">Create and manage access codes for chatroom entry</p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowCreateModal(true)}
              data-testid="button-create-access-code"
            >
              <i className="fas fa-plus me-2"></i>
              Create Access Code
            </button>
          </div>

          {accessCodes.length === 0 ? (
            <div className="alert alert-info text-center py-5">
              <h4>No Access Codes Created</h4>
              <p>Create access codes to control who can join chatrooms.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Access Code
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Chatroom</th>
                    <th>Uses</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessCodes.map((code) => {
                    const chatroom = chatrooms.find(c => c.id === code.chatroomId);
                    const expired = isExpired(code.expiresAt);
                    const usageLimitReached = code.maxUses && code.currentUses >= code.maxUses;
                    
                    return (
                      <tr key={code.id}>
                        <td>
                          <code className="bg-light p-2 rounded" data-testid={`text-code-${code.id}`}>
                            {code.code}
                          </code>
                        </td>
                        <td data-testid={`text-name-${code.id}`}>
                          {code.name || <em className="text-muted">No name</em>}
                        </td>
                        <td data-testid={`text-chatroom-${code.id}`}>
                          {chatroom ? chatroom.name : <em className="text-muted">Any chatroom</em>}
                        </td>
                        <td data-testid={`text-uses-${code.id}`}>
                          {code.currentUses || 0}
                          {code.maxUses ? ` / ${code.maxUses}` : ' / ∞'}
                        </td>
                        <td data-testid={`text-expires-${code.id}`}>
                          <span className={expired ? 'text-danger' : ''}>
                            {formatDate(code.expiresAt)}
                            {expired && <i className="fas fa-exclamation-triangle ms-1"></i>}
                          </span>
                        </td>
                        <td data-testid={`status-${code.id}`}>
                          <span className={`badge ${
                            !code.isActive ? 'bg-secondary' :
                            expired || usageLimitReached ? 'bg-danger' : 'bg-success'
                          }`}>
                            {!code.isActive ? 'Inactive' :
                             expired ? 'Expired' :
                             usageLimitReached ? 'Limit Reached' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setEditingCode(code)}
                              data-testid={`button-edit-${code.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`btn btn-sm ${code.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => toggleCodeStatus(code.id, code.isActive)}
                              data-testid={`button-toggle-${code.id}`}
                            >
                              <i className={`fas ${code.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteAccessCode(code.id)}
                              data-testid={`button-delete-${code.id}`}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Access Code</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateAccessCode}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Access Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAccessCode.code}
                        onChange={(e) => setNewAccessCode({...newAccessCode, code: e.target.value.toUpperCase()})}
                        placeholder="Enter access code"
                        maxLength="20"
                        required
                        data-testid="input-code"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">&nbsp;</label>
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setNewAccessCode({...newAccessCode, code: generateRandomCode()})}
                        data-testid="button-generate-code"
                      >
                        Generate Random
                      </button>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAccessCode.name}
                        onChange={(e) => setNewAccessCode({...newAccessCode, name: e.target.value})}
                        placeholder="Optional code name"
                        data-testid="input-name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Chatroom</label>
                      <select
                        className="form-select"
                        value={newAccessCode.chatroomId}
                        onChange={(e) => setNewAccessCode({...newAccessCode, chatroomId: e.target.value})}
                        data-testid="select-chatroom"
                      >
                        <option value="">Any chatroom</option>
                        {chatrooms.map(chatroom => (
                          <option key={chatroom.id} value={chatroom.id}>
                            {chatroom.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newAccessCode.description}
                        onChange={(e) => setNewAccessCode({...newAccessCode, description: e.target.value})}
                        placeholder="Optional description"
                        data-testid="input-description"
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Max Uses</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newAccessCode.maxUses}
                        onChange={(e) => setNewAccessCode({...newAccessCode, maxUses: e.target.value})}
                        placeholder="Unlimited"
                        min="1"
                        data-testid="input-max-uses"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Expires At</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={newAccessCode.expiresAt}
                        onChange={(e) => setNewAccessCode({...newAccessCode, expiresAt: e.target.value})}
                        data-testid="input-expires-at"
                      />
                    </div>
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    data-testid="button-submit-create"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Create Access Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCode && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Access Code</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingCode(null)}
                ></button>
              </div>
              <form onSubmit={handleUpdateAccessCode}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Access Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingCode.code}
                        onChange={(e) => setEditingCode({...editingCode, code: e.target.value.toUpperCase()})}
                        placeholder="Enter access code"
                        maxLength="20"
                        required
                        data-testid="input-edit-code"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingCode.name}
                        onChange={(e) => setEditingCode({...editingCode, name: e.target.value})}
                        placeholder="Optional code name"
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Chatroom</label>
                      <select
                        className="form-select"
                        value={editingCode.chatroomId || ''}
                        onChange={(e) => setEditingCode({...editingCode, chatroomId: e.target.value})}
                        data-testid="select-edit-chatroom"
                      >
                        <option value="">Any chatroom</option>
                        {chatrooms.map(chatroom => (
                          <option key={chatroom.id} value={chatroom.id}>
                            {chatroom.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editingCode.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditingCode({...editingCode, isActive: e.target.value === 'true'})}
                        data-testid="select-edit-status"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={editingCode.description}
                        onChange={(e) => setEditingCode({...editingCode, description: e.target.value})}
                        placeholder="Optional description"
                        data-testid="input-edit-description"
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Max Uses</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editingCode.maxUses || ''}
                        onChange={(e) => setEditingCode({...editingCode, maxUses: e.target.value})}
                        placeholder="Unlimited"
                        min="1"
                        data-testid="input-edit-max-uses"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Expires At</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editingCode.expiresAt ? new Date(editingCode.expiresAt).toISOString().slice(0, -1) : ''}
                        onChange={(e) => setEditingCode({...editingCode, expiresAt: e.target.value})}
                        data-testid="input-edit-expires-at"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingCode(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    data-testid="button-submit-edit"
                  >
                    <i className="fas fa-save me-2"></i>
                    Update Access Code
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

export default AdminAccessCodes;