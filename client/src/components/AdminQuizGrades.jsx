import React, { useState, useEffect } from 'react';

const AdminQuizGrades = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [quizzes, setQuizzes] = useState([]);

  // Check admin access
  if (!user || (!user.isAdmin && user.role !== 'teacher')) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You need admin or teacher privileges to view quiz grades.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchGrades();
    fetchQuizzes();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quiz-grades', { 
        credentials: 'include',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGrades(data);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch grades');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/audio-quizzes', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const getFilteredGrades = () => {
    if (selectedQuiz === 'all') {
      return grades;
    }
    return grades.filter(grade => grade.quizId === selectedQuiz);
  };

  const getGradeStats = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) return null;

    const scores = filteredGrades.map(g => g.score);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const passRate = Math.round((scores.filter(s => s >= 70).length / scores.length) * 100);

    return {
      totalSubmissions: filteredGrades.length,
      averageScore,
      passRate,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores)
    };
  };

  const navigateBack = () => {
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const stats = getGradeStats();
  const filteredGrades = getFilteredGrades();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading quiz grades...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-5 fw-bold text-primary mb-2">Quiz Grades Dashboard</h1>
              <p className="text-muted">Monitor student performance and quiz statistics</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={navigateBack}>
              ← Back to Admin
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Quiz Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <label htmlFor="quizFilter" className="form-label fw-semibold">
                    Filter by Quiz:
                  </label>
                  <select 
                    id="quizFilter"
                    className="form-select" 
                    value={selectedQuiz} 
                    onChange={(e) => setSelectedQuiz(e.target.value)}
                  >
                    <option value="all">All Quizzes</option>
                    {quizzes.map(quiz => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8">
                  <div className="text-muted small">
                    Showing {filteredGrades.length} grade entries
                    {selectedQuiz !== 'all' && (
                      <span> for "{quizzes.find(q => q.id === selectedQuiz)?.title}"</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="row mb-4">
              <div className="col-md-2 col-6 mb-3">
                <div className="card bg-primary text-white h-100">
                  <div className="card-body text-center">
                    <div className="display-6 mb-2">{stats.totalSubmissions}</div>
                    <div className="small">Total Submissions</div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-6 mb-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body text-center">
                    <div className="display-6 mb-2">{stats.averageScore}%</div>
                    <div className="small">Average Score</div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-6 mb-3">
                <div className="card bg-info text-white h-100">
                  <div className="card-body text-center">
                    <div className="display-6 mb-2">{stats.passRate}%</div>
                    <div className="small">Pass Rate (70%+)</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card bg-warning text-white h-100">
                  <div className="card-body text-center">
                    <div className="h4 mb-2">{stats.highestScore}% / {stats.lowestScore}%</div>
                    <div className="small">Highest / Lowest</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-12 mb-3">
                <div className="card border-primary h-100">
                  <div className="card-body text-center">
                    <button 
                      className="btn btn-primary btn-lg w-100"
                      onClick={() => {
                        window.history.pushState({}, '', '/audio-quizzes');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                    >
                      Manage Quizzes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grades Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-table me-2"></i>
                Grade Records
              </h5>
            </div>
            <div className="card-body">
              {filteredGrades.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h4 className="text-muted">No Quiz Submissions Yet</h4>
                  <p className="text-muted">
                    {selectedQuiz === 'all' 
                      ? "Students haven't submitted any quiz attempts yet."
                      : "No submissions for the selected quiz yet."
                    }
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      window.history.pushState({}, '', '/audio-quizzes');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Create New Quiz
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th scope="col">Student</th>
                        <th scope="col">Quiz</th>
                        <th scope="col">Score</th>
                        <th scope="col">Questions</th>
                        <th scope="col">Correct</th>
                        <th scope="col">Percentage</th>
                        <th scope="col">Date Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((grade) => (
                        <tr key={grade.id}>
                          <td>
                            <div className="fw-semibold">{grade.userName}</div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{maxWidth: '200px'}} title={grade.quizTitle}>
                              {grade.quizTitle}
                            </div>
                          </td>
                          <td>
                            <span className={`badge fs-6 ${
                              grade.score >= 90 ? 'bg-success' : 
                              grade.score >= 80 ? 'bg-info' : 
                              grade.score >= 70 ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {grade.score >= 90 ? 'A' : 
                               grade.score >= 80 ? 'B' : 
                               grade.score >= 70 ? 'C' : 'F'}
                            </span>
                          </td>
                          <td>{grade.totalQuestions}</td>
                          <td>{grade.correctAnswers}</td>
                          <td>
                            <span className={`fw-semibold ${
                              grade.score >= 70 ? 'text-success' : 'text-danger'
                            }`}>
                              {grade.score}%
                            </span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {new Date(grade.createdAt).toLocaleString()}
                            </span>
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
    </div>
  );
};

export default AdminQuizGrades;