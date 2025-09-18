import React, { useState, useEffect } from 'react';

const AdminTextQuizGradesDashboard = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [quizzes, setQuizzes] = useState([]);

  // Check admin permissions
  const canViewAllGrades = user && (user.isAdmin || user.role === 'teacher');

  useEffect(() => {
    if (canViewAllGrades) {
      fetchGrades();
      fetchQuizzes();
    }
  }, [canViewAllGrades]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/text-quiz-grades', { 
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
      } else if (response.status === 401) {
        setError('Please log in to view quiz grades.');
      } else if (response.status === 403) {
        setError('Access denied. Admin or teacher privileges required.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch grades');
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Error fetching quiz grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/text-quizzes', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this quiz result?')) {
      return;
    }

    try {
      const response = await fetch(`/api/text-quiz-grades/${gradeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setGrades(grades.filter(grade => grade.id !== gradeId));
        // Show success message
        if (window.toast) {
          window.toast({
            title: "Success",
            description: "Quiz result deleted successfully.",
            variant: "default"
          });
        }
      } else {
        const errorData = await response.json();
        if (window.toast) {
          window.toast({
            title: "Error",
            description: `Failed to delete quiz result: ${errorData.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error deleting quiz result:', error);
      if (window.toast) {
        window.toast({
          title: "Error",
          description: "Error deleting quiz result. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Filter grades by selected quiz
  const filteredGrades = selectedQuiz === 'all' 
    ? grades 
    : grades.filter(grade => grade.quizId === selectedQuiz);

  // Calculate statistics
  const totalAttempts = filteredGrades.length;
  const averageScore = totalAttempts > 0 
    ? Math.round(filteredGrades.reduce((sum, grade) => sum + grade.score, 0) / totalAttempts)
    : 0;
  const passedCount = filteredGrades.filter(grade => grade.score >= 70).length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  if (!canViewAllGrades) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You need admin or teacher privileges to view quiz grades.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading text quiz grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchGrades}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-success mb-4">Text Quiz Grades Dashboard</h1>
          <p className="lead text-muted mb-5">
            Monitor student performance on text-based quiz assessments.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-5">
        <div className="col-md-3">
          <div className="card text-center bg-success text-white">
            <div className="card-body">
              <h3 className="card-title">{totalAttempts}</h3>
              <p className="card-text">Total Attempts</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-info text-white">
            <div className="card-body">
              <h3 className="card-title">{averageScore}%</h3>
              <p className="card-text">Average Score</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-danger text-white">
            <div className="card-body">
              <h3 className="card-title">{passedCount}</h3>
              <p className="card-text">Passed (≥70%)</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-warning text-dark">
            <div className="card-body">
              <h3 className="card-title">{passRate}%</h3>
              <p className="card-text">Pass Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label htmlFor="quizFilter" className="form-label fw-bold">Filter by Quiz:</label>
          <select
            id="quizFilter"
            className="form-select"
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
          >
            <option value="all">All Text Quizzes</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grades Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                Text Quiz Results 
                {selectedQuiz !== 'all' && (
                  <small className="text-muted">
                    - {quizzes.find(q => q.id === selectedQuiz)?.title}
                  </small>
                )}
              </h5>
            </div>
            <div className="card-body">
              {filteredGrades.length === 0 ? (
                <p className="text-center text-muted">No text quiz results found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Quiz Title</th>
                        <th>Score</th>
                        <th>Correct/Total</th>
                        <th>Date Completed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((grade) => (
                        <tr key={grade.id}>
                          <td>
                            <strong>{grade.userName || 'Unknown Student'}</strong>
                          </td>
                          <td>{grade.quizTitle || 'Unknown Quiz'}</td>
                          <td>
                            <span className={`badge ${grade.score >= 70 ? 'bg-success' : 'bg-warning'}`}>
                              {grade.score}%
                            </span>
                          </td>
                          <td>{grade.correctAnswers}/{grade.totalQuestions}</td>
                          <td>
                            <div>{new Date(grade.createdAt).toLocaleDateString()}</div>
                            <small className="text-muted">{new Date(grade.createdAt).toLocaleTimeString()}</small>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteGrade(grade.id)}
                              title="Delete this quiz result"
                            >
                              🗑️ Delete
                            </button>
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

export default AdminTextQuizGradesDashboard;