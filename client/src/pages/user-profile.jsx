window.UserProfile = function() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  // Profile form state
  const [profileForm, setProfileForm] = React.useState({
    name: '',
    username: '',
    email: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setProfileForm({
          name: userData.name || '',
          username: userData.username || '',
          email: userData.email || ''
        });
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setMessage('Profile updated successfully!');
        
        // Update global user state
        window.currentUser = updatedUser;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h2 className="mb-4">My Profile</h2>

          {message && (
            <div className="alert alert-success alert-dismissible fade show">
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          )}

          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Profile Information Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      minLength="6"
                      required
                    />
                    <div className="form-text">Minimum 6 characters</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      minLength="6"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-warning" disabled={changingPassword}>
                  {changingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Account Information */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Account Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <strong>Account Status:</strong>
                  <span className={`badge ms-2 ${user?.approved ? 'bg-success' : 'bg-warning'}`}>
                    {user?.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div className="col-md-6">
                  <strong>Account Type:</strong>
                  <span className={`badge ms-2 ${user?.isAdmin ? 'bg-primary' : 'bg-secondary'}`}>
                    {user?.isAdmin ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-12">
                  <strong>Member Since:</strong>
                  <span className="ms-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component available via window.UserProfile