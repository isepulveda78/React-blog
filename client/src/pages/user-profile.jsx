import React, { useState, useEffect } from 'react';

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizGrades, setQuizGrades] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
      fetchQuizGrades();
    }
  }, [user]);

  const fetchQuizGrades = async () => {
    try {
      setGradesLoading(true);
      
      // Fetch user's quiz grades
      const gradesResponse = await fetch(`/api/quiz-grades?userId=${user.id}`, { 
        credentials: 'include' 
      });
      
      // Fetch all quizzes for details
      const quizzesResponse = await fetch('/api/audio-quizzes', { 
        credentials: 'include' 
      });
      
      if (gradesResponse.ok && quizzesResponse.ok) {
        const gradesData = await gradesResponse.json();
        const quizzesData = await quizzesResponse.json();
        
        setQuizGrades(gradesData);
        setQuizzes(quizzesData);
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
    } finally {
      setGradesLoading(false);
    }
  };

  const getQuizDetails = (quizId) => {
    return quizzes.find(quiz => quiz.id === quizId);
  };

  const toggleQuizExpansion = (quizId) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
  };

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

          {/* Quiz Results Section */}
          <div className="card mt-4">
            <div className="card-header">
              <h4 className="card-title mb-0">My Quiz Results</h4>
              <small className="text-muted">Review your quiz performance and learn from your answers</small>
            </div>
            <div className="card-body">
              {gradesLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading quiz results...</span>
                  </div>
                </div>
              ) : quizGrades.length === 0 ? (
                <p className="text-muted">You haven't taken any quizzes yet.</p>
              ) : (
                <div>
                  {quizGrades.map((grade, index) => {
                    const quiz = getQuizDetails(grade.quizId);
                    const isExpanded = expandedQuizId === grade.id;
                    
                    return (
                      <div key={grade.id || index} className="border rounded mb-3">
                        <div className="p-3">
                          <div className="row align-items-center">
                            <div className="col-md-8">
                              <h6 className="mb-1">{grade.quizTitle || 'Unknown Quiz'}</h6>
                              <small className="text-muted d-block">
                                Completed: {new Date(grade.createdAt || grade.completedAt || Date.now()).toLocaleDateString()}
                              </small>
                              <small className="text-muted">
                                Time: {new Date(grade.createdAt || grade.completedAt || Date.now()).toLocaleTimeString()}
                              </small>
                            </div>
                            <div className="col-md-2 text-center">
                              <div className={`badge ${grade.score >= 70 ? 'bg-success' : 'bg-warning'} fs-6`}>
                                {grade.score}%
                              </div>
                            </div>
                            <div className="col-md-2">
                              <button 
                                className="btn btn-sm btn-outline-primary w-100"
                                onClick={() => toggleQuizExpansion(grade.id || index)}
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && quiz && (
                          <div className="border-top bg-light p-3">
                            <h6 className="mb-3">Question Review</h6>
                            {quiz.questions.map((question, qIndex) => {
                              return (
                                <div key={qIndex} className="border rounded p-3 mb-3 bg-white">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-0">Question {qIndex + 1}</h6>
                                    <span className="badge bg-info">Review</span>
                                  </div>
                                  
                                  <p className="mb-2">{question.question}</p>
                                  
                                  {/* Audio player for review */}
                                  <div className="mb-3">
                                    <div className="d-flex align-items-center" style={{
                                      padding: '8px',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '6px',
                                      backgroundColor: '#f8f9fa'
                                    }}>
                                      <button 
                                        className="btn btn-sm btn-outline-primary me-2"
                                        style={{ minWidth: '70px' }}
                                        onClick={(e) => {
                                          const needsProxy = question.audioUrl.includes('drive.google.com') || 
                                                            question.audioUrl.includes('dropbox.com') ||
                                                            question.audioUrl.includes('onedrive.live.com') ||
                                                            question.audioUrl.includes('icloud.com');
                                          
                                          const audioUrl = needsProxy 
                                            ? `/api/audio-proxy?url=${encodeURIComponent(question.audioUrl)}`
                                            : question.audioUrl;
                                          
                                          const audio = new Audio(audioUrl);
                                          audio.volume = 0.7;
                                          
                                          const btn = e.target;
                                          btn.disabled = true;
                                          btn.textContent = 'Loading...';
                                          
                                          audio.addEventListener('loadeddata', () => {
                                            btn.textContent = '▶ Play';
                                            btn.disabled = false;
                                          });
                                          
                                          audio.addEventListener('play', () => {
                                            btn.textContent = '⏸ Pause';
                                            btn.className = 'btn btn-sm btn-warning me-2';
                                          });
                                          
                                          audio.addEventListener('pause', () => {
                                            btn.textContent = '▶ Play';
                                            btn.className = 'btn btn-sm btn-outline-primary me-2';
                                          });
                                          
                                          audio.addEventListener('ended', () => {
                                            btn.textContent = '▶ Replay';
                                            btn.className = 'btn btn-sm btn-outline-primary me-2';
                                          });
                                          
                                          audio.addEventListener('error', (e) => {
                                            console.error('Audio error:', e);
                                            btn.textContent = 'Error';
                                            btn.className = 'btn btn-sm btn-outline-danger me-2';
                                          });
                                          
                                          if (audio.paused) {
                                            audio.play().catch(err => {
                                              console.error('Play error:', err);
                                              btn.textContent = 'Error';
                                              btn.className = 'btn btn-sm btn-outline-danger me-2';
                                            });
                                          } else {
                                            audio.pause();
                                          }
                                        }}
                                      >
                                        ▶ Play
                                      </button>
                                      <small className="text-muted">Listen to the audio</small>
                                    </div>
                                  </div>
                                  
                                  <div className="row">
                                    {question.options.map((option, optionIndex) => {
                                      const isCorrect = optionIndex === question.correctAnswer;
                                      
                                      return (
                                        <div key={optionIndex} className="col-md-6 mb-2">
                                          <div className={`border rounded p-2 ${isCorrect ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}>
                                            <div className="d-flex justify-content-between align-items-center">
                                              <span>{option}</span>
                                              {isCorrect && (
                                                <small className="badge bg-success">
                                                  Correct Answer
                                                </small>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;