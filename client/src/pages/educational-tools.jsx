const { React, useState, useEffect } = window;

const EducationalTools = ({ user }) => {
  const [tools, setTools] = useState([
    {
      id: 1,
      title: "Math Calculator",
      description: "Advanced calculator with scientific functions for complex mathematical operations.",
      category: "Mathematics",
      difficulty: "Beginner",
      icon: "🧮",
      features: ["Basic arithmetic", "Scientific functions", "Graphing capabilities", "Step-by-step solutions"]
    },
    {
      id: 2,
      title: "Grammar Checker",
      description: "Comprehensive grammar and spell checking tool for improving writing skills.",
      category: "Language Arts",
      difficulty: "Intermediate",
      icon: "📝",
      features: ["Grammar checking", "Spelling correction", "Style suggestions", "Plagiarism detection"]
    },
    {
      id: 3,
      title: "Science Lab Simulator",
      description: "Virtual laboratory for conducting safe science experiments and observations.",
      category: "Science",
      difficulty: "Advanced",
      icon: "🔬",
      features: ["Virtual experiments", "Data analysis", "Safety protocols", "Lab reports"]
    },
    {
      id: 4,
      title: "Code Playground",
      description: "Interactive coding environment supporting multiple programming languages.",
      category: "Computer Science",
      difficulty: "Intermediate",
      icon: "💻",
      features: ["Multiple languages", "Real-time execution", "Code sharing", "Debugging tools"]
    },
    {
      id: 5,
      title: "History Timeline",
      description: "Interactive timeline tool for exploring historical events and periods.",
      category: "History",
      difficulty: "Beginner",
      icon: "📚",
      features: ["Interactive timeline", "Event details", "Image gallery", "Quiz mode"]
    },
    {
      id: 6,
      title: "Geography Maps",
      description: "Interactive world maps with detailed geographical and political information.",
      category: "Geography",
      difficulty: "Beginner",
      icon: "🌍",
      features: ["Interactive maps", "Country information", "Quiz mode", "Satellite view"]
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', ...new Set(tools.map(tool => tool.category))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || tool.difficulty === selectedDifficulty;
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleToolClick = (tool) => {
    if (!user) {
      alert('Please sign in to access educational tools.');
      return;
    }
    
    if (!user.approved) {
      alert('Your account is pending approval. Please wait for admin approval to access tools.');
      return;
    }
    
    // For now, show an alert. In a real app, this would navigate to the specific tool
    alert(`Opening ${tool.title}... (Tool functionality coming soon!)`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">Educational Tools</h1>
          <p className="lead text-muted">
            Explore our collection of interactive learning tools and resources
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <select
            className="form-select form-select-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <select
            className="form-select form-select-lg"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'All' ? 'All Levels' : difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-3">
        <small className="text-muted">
          Showing {filteredTools.length} of {tools.length} tools
        </small>
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="row">
          {filteredTools.map(tool => (
            <div key={tool.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 shadow-sm hover-shadow-lg transition-all">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <span className="fs-1 me-3">{tool.icon}</span>
                    <div>
                      <h5 className="card-title mb-1">{tool.title}</h5>
                      <span className={`badge bg-${getDifficultyColor(tool.difficulty)} me-2`}>
                        {tool.difficulty}
                      </span>
                      <span className="badge bg-secondary">{tool.category}</span>
                    </div>
                  </div>
                  
                  <p className="card-text text-muted mb-3">
                    {tool.description}
                  </p>
                  
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Features:</h6>
                    <ul className="list-unstyled">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="mb-1">
                          <small>
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {feature}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => handleToolClick(tool)}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="alert alert-info">
            <h4>No tools found</h4>
            <p>
              {searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No educational tools are currently available.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Access Notice */}
      {!user && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="alert alert-info text-center">
              <h5>Want to access these tools?</h5>
              <p className="mb-3">Sign in to unlock our full collection of educational resources.</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                Sign In with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {user && !user.approved && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="alert alert-warning text-center">
              <h5>Account Pending Approval</h5>
              <p className="mb-0">Your account needs admin approval before you can access educational tools.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.EducationalTools = EducationalTools;