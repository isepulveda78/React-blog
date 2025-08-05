const WorkingNavigation = ({ user, onLogout }) => {
  console.log("WorkingNavigation rendering with user:", user);
  
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    window.currentUser = null;
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Return plain HTML string that will be injected
  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold text-primary fs-3" href="/" onclick="event.preventDefault(); window.navigateTo('/');">
          Mr. S Teaches
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link ${window.location.pathname === '/' ? 'active fw-bold' : ''}" 
                 href="/" onclick="event.preventDefault(); window.navigateTo('/');">
                Home
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${window.location.pathname === '/blog' ? 'active fw-bold' : ''}" 
                 href="/blog" onclick="event.preventDefault(); window.navigateTo('/blog');">
                Blog & Resources
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${window.location.pathname === '/educational-tools' ? 'active fw-bold' : ''}" 
                 href="/educational-tools" onclick="event.preventDefault(); window.navigateTo('/educational-tools');">
                Educational Tools
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${window.location.pathname === '/city-builder' ? 'active fw-bold' : ''}" 
                 href="/city-builder" onclick="event.preventDefault(); window.navigateTo('/city-builder');">
                City Builder
              </a>
            </li>
          </ul>
          
          <div class="d-flex align-items-center gap-3">
            ${user ? 
              `<span class="navbar-text me-3">Welcome, ${user.name || user.username}!</span>
               <button class="btn btn-outline-danger" onclick="window.handleNavLogout();">Logout</button>` :
              `<a href="/api/auth/google" class="btn btn-primary">Sign In with Google</a>`
            }
          </div>
        </div>
      </div>
    </nav>
  `;
};

// Make navigation functions global
window.navigateTo = (path) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

window.handleNavLogout = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch (e) {
    console.error("Logout error:", e);
  }
  window.currentUser = null;
  localStorage.removeItem("user");
  window.location.href = "/";
};

window.WorkingNavigation = WorkingNavigation;
console.log("WorkingNavigation exported to window:", !!window.WorkingNavigation);