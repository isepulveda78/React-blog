import React, { useState, useEffect } from 'react';

const TextQuizzes = ({ user }) => {
  // Use global toast function that's already available
  const toast = window.toast;
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [takingQuiz, setTakingQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Check permissions
  const isAuthenticated = user && user.name;
  const canCreateQuiz = user && (user.isAdmin || user.role === 'teacher');
  const canEditQuiz = user && (user.isAdmin || user.role === 'teacher');
  const canDeleteQuiz = user && (user.isAdmin || user.role === 'teacher');

  console.log('[Text Quizzes] User permissions:', {
    user: user?.name,
    isAdmin: user?.isAdmin,
    role: user?.role,
    canCreateQuiz,
    canEditQuiz,
    canDeleteQuiz
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/text-quizzes', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
        setError('');
      } else if (response.status === 401) {
        setError('Please log in to view quizzes.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Error fetching quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = () => {
    setEditingQuiz({
      id: '',
      title: '',
      description: '',
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
  };

  const saveQuiz = async () => {
    if (!editingQuiz.title.trim()) {
      if (toast) {
        toast({
          title: "Error",
          description: "Quiz title is required.",
          variant: "destructive"
        });
      }
      return;
    }

    if (editingQuiz.questions.length === 0) {
      if (toast) {
        toast({
          title: "Error", 
          description: "At least one question is required.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      const method = editingQuiz.id ? 'PUT' : 'POST';
      const url = editingQuiz.id ? `/api/text-quizzes/${editingQuiz.id}` : '/api/text-quizzes';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingQuiz)
      });

      if (response.ok) {
        fetchQuizzes();
        setEditingQuiz(null);
        if (toast) {
          toast({
            title: "Success",
            description: `Quiz ${editingQuiz.id ? 'updated' : 'created'} successfully.`,
            variant: "default"
          });
        }
      } else {
        const errorData = await response.json();
        if (toast) {
          toast({
            title: "Error",
            description: `Failed to save quiz: ${errorData.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Error saving quiz. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await fetch(`/api/text-quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchQuizzes();
        if (toast) {
          toast({
            title: "Success",
            description: "Quiz deleted successfully.",
            variant: "default"
          });
        }
      } else {
        const errorData = await response.json();
        if (toast) {
          toast({
            title: "Error",
            description: `Failed to delete quiz: ${errorData.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Error deleting quiz. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const startQuiz = (quiz) => {
    if (!isAuthenticated) {
      if (toast) {
        toast({
          title: "Authentication Required",
          description: "Please log in to take quizzes.",
          variant: "destructive"
        });
      }
      return;
    }

    setTakingQuiz(quiz);
    setUserAnswers({});
    setQuizResult(null);
    setShowResults(false);
  };

  const submitQuiz = async () => {
    let correctAnswers = 0;
    const totalQuestions = takingQuiz.questions.length;

    takingQuiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const result = {
      quizId: takingQuiz.id,
      quizTitle: takingQuiz.title,
      userAnswers,
      correctAnswers,
      totalQuestions,
      score,
      passed: score >= 70
    };

    setQuizResult(result);
    setShowResults(true);

    try {
      await fetch('/api/text-quiz-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const addQuestion = () => {
    setEditingQuiz({
      ...editingQuiz,
      questions: [
        ...editingQuiz.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = editingQuiz.questions.filter((_, i) => i !== index);
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  const updateQuestion = (questionIndex, field, value) => {
    const newQuestions = [...editingQuiz.questions];
    if (field === 'question') {
      newQuestions[questionIndex].question = value;
    } else if (field === 'correctAnswer') {
      newQuestions[questionIndex].correctAnswer = parseInt(value);
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.split('-')[1]);
      newQuestions[questionIndex].options[optionIndex] = value;
    }
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading text quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchQuizzes}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking view
  if (takingQuiz && !showResults) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">{takingQuiz.title}</h3>
                <p className="text-muted mb-0">{takingQuiz.description}</p>
              </div>
              <div className="card-body">
                {takingQuiz.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="mb-4">
                    <h5>Question {questionIndex + 1}</h5>
                    <p className="mb-3">{question.question}</p>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`question-${questionIndex}`}
                          id={`q${questionIndex}-opt${optionIndex}`}
                          value={optionIndex}
                          checked={userAnswers[questionIndex] === optionIndex}
                          onChange={(e) => setUserAnswers({
                            ...userAnswers,
                            [questionIndex]: parseInt(e.target.value)
                          })}
                        />
                        <label className="form-check-label" htmlFor={`q${questionIndex}-opt${optionIndex}`}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setTakingQuiz(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitQuiz}
                    disabled={Object.keys(userAnswers).length !== takingQuiz.questions.length}
                  >
                    Submit Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults && quizResult) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header text-center">
                <h3 className="mb-0">Quiz Results</h3>
              </div>
              <div className="card-body text-center">
                <div className={`alert ${quizResult.passed ? 'alert-success' : 'alert-warning'}`}>
                  <h4>Score: {quizResult.score}%</h4>
                  <p>{quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correct</p>
                  <p className="mb-0">
                    {quizResult.passed ? 'Congratulations! You passed!' : 'Keep studying and try again!'}
                  </p>
                </div>
                
                <div className="mt-4">
                  <h5>Review Your Answers:</h5>
                  {takingQuiz.questions.map((question, index) => {
                    const userAnswer = quizResult.userAnswers[index];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={index} className="text-start mb-3 p-3 border rounded">
                        <h6>Question {index + 1}: {question.question}</h6>
                        <p className={`mb-1 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                          Your answer: {question.options[userAnswer]} {isCorrect ? '✓' : '✗'}
                        </p>
                        {!isCorrect && (
                          <p className="text-success mb-0">
                            Correct answer: {question.options[question.correctAnswer]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTakingQuiz(null);
                    setShowResults(false);
                    setQuizResult(null);
                  }}
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz editing view
  if (editingQuiz) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card">
              <div className="card-header">
                <h3>{editingQuiz.id ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Quiz Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                    placeholder="Enter quiz title"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={editingQuiz.description}
                    onChange={(e) => setEditingQuiz({...editingQuiz, description: e.target.value})}
                    placeholder="Enter quiz description"
                  />
                </div>

                <h4>Questions</h4>
                {editingQuiz.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Question {questionIndex + 1}</h5>
                      {editingQuiz.questions.length > 1 && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Question Text</label>
                        <input
                          type="text"
                          className="form-control"
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          placeholder="Enter question"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Answer Options</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="input-group mb-2">
                            <div className="input-group-text">
                              <input
                                className="form-check-input mt-0"
                                type="radio"
                                name={`correct-${questionIndex}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                              />
                            </div>
                            <input
                              type="text"
                              className="form-control"
                              value={option}
                              onChange={(e) => updateQuestion(questionIndex, `option-${optionIndex}`, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                        <small className="text-muted">Select the correct answer with the radio button</small>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-between">
                  <div>
                    <button className="btn btn-outline-primary me-2" onClick={addQuestion}>
                      Add Question
                    </button>
                  </div>
                  <div>
                    <button 
                      className="btn btn-secondary me-2" 
                      onClick={() => setEditingQuiz(null)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={saveQuiz}>
                      {editingQuiz.id ? 'Update Quiz' : 'Create Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz list view
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h1 className="display-4 fw-bold text-primary mb-2">Text Quizzes</h1>
              <p className="lead text-muted">
                Test your knowledge with interactive text-based quizzes.
              </p>
            </div>
            {canCreateQuiz && (
              <button className="btn btn-primary btn-lg" onClick={createQuiz}>
                Create New Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {quizzes.length === 0 ? (
          <div className="col-12 text-center py-5">
            <div className="text-muted">
              <h4>No quizzes available</h4>
              <p>
                {canCreateQuiz 
                  ? "Click 'Create New Quiz' to add your first quiz."
                  : "Check back later for new quizzes."}
              </p>
            </div>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm hover-shadow">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">{quiz.title}</h5>
                  <p className="card-text flex-grow-1">{quiz.description}</p>
                  <div className="text-muted small mb-3">
                    {quiz.questions?.length || 0} questions
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-primary flex-fill"
                      onClick={() => startQuiz(quiz)}
                      disabled={!isAuthenticated}
                    >
                      {!isAuthenticated ? 'Login to Take Quiz' : 'Take Quiz'}
                    </button>
                    {canEditQuiz && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setEditingQuiz(quiz)}
                        title="Edit quiz"
                      >
                        ✏️
                      </button>
                    )}
                    {canDeleteQuiz && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => deleteQuiz(quiz.id)}
                        title="Delete quiz"
                      >
                        🗑️
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

export default TextQuizzes;