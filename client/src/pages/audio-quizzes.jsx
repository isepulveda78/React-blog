import React, { useState, useEffect } from 'react';
// Removed React audio player - using iframe approach instead

const AudioQuizzes = ({ user }) => {
  // Use global toast function that's already available
  const toast = window.toast;
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [grades, setGrades] = useState([]);
  const [showGrades, setShowGrades] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [randomizedQuestions, setRandomizedQuestions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState({});

  // Check permissions
  const canCreateQuiz = user && (user.isAdmin || user.role === 'teacher');
  const canEditQuiz = user && (user.isAdmin || user.role === 'teacher');
  const canDeleteQuiz = user && (user.isAdmin || user.role === 'teacher');

  // Form state for creating/editing quizzes
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxAttempts: 1,
    questions: [{ audioUrl: '', question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  // Convert Google Drive sharing URL to direct download URL
  const convertGoogleDriveUrl = (url) => {
    if (!url) return '';
    
    // Extract file ID from Google Drive URL
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    return url; // Return original if not a Google Drive URL
  };



  useEffect(() => {
    fetchQuizzes();
    if (user?.isAdmin || user?.role === 'teacher') {
      fetchGrades();
    }
  }, [user]);

  useEffect(() => {
    // Fetch attempt counts for each quiz when user is authenticated
    if (user?.id && quizzes.length > 0) {
      fetchAttemptCounts().catch(error => {
        console.error('Error fetching attempt counts:', error);
      });
    }
  }, [user?.id, quizzes]);

  const fetchAttemptCounts = async () => {
    if (!user?.id) return;
    
    const attemptData = {};
    for (const quiz of quizzes) {
      try {
        const response = await fetch(`/api/quiz-grades?userId=${user.id}&quizId=${quiz.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const grades = await response.json();
          attemptData[quiz.id] = grades.length;
        }
      } catch (error) {
        console.error(`Error fetching attempts for quiz ${quiz.id}:`, error);
      }
    }
    setQuizAttempts(attemptData);
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/audio-quizzes', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/quiz-grades', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    // Check permissions before allowing delete
    if (!canDeleteQuiz) {
      toast({
        title: "Access Denied",
        description: "Only teachers and admins can delete quizzes.",
        variant: "destructive"
      });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/audio-quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from local state
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
        
        // If this was the selected quiz, clear selection
        if (selectedQuiz?.id === quizId) {
          setSelectedQuiz(null);
        }
        
        // Refresh grades to remove any associated grades
        if (user?.isAdmin || user?.role === 'teacher') {
          fetchGrades();
        }
        
        toast({
          title: "Success",
          description: "Quiz deleted successfully!",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Failed to delete quiz: ${errorData.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Error deleting quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this quiz result? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/quiz-grades/${gradeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from local state
        setGrades(grades.filter(grade => grade.id !== gradeId));
        toast({
          title: "Success",
          description: "Quiz result deleted successfully!",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Failed to delete quiz result: ${errorData.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting quiz result:', error);
      toast({
        title: "Error",
        description: "Error deleting quiz result. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateQuiz = async () => {
    // Check permissions before allowing create/edit
    if (!canCreateQuiz) {
      toast({
        title: "Access Denied",
        description: "Only teachers and admins can create or edit quizzes.",
        variant: "destructive"
      });
      return;
    }

    try {
      const url = editingQuiz ? `/api/audio-quizzes/${editingQuiz.id}` : '/api/audio-quizzes';
      const method = editingQuiz ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedQuiz = await response.json();
        
        if (editingQuiz) {
          // Update existing quiz in list
          setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? savedQuiz : q));
        } else {
          // Add new quiz to list
          setQuizzes([savedQuiz, ...quizzes]);
        }
        
        setShowCreateForm(false);
        setEditingQuiz(null);
        setFormData({
          title: '',
          description: '',
          questions: [{ audioUrl: '', question: '', options: ['', '', '', ''], correctAnswer: 0 }]
        });
        setDriveUrl('');
        
        toast({
          title: "Success",
          description: editingQuiz ? "Quiz updated successfully!" : "Quiz created successfully!",
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Error ${editingQuiz ? 'updating' : 'creating'} quiz: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: `Error ${editingQuiz ? 'updating' : 'creating'} quiz`,
        variant: "destructive"
      });
    }
  };

  const handleEditQuiz = (quiz) => {
    // Check permissions before allowing edit
    if (!canEditQuiz) {
      toast({
        title: "Access Denied",
        description: "Only teachers and admins can edit quizzes.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description,
      maxAttempts: quiz.maxAttempts || 1,
      questions: quiz.questions
    });
    setDriveUrl('');
    setShowCreateForm(true);
  };

  const handleTakeQuiz = async (quiz) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to take audio quizzes.",
        variant: "destructive"
      });
      return;
    }

    // Check attempt limits
    try {
      const response = await fetch(`/api/quiz-grades?userId=${user.id}&quizId=${quiz.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userGrades = await response.json();
        const attemptCount = userGrades.length;
        
        // Check if user has exceeded attempt limit (-1 means unlimited)
        if (quiz.maxAttempts !== -1 && attemptCount >= quiz.maxAttempts) {
          toast({
            title: "Attempt Limit Reached",
            description: `You have already taken this quiz ${attemptCount} time${attemptCount > 1 ? 's' : ''}. Maximum attempts allowed: ${quiz.maxAttempts}.`,
            variant: "destructive"
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking attempt count:', error);
    }

    // Randomize questions when starting the quiz
    const shuffledQuestions = [...quiz.questions];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }
    
    setRandomizedQuestions(shuffledQuestions);
    setSelectedQuiz(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    // Get the current randomized questions from state
    const questions = randomizedQuestions;
    let correctCount = 0;

    questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const result = {
      score,
      correctCount,
      totalQuestions: questions.length,
      answers: quizAnswers,
      questions: randomizedQuestions // Store the actual questions for review
    };

    setQuizResult(result);

    // Save grade to database
    try {
      await fetch('/api/quiz-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          score,
          correctAnswers: correctCount,
          totalQuestions: questions.length
        })
      });
      
      // Update attempt count for this quiz
      if (user?.id) {
        try {
          const response = await fetch(`/api/quiz-grades?userId=${user.id}&quizId=${selectedQuiz.id}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const grades = await response.json();
            setQuizAttempts(prev => ({
              ...prev,
              [selectedQuiz.id]: grades.length
            }));
          }
        } catch (error) {
          console.error('Error updating attempt count:', error);
        }
      }
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { audioUrl: '', question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
          : q
      )
    }));
  };


  
  // Debug logging for permissions
  console.log('[Audio Quizzes] User permissions:', {
    user: user?.name || user?.username || 'Anonymous',
    isAdmin: user?.isAdmin,
    role: user?.role,
    canCreateQuiz,
    canEditQuiz,
    canDeleteQuiz
  });



  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  if (selectedQuiz) {


    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <button 
              className="btn btn-outline-secondary mb-4"
              onClick={() => {
                setSelectedQuiz(null);
                setQuizResult(null);
                setQuizAnswers({});
                setRandomizedQuestions([]);
              }}
            >
              ← Back to Quizzes
            </button>
            
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">{selectedQuiz.title}</h3>
                <p className="text-muted mb-0">{selectedQuiz.description}</p>
                <small className="text-info">
                  Questions are randomized for each attempt
                </small>
              </div>
              <div className="card-body">

                {quizResult ? (
                  <div>
                    <div className="text-center mb-4">
                      <div className={`alert ${quizResult.score >= 70 ? 'alert-success' : 'alert-warning'}`}>
                        <h4>Quiz Complete!</h4>
                        <p className="mb-2">Score: {quizResult.score}%</p>
                        <p className="mb-0">
                          You got {quizResult.correctCount} out of {quizResult.totalQuestions} questions correct
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setSelectedQuiz(null)}
                      >
                        Back to Quizzes
                      </button>
                    </div>

                    {/* Question Review Section */}
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Question Review</h5>
                        <small className="text-muted">See which questions you got right and wrong</small>
                      </div>
                      <div className="card-body">
                        {randomizedQuestions.map((question, index) => {
                          const userAnswer = quizResult.answers[index];
                          const isCorrect = userAnswer === question.correctAnswer;
                          
                          return (
                            <div key={index} className={`border rounded p-3 mb-3 ${isCorrect ? 'border-success bg-light-success' : 'border-danger bg-light-danger'}`}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">Question {index + 1}</h6>
                                <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                  {isCorrect ? '✓ Correct' : '✗ Wrong'}
                                </span>
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
                                      // Check if URL needs proxy (Google Drive, Dropbox, etc.)
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
                                      const originalText = btn.textContent;
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
                                        btn.disabled = false;
                                      });
                                      
                                      audio.addEventListener('error', (e) => {
                                        console.error('Audio error:', e);
                                        btn.textContent = 'Error';
                                        btn.className = 'btn btn-sm btn-outline-danger me-2';
                                        btn.disabled = true;
                                      });
                                      
                                      // Toggle play/pause
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
                                  <small className="text-muted">Click to listen to the audio again</small>
                                </div>
                              </div>
                              
                              <div className="row">
                                {question.options.map((option, optionIndex) => {
                                  let optionClass = 'border-secondary';
                                  let badgeText = '';
                                  let badgeClass = '';
                                  
                                  if (optionIndex === question.correctAnswer) {
                                    optionClass = 'border-success bg-success bg-opacity-10';
                                    badgeText = 'Correct Answer';
                                    badgeClass = 'bg-success';
                                  } else if (optionIndex === userAnswer && !isCorrect) {
                                    optionClass = 'border-danger bg-danger bg-opacity-10';
                                    badgeText = 'Your Answer';
                                    badgeClass = 'bg-danger';
                                  }
                                  
                                  return (
                                    <div key={optionIndex} className="col-md-6 mb-2">
                                      <div className={`border rounded p-2 ${optionClass}`}>
                                        <div className="d-flex justify-content-between align-items-center">
                                          <span>{option}</span>
                                          {badgeText && (
                                            <small className={`badge ${badgeClass}`}>
                                              {badgeText}
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
                    </div>
                  </div>
                ) : (
                  <div>
                    {randomizedQuestions.map((question, index) => (
                      <div key={index} className="mb-4">
                        <h5 className="text-primary mb-3">
                          Question {index + 1} of {randomizedQuestions.length}
                        </h5>
                        <div className="mb-3">
                          <div className="audio-player-wrapper mb-3">
                            <div className="mb-2">
                      
                              <div style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                backgroundColor: '#f8f9fa',
                                marginBottom: '8px'
                              }}>
                                <div className="position-relative">
                                  <div className="d-flex align-items-center" style={{
                                    padding: '10px',
                                    border: '2px solid #007bff',
                                    borderRadius: '8px',
                                    backgroundColor: '#ffffff'
                                  }}>
                                    <button 
                                      className="btn btn-primary me-3"
                                      style={{ minWidth: '80px' }}
                                      onClick={(e) => {
                                        // Check if URL needs proxy (Google Drive, Dropbox, etc.)
                                        const needsProxy = question.audioUrl.includes('drive.google.com') || 
                                                          question.audioUrl.includes('dropbox.com') ||
                                                          question.audioUrl.includes('onedrive.live.com') ||
                                                          question.audioUrl.includes('icloud.com');
                                        
                                        const audioUrl = needsProxy 
                                          ? `/api/audio-proxy?url=${encodeURIComponent(question.audioUrl)}`
                                          : question.audioUrl;
                                        
                                        console.log('[Audio Player] Using', needsProxy ? 'PROXY' : 'DIRECT', 'for:', question.audioUrl);
                                        
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
                                          btn.className = 'btn btn-warning me-3';
                                        });
                                        
                                        audio.addEventListener('pause', () => {
                                          btn.textContent = '▶ Play';
                                          btn.className = 'btn btn-primary me-3';
                                        });
                                        
                                        audio.addEventListener('ended', () => {
                                          btn.textContent = '▶ Play';
                                          btn.className = 'btn btn-primary me-3';
                                        });
                                        
                                        audio.addEventListener('error', (err) => {
                                          console.error('Custom audio error:', err);
                                          btn.textContent = 'Error';
                                          btn.className = 'btn btn-danger me-3';
                                          toast({
                                            title: "Error",
                                            description: "Audio failed to load. Check the URL or try a different file.",
                                            variant: "destructive"
                                          });
                                        });
                                        
                                        audio.play().then(() => {
                                          console.log('Custom audio playing successfully');
                                        }).catch(error => {
                                          console.error('Custom audio play failed:', error);
                                          btn.disabled = false;
                                          btn.textContent = 'Retry';
                                          btn.className = 'btn btn-warning me-3';
                                          toast({
                                            title: "Audio Blocked",
                                            description: `Audio blocked by browser: ${error.message}. Try clicking elsewhere on page first, check browser settings, or try incognito mode.`,
                                            variant: "destructive"
                                          });
                                        });
                                        
                                        // Store audio reference for pause/resume
                                        btn._audioInstance = audio;
                                        
                                        // Handle pause/resume on same button
                                        btn.onclick = (e) => {
                                          if (btn._audioInstance) {
                                            if (btn._audioInstance.paused) {
                                              btn._audioInstance.play();
                                            } else {
                                              btn._audioInstance.pause();
                                            }
                                          }
                                        };
                                      }}
                                    >
                                      ▶ Play
                                    </button>
                           
                                  </div>
                                  <small className="text-muted d-block mt-1">
                                    Custom audio player - Click "Play" to hear the question
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                          <h6 className="mb-3 fw-normal">{question.question}</h6>
                        </div>
                        
                        <div className="row">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="col-md-6 mb-2">
                              <div className="form-check">
                                <input 
                                  className="form-check-input" 
                                  type="radio" 
                                  name={`question-${index}`}
                                  id={`q${index}-opt${optionIndex}`}
                                  checked={quizAnswers[index] === optionIndex}
                                  onChange={() => handleAnswerChange(index, optionIndex)}
                                />
                                <label className="form-check-label" htmlFor={`q${index}-opt${optionIndex}`}>
                                  {option}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-4">
                      <button 
                        className="btn btn-success btn-lg"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < randomizedQuestions.length}
                      >
                        Submit Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Quiz Form
  if (showCreateForm) {
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <button 
              className="btn btn-outline-secondary mb-4"
              onClick={() => setShowCreateForm(false)}
            >
              ← Back to Quizzes
            </button>
            
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">{editingQuiz ? 'Edit Audio Quiz' : 'Create New Audio Quiz'}</h3>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Quiz Title</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quiz title"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter quiz description"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Maximum Attempts</label>
                  <select
                    className="form-select"
                    value={formData.maxAttempts || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                  >
                    <option value={1}>1 attempt</option>
                    <option value={2}>2 attempts</option>
                    <option value={3}>3 attempts</option>
                    <option value={5}>5 attempts</option>
                    <option value={10}>10 attempts</option>
                    <option value={-1}>Unlimited attempts</option>
                  </select>
                  <small className="text-muted">How many times can a student take this quiz?</small>
                </div>

                <div className="alert alert-info mb-4">
                  <h6><i className="fas fa-volume-up me-2"></i>Quick URL Tester</h6>
                  <p className="mb-2"><strong>Test any audio URL before adding it to your quiz:</strong></p>
                  <div className="input-group mb-3">
                    <input 
                      type="url" 
                      className="form-control"
                      placeholder="Paste your audio URL here to test it..."
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary"
                      disabled={!driveUrl}
                      onClick={() => {
                        const needsProxy = driveUrl.includes('drive.google.com') || 
                                          driveUrl.includes('dropbox.com') ||
                                          driveUrl.includes('onedrive.live.com') ||
                                          driveUrl.includes('icloud.com');
                        
                        const audioUrl = needsProxy 
                          ? `/api/audio-proxy?url=${encodeURIComponent(driveUrl)}`
                          : driveUrl;
                        
                        console.log('[URL Tester] Testing:', driveUrl);
                        console.log('[URL Tester] Using proxy:', needsProxy);
                        
                        const audio = new Audio(audioUrl);
                        audio.volume = 0.7;
                        
                        audio.addEventListener('loadeddata', () => {
                          toast({
                            title: "Audio Ready",
                            description: "✅ URL works! You can now use this URL in your quiz questions.",
                            variant: "default"
                          });
                        });
                        
                        audio.addEventListener('error', (err) => {
                          console.error('[URL Tester] Error:', err);
                          toast({
                            title: "URL Failed",
                            description: "❌ This URL doesn't work. Check if the file is publicly shared or try a different format.",
                            variant: "destructive"
                          });
                        });
                        
                        audio.play().then(() => {
                          console.log('[URL Tester] Playing successfully');
                        }).catch(error => {
                          console.error('[URL Tester] Play failed:', error);
                          toast({
                            title: "Audio Blocked",
                            description: "🔇 Browser blocked audio. Click anywhere on this page first to enable audio playback.",
                            variant: "destructive"
                          });
                        });
                      }}
                    >
                      🎵 Test URL
                    </button>
                  </div>
                  {driveUrl && (
                    <small className="text-muted">
                      Ready to test: {driveUrl.length > 50 ? driveUrl.substring(0, 50) + '...' : driveUrl}
                    </small>
                  )}
                </div>

                <div className="alert alert-warning mb-4">
                  <h6>🔧 Audio Play Button Not Working?</h6>
                  <p className="mb-2"><strong>Troubleshooting Tests:</strong></p>
                  <div className="mb-3">
                    <button 
                      className="btn btn-success btn-sm me-2"
                      onClick={() => {
                        // Simple beep test that should always work
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.2);
                        
                        toast({
                          title: "Success",
                          description: "If you heard a beep, your browser audio works! The issue is with your audio URLs or files.",
                          variant: "default"
                        });
                      }}
                    >
                      Test Browser Beep
                    </button>
                    
                    <button 
                      className="btn btn-info btn-sm me-2"
                      onClick={() => {
                        const audio = new Audio('/sounds/button-click.mp3');
                        audio.volume = 0.3;
                        audio.play().then(() => {
                          toast({
                            title: "Success",
                            description: "Local audio works! Problem is with your quiz audio URLs.",
                            variant: "default"
                          });
                        }).catch(error => {
                          toast({
                            title: "Audio Blocked",
                            description: `Audio blocked: ${error.message}. Click anywhere on page first, check browser audio settings, or try refreshing page.`,
                            variant: "destructive"
                          });
                        });
                      }}
                    >
                      Test Local Audio
                    </button>
                    
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => {
                        // Test Google Drive proxy
                        const testUrl = 'https://drive.google.com/file/d/1example/view';
                        const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(testUrl)}`;
                        
                        fetch(proxyUrl)
                          .then(response => {
                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Audio proxy is working! Google Drive/Dropbox URLs will now work.",
                                variant: "default"
                              });
                            } else {
                              toast({
                                title: "Warning",
                                description: "Audio proxy test failed. Check server logs.",
                                variant: "destructive"
                              });
                            }
                          })
                          .catch(error => {
                            toast({
                              title: "Error",
                              description: `Audio proxy error: ${error.message}`,
                              variant: "destructive"
                            });
                          });
                      }}
                    >
                      Test Proxy
                    </button>
                  </div>
                  
                  <div className="bg-light p-2 rounded mb-3">
                    <small><strong>Audio Proxy Solution:</strong><br/>
                    ✅ Google Drive, Dropbox, OneDrive URLs now automatically use proxy<br/>
                    ✅ This bypasses CORS and hotlinking restrictions<br/>
                    ✅ Your cloud storage files should now work!<br/><br/>
                    <strong>Still having issues?</strong><br/>
                    1. <strong>Click somewhere on this page first</strong> (browser requirement)<br/>
                    2. Make sure your cloud file is publicly shared<br/>
                    3. Try the "Test Proxy" button above
                    </small>
                  </div>
                </div>

                <div className="alert alert-info mb-4">
                  <h6><i className="fas fa-info-circle me-2"></i>Audio URL Help</h6>
                  <p className="mb-2"><strong>For Google Drive files:</strong></p>
                  <ol className="mb-3">
                    <li>Share your file and get the sharing link</li>
                    <li>Convert the Google Drive link using the converter below</li>
                    <li>Use the converted direct download link</li>
                  </ol>
                  
                  <div className="bg-light p-3 rounded mb-3">
                    <h6>🔥 NEW: Direct Google Drive Support!</h6>
                    <div className="alert alert-success alert-sm p-2 mb-2">
                      <strong>Just paste your Google Drive sharing link directly!</strong><br/>
                      No conversion needed - the system automatically handles it.
                    </div>
                    
                    <div className="mb-2">
                      <label className="form-label small">Example Google Drive URL:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        readOnly
                        value="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                    </div>
                    
                    <small className="text-muted">
                      <strong>Important:</strong> Make sure your Google Drive file is set to "Anyone with the link can view" in sharing settings.
                    </small>
                  </div>
                  
                  <p className="mb-2"><strong>Working test examples:</strong></p>
                  <ul className="mb-2">
                    <li><code>https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3</code></li>
                    <li><code>https://file-examples.com/storage/fe68c9fa4c07bb91554745a/2017/11/file_example_MP3_700KB.mp3</code></li>
                  </ul>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Questions</h5>
                  <small className="text-muted">Questions will be randomized for each student</small>
                </div>
                {formData.questions.map((question, index) => (
                  <div key={index} className="card mb-3">
                    <div className="card-body">
                      <h6 className="text-primary">Question {index + 1}</h6>
                      
                      <div className="mb-3">
                        <label className="form-label">Audio URL</label>
                        <div className="input-group">
                          <input 
                            type="url" 
                            className="form-control"
                            value={question.audioUrl}
                            onChange={(e) => updateQuestion(index, 'audioUrl', e.target.value)}
                            placeholder="Paste your MP3 URL here - it will appear as an audio player below"
                          />
                          {question.audioUrl && editingQuiz && (
                            <button 
                              className="btn btn-outline-success"
                              type="button"
                              onClick={(e) => {
                                // Use the exact same method that works for students taking quizzes
                                const needsProxy = question.audioUrl.includes('drive.google.com') || 
                                                  question.audioUrl.includes('dropbox.com') ||
                                                  question.audioUrl.includes('onedrive.live.com') ||
                                                  question.audioUrl.includes('icloud.com');
                                
                                const audioUrl = needsProxy 
                                  ? `/api/audio-proxy?url=${encodeURIComponent(question.audioUrl)}`
                                  : question.audioUrl;
                                
                                console.log('[Edit Mode] Using', needsProxy ? 'PROXY' : 'DIRECT', 'for:', question.audioUrl);
                                
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
                                  btn.className = 'btn btn-warning';
                                });
                                
                                audio.addEventListener('pause', () => {
                                  btn.textContent = '▶ Play';
                                  btn.className = 'btn btn-outline-success';
                                });
                                
                                audio.addEventListener('ended', () => {
                                  btn.textContent = '🎵 Play Current Audio';
                                  btn.className = 'btn btn-outline-success';
                                  btn.disabled = false;
                                });
                                
                                audio.addEventListener('error', (error) => {
                                  console.error('[Edit Mode] Audio error:', error);
                                  btn.textContent = 'Error - Click to retry';
                                  btn.className = 'btn btn-outline-danger';
                                  btn.disabled = false;
                                });
                                
                                // Store audio instance on button for play/pause control
                                btn._audioInstance = audio;
                                
                                // Handle click for play/pause toggle
                                btn.onclick = (e) => {
                                  if (btn._audioInstance) {
                                    if (btn._audioInstance.paused) {
                                      btn._audioInstance.play();
                                    } else {
                                      btn._audioInstance.pause();
                                    }
                                  }
                                };
                              }}
                              title="Play the current audio file"
                            >
                              🎵 Play Current Audio
                            </button>
                          )}
                        </div>
                        {question.audioUrl && (
                          <div className="mt-2">
                            <small className="text-muted">
                              {editingQuiz ? '✏️ Editing Mode: ' : ''}Your audio player (this is how students will hear it):
                            </small>
                            {editingQuiz && (
                              <div className="alert alert-info alert-sm mt-2 mb-2">
                                <small>
                                  <strong>🎵 Edit Mode:</strong> Use the green "Play Current Audio" button above to test the current audio file. 
                                  If it doesn't play, click somewhere on the page first (browser requirement).
                                </small>
                              </div>
                            )}
                            <div style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #007bff',
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
                              <div className="d-flex align-items-center" style={{
                                padding: '8px',
                                border: '2px solid #28a745',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff'
                              }}>
                                <button 
                                  className="btn btn-success btn-sm me-2"
                                  onClick={(e) => {
                                    // Check if URL needs proxy (Google Drive, Dropbox, etc.)
                                    const needsProxy = question.audioUrl.includes('drive.google.com') || 
                                                      question.audioUrl.includes('dropbox.com') ||
                                                      question.audioUrl.includes('onedrive.live.com') ||
                                                      question.audioUrl.includes('icloud.com');
                                    
                                    const audioUrl = needsProxy 
                                      ? `/api/audio-proxy?url=${encodeURIComponent(question.audioUrl)}`
                                      : question.audioUrl;
                                    
                                    console.log('[Audio Preview] Original URL:', question.audioUrl);
                                    console.log('[Audio Preview] Using', needsProxy ? 'PROXY' : 'DIRECT');
                                    console.log('[Audio Preview] Final URL:', audioUrl);
                                    
                                    const btn = e.target;
                                    const originalText = btn.textContent;
                                    const originalClass = btn.className;
                                    
                                    btn.disabled = true;
                                    btn.textContent = 'Loading...';
                                    btn.className = 'btn btn-secondary btn-sm me-2';
                                    
                                    // Test if proxy URL works by fetching it first
                                    if (needsProxy) {
                                      console.log('[Audio Preview] Testing proxy URL first...');
                                      fetch(audioUrl)
                                        .then(response => {
                                          console.log('[Audio Preview] Proxy response status:', response.status);
                                          console.log('[Audio Preview] Proxy response headers:', response.headers.get('content-type'));
                                          
                                          if (!response.ok) {
                                            throw new Error(`Proxy failed with status ${response.status}`);
                                          }
                                          
                                          // Now try to play the audio
                                          const audio = new Audio(audioUrl);
                                          audio.volume = 0.6;
                                          
                                          audio.addEventListener('loadstart', () => {
                                            console.log('[Audio Preview] Audio loading started');
                                          });
                                          
                                          audio.addEventListener('loadeddata', () => {
                                            console.log('[Audio Preview] Audio data loaded successfully');
                                            btn.textContent = '▶ Playing';
                                            btn.className = 'btn btn-info btn-sm me-2';
                                          });
                                          
                                          audio.addEventListener('canplay', () => {
                                            console.log('[Audio Preview] Audio can play');
                                          });
                                          
                                          audio.addEventListener('ended', () => {
                                            console.log('[Audio Preview] Audio ended');
                                            btn.textContent = originalText;
                                            btn.className = originalClass;
                                            btn.disabled = false;
                                          });
                                          
                                          audio.addEventListener('error', (err) => {
                                            console.error('[Audio Preview] Audio element error:', err);
                                            console.error('[Audio Preview] Audio error details:', audio.error);
                                            btn.textContent = 'Audio Error';
                                            btn.className = 'btn btn-danger btn-sm me-2';
                                            btn.disabled = false;
                                            
                                            toast({
                                              title: "Audio Error",
                                              description: `Failed to play audio: ${audio.error?.message || 'Unknown audio error'}`,
                                              variant: "destructive"
                                            });
                                          });
                                          
                                          // Attempt to play
                                          return audio.play();
                                        })
                                        .then(() => {
                                          console.log('[Audio Preview] Audio playing successfully via proxy');
                                          toast({
                                            title: "Success", 
                                            description: "Audio is playing! The URL works correctly.",
                                            variant: "default"
                                          });
                                        })
                                        .catch(error => {
                                          console.error('[Audio Preview] Failed:', error);
                                          btn.textContent = 'Failed';
                                          btn.className = 'btn btn-danger btn-sm me-2';
                                          btn.disabled = false;
                                          
                                          toast({
                                            title: "Audio Failed",
                                            description: `Cannot play audio: ${error.message}. Try clicking somewhere on the page first, check if the file is publicly shared, or try a different URL.`,
                                            variant: "destructive"
                                          });
                                        });
                                    } else {
                                      // Direct URL - try playing immediately
                                      console.log('[Audio Preview] Playing direct URL...');
                                      const audio = new Audio(audioUrl);
                                      audio.volume = 0.6;
                                      
                                      audio.addEventListener('loadeddata', () => {
                                        console.log('[Audio Preview] Direct audio loaded');
                                        btn.textContent = '▶ Playing';
                                        btn.className = 'btn btn-info btn-sm me-2';
                                      });
                                      
                                      audio.addEventListener('ended', () => {
                                        btn.textContent = originalText;
                                        btn.className = originalClass;
                                        btn.disabled = false;
                                      });
                                      
                                      audio.addEventListener('error', (err) => {
                                        console.error('[Audio Preview] Direct audio error:', err);
                                        btn.textContent = 'Error';
                                        btn.className = 'btn btn-danger btn-sm me-2';
                                        btn.disabled = false;
                                        
                                        toast({
                                          title: "Audio Error",
                                          description: `Cannot play direct URL: ${err.message || 'Unknown error'}`,
                                          variant: "destructive"
                                        });
                                      });
                                      
                                      audio.play().then(() => {
                                        console.log('[Audio Preview] Direct audio playing');
                                        toast({
                                          title: "Success",
                                          description: "Direct audio URL is working!",
                                          variant: "default"
                                        });
                                      }).catch(error => {
                                        console.error('[Audio Preview] Direct audio play failed:', error);
                                        btn.textContent = 'Blocked';
                                        btn.className = 'btn btn-warning btn-sm me-2';
                                        btn.disabled = false;
                                        
                                        toast({
                                          title: "Audio Blocked",
                                          description: `Browser blocked audio: ${error.message}. Click somewhere on the page first to enable audio.`,
                                          variant: "destructive"
                                        });
                                      });
                                    }
                                  }}
                                >
                                  ▶ Test
                                </button>
                                
                                <div className="flex-grow-1">
                                  <div className="text-muted small">Preview: {question.audioUrl.split('/').pop()}</div>
                                </div>
                              </div>
                            </div>
                            <small className="text-muted d-block mt-1">✓ Audio URL added successfully - students will see this player</small>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Question Text</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          placeholder="Enter the question"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Answer Options</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="input-group mb-2">
                            <span className="input-group-text">
                              <input 
                                type="radio"
                                name={`correct-${index}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                                title="Mark as correct answer"
                              />
                            </span>
                            <input 
                              type="text"
                              className="form-control"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                        <small className="text-muted">Select the radio button next to the correct answer</small>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-center mb-4">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={addQuestion}
                  >
                    + Add Question
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    className="btn btn-success btn-lg me-3"
                    onClick={handleCreateQuiz}
                    disabled={!formData.title || formData.questions.some(q => !q.audioUrl || !q.question)}
                  >
                    {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingQuiz(null);
                      setFormData({
                        title: '',
                        description: '',
                        questions: [{ audioUrl: '', question: '', options: ['', '', '', ''], correctAnswer: 0 }]
                      });
                      setDriveUrl('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grades View for Teachers/Admins
  if (showGrades && canCreateQuiz) {
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <button 
              className="btn btn-outline-secondary mb-4"
              onClick={() => setShowGrades(false)}
            >
              ← Back to Quizzes
            </button>
            
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Student Grades</h3>
              </div>
              <div className="card-body">
                {grades.length === 0 ? (
                  <p className="text-center text-muted">No quiz submissions yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Quiz</th>
                          <th>Score</th>
                          <th>Correct/Total</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade) => (
                          <tr key={grade.id}>
                            <td>{grade.userName}</td>
                            <td>{grade.quizTitle}</td>
                            <td>
                              <span className={`badge ${grade.score >= 70 ? 'bg-success' : 'bg-warning'}`}>
                                {grade.score}%
                              </span>
                            </td>
                            <td>{grade.correctAnswers}/{grade.totalQuestions}</td>
                            <td>{new Date(grade.createdAt).toLocaleDateString()}</td>
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
  }

  // Main Quiz List View
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">Audio Quizzes</h1>
          <p className="lead text-muted">
            Test your listening skills with interactive audio-based quizzes
          </p>
        </div>
      </div>


      {canCreateQuiz && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-primary">
              <div className="card-body text-center">
                <h5 className="card-title">
                  Teacher Tools 
                  <small className="text-muted">
                    ({user?.isAdmin ? 'Admin' : 'Teacher'} Access)
                  </small>
                </h5>
                <div className="btn-group" role="group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create New Quiz
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowGrades(true)}
                  >
                    View Student Grades
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {quizzes.length === 0 ? (
          <div className="col-12 text-center">
            <div className="card">
              <div className="card-body py-5">
                <i className="fas fa-headphones fa-3x text-muted mb-3"></i>
                {!user ? (
                  <>
                    <h4 className="text-muted">Login Required</h4>
                    <p className="text-muted mb-4">
                      Please log in to view and take audio quizzes.
                    </p>
                    <a href="/login" className="btn btn-primary">
                      Login to Continue
                    </a>
                  </>
                ) : (
                  <>
                    <h4 className="text-muted">No Audio Quizzes Available</h4>
                    <p className="text-muted">
                      {canCreateQuiz 
                        ? "Create your first audio quiz to get started!"
                        : "Check back later for new quizzes from your teachers."
                      }
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{quiz.title}</h5>
                  <p className="card-text">{quiz.description}</p>
                  <p className="text-muted small mb-2">
                    <i className="fas fa-question-circle me-1"></i>
                    {quiz.questions?.length || 0} questions
                  </p>
                  {user && (
                    <p className="text-muted small mb-2">
                      {quiz.maxAttempts === -1 
                        ? `Attempts: ${quizAttempts[quiz.id] || 0} (unlimited)`
                        : `Attempts: ${quizAttempts[quiz.id] || 0}/${quiz.maxAttempts || 1}`
                      }
                    </p>
                  )}
                  {canEditQuiz && (
                    <p className="text-info small mb-2">
                      Max attempts: {quiz.maxAttempts === -1 ? 'Unlimited' : quiz.maxAttempts || 1}
                    </p>
                  )}
                  <p className="text-muted small">
                    Created by: {quiz.createdByName}
                  </p>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="d-grid gap-2">
                    {(() => {
                      if (!user) {
                        return (
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => handleTakeQuiz(quiz)}
                            title="Login required to take quizzes"
                          >
                            Login to Take Quiz
                          </button>
                        );
                      }
                      
                      const attemptCount = quizAttempts[quiz.id] || 0;
                      const maxAttempts = quiz.maxAttempts || 1;
                      const canTakeQuiz = maxAttempts === -1 || attemptCount < maxAttempts;
                      
                      return (
                        <button 
                          className={`btn ${canTakeQuiz ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleTakeQuiz(quiz)}
                          disabled={!canTakeQuiz}
                          title={canTakeQuiz ? "Take this quiz" : "Attempt limit reached"}
                        >
                          {canTakeQuiz ? 'Take Quiz' : 'Attempt Limit Reached'}
                        </button>
                      );
                    })()}
                    {canEditQuiz && (
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleEditQuiz(quiz)}
                        title="Edit this quiz"
                      >
                        ✏️ Edit Quiz
                      </button>
                    )}
                    {canDeleteQuiz && (
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        title="Delete this quiz"
                      >
                        🗑️ Delete Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AudioQuizzes;