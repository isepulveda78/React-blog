import React, { useState, useEffect } from 'react';
// Removed React audio player - using iframe approach instead

const AdminQuizGrades = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    questions: []
  });


  // Show grades for regular users (their own grades) or admin/teacher (all grades)
  const canViewAllGrades = user && (user.isAdmin || user.role === 'teacher');
  const isRegularUser = user && !canViewAllGrades;

  useEffect(() => {
    fetchGrades();
    fetchQuizzes();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      // For regular users, fetch only their grades
      const url = isRegularUser 
        ? `/api/quiz-grades?userId=${user.id}`
        : '/api/quiz-grades';
        
      const response = await fetch(url, { 
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
        setError('Please log in to view your quiz results.');
      } else if (response.status === 403) {
        setError('Access denied. Admin or teacher privileges required.');
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

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setEditFormData({
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        audioUrl: q.audioUrl,
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer
      }))
    });
    setShowEditForm(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/audio-quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
        // Also refresh grades to remove deleted quiz entries
        fetchGrades();
        alert('Quiz deleted successfully!');
      } else {
        const errorData = await response.json();
        alert('Error deleting quiz: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Network error occurred while deleting quiz');
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm('Are you sure you want to delete this quiz result? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/quiz-grades/${gradeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setGrades(grades.filter(grade => grade.id !== gradeId));
        alert('Quiz result deleted successfully!');
      } else {
        const errorData = await response.json();
        alert('Error deleting quiz result: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting quiz result:', err);
      alert('Network error occurred while deleting quiz result');
    }
  };

  const handleUpdateQuiz = async () => {
    try {
      const response = await fetch(`/api/audio-quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedQuiz = await response.json();
        setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? updatedQuiz : q));
        setShowEditForm(false);
        setEditingQuiz(null);
        alert('Quiz updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Error updating quiz: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating quiz:', err);
      alert('Network error occurred while updating quiz');
    }
  };

  const addQuestion = () => {
    setEditFormData({
      ...editFormData,
      questions: [...editFormData.questions, {
        audioUrl: '',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }]
    });
  };

  const removeQuestion = (index) => {
    setEditFormData({
      ...editFormData,
      questions: editFormData.questions.filter((_, i) => i !== index)
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...editFormData.questions];
    if (field === 'options') {
      updatedQuestions[index][field] = value;
    } else {
      updatedQuestions[index][field] = value;
    }
    setEditFormData({
      ...editFormData,
      questions: updatedQuestions
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...editFormData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setEditFormData({
      ...editFormData,
      questions: updatedQuestions
    });
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
              <h1 className="display-5 fw-bold text-primary mb-2">
                {canViewAllGrades ? 'Quiz Grades Dashboard' : 'My Quiz Results'}
              </h1>
              <p className="text-muted">
                {canViewAllGrades ? 'Monitor student performance and quiz statistics' : 'View your quiz scores and progress'}
              </p>
            </div>
            <button className="btn btn-outline-secondary" onClick={navigateBack}>
              ← Back to {canViewAllGrades ? 'Admin' : 'Tools'}
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

          {/* Quiz Management Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                Quiz Management
              </h5>
            </div>
            <div className="card-body">
              {quizzes.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-muted">No quizzes created yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      window.history.pushState({}, '', '/audio-quizzes');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Create First Quiz
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Quiz Title</th>
                        <th>Questions</th>
                        <th>Created By</th>
                        <th>Submissions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map((quiz) => {
                        const quizGrades = grades.filter(g => g.quizId === quiz.id);
                        return (
                          <tr key={quiz.id}>
                            <td>
                              <div className="fw-semibold">{quiz.title}</div>
                              <div className="text-muted small">{quiz.description}</div>
                            </td>
                            <td>{quiz.questions?.length || 0}</td>
                            <td>{quiz.createdByName || 'Unknown'}</td>
                            <td>
                              <span className="badge bg-info">{quizGrades.length}</span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => handleEditQuiz(quiz)}
                                  title="Edit Quiz"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                  title="Delete Quiz"
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
                        {canViewAllGrades && <th scope="col">Actions</th>}
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
                          {canViewAllGrades && (
                            <td>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteGrade(grade.id)}
                                title="Delete this quiz result"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          )}
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

      {/* Edit Quiz Modal */}
      {showEditForm && editingQuiz && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Quiz: {editingQuiz.title}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditForm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Quiz Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                      placeholder="Enter quiz title"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      placeholder="Enter quiz description"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label mb-0">Questions</label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-success"
                        onClick={addQuestion}
                      >
                        <i className="fas fa-plus me-1"></i>Add Question
                      </button>
                    </div>
                    
                    {editFormData.questions.map((question, qIndex) => (
                      <div key={qIndex} className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <span>Question {qIndex + 1}</span>
                          {editFormData.questions.length > 1 && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeQuestion(qIndex)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">Audio URL</label>
                            <input
                              type="url"
                              className="form-control"
                              value={question.audioUrl}
                              onChange={(e) => updateQuestion(qIndex, 'audioUrl', e.target.value)}
                              placeholder="Paste your MP3 URL here - it will appear as an audio player below"
                            />

                            {question.audioUrl && (
                              <div className="mt-2">
                                <small className="text-muted">Audio player preview (how students will see it):</small>
                                <div style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '2px solid #28a745',
                                  borderRadius: '8px',
                                  backgroundColor: '#ffffff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  marginTop: '8px'
                                }}>
                                  <div style={{
                                    textAlign: 'center',
                                    marginBottom: '5px',
                                    color: '#666',
                                    fontSize: '12px'
                                  }}>
                                    Audio Question
                                  </div>
                                  <audio 
                                    controls 
                                    style={{width: '100%', height: '40px'}} 
                                    preload="metadata"
                                    onError={(e) => console.error('Edit audio preview error:', e)}
                                    onLoadedData={(e) => console.log('Edit audio preview loaded:', question.audioUrl)}
                                  >
                                    <source src={question.audioUrl} type="audio/mpeg" />
                                    <source src={question.audioUrl} type="audio/wav" />
                                    <source src={question.audioUrl} type="audio/ogg" />
                                    <div style={{color: 'red', padding: '10px'}}>
                                      Unable to load audio from this URL
                                    </div>
                                  </audio>
                                </div>
                                <small className="text-muted d-block mt-1">✓ Audio URL updated - this is how it will appear to students</small>
                              </div>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label">Question Text</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.question}
                              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                              placeholder="Enter question text"
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label">Answer Options</label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="input-group mb-2">
                                <span className="input-group-text">
                                  <input
                                    type="radio"
                                    name={`correct-${qIndex}`}
                                    checked={question.correctAnswer === oIndex}
                                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                  />
                                </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={option}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                            <small className="text-muted">Select the radio button for the correct answer</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpdateQuiz}
                  disabled={!editFormData.title || editFormData.questions.length === 0}
                >
                  Update Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizGrades;