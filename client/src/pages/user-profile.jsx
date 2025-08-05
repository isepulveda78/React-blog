import React, { useState, useEffect } from 'react';

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">User Profile</h3>
            </div>
            <div className="card-body">
              {profile ? (
                <div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Name:</strong></label>
                    <p className="form-control-plaintext">{profile.name}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Username:</strong></label>
                    <p className="form-control-plaintext">{profile.username}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Email:</strong></label>
                    <p className="form-control-plaintext">{profile.email}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Account Status:</strong></label>
                    <p className="form-control-plaintext">
                      {profile.approved ? (
                        <span className="badge bg-success">Approved</span>
                      ) : (
                        <span className="badge bg-warning">Pending Approval</span>
                      )}
                    </p>
                  </div>
                  {profile.isAdmin && (
                    <div className="mb-3">
                      <label className="form-label"><strong>Role:</strong></label>
                      <p className="form-control-plaintext">
                        <span className="badge bg-primary">Administrator</span>
                      </p>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label"><strong>Member Since:</strong></label>
                    <p className="form-control-plaintext">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p>No profile information available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;