// Directly embed in App.jsx to bypass import issues
function InlineAdminPosts({ user }) {
  console.log('InlineAdminPosts rendering - user:', user?.name);

  if (!user?.isAdmin) {
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
      <h1 className="display-4 fw-bold text-success">✅ Inline Component Working!</h1>
      <div className="alert alert-info">
        Component loaded successfully with user: {user.name}
      </div>
      <button 
        className="btn btn-primary btn-lg"
        onClick={() => {
          console.log('Button clicked - this should work');
          alert('Button works! No React errors.');
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default InlineAdminPosts;