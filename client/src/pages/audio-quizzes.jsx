import React, { useState, useEffect } from 'react';
import ReactAudioPlayer from 'react-audio-player';

const AudioQuizzes = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [grades, setGrades] = useState([]);
  const [showGrades, setShowGrades] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Form state for creating/editing quizzes
  const [formData, setFormData] = useState({
    title: '',
    description: '',
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



  // Advanced audio interaction system to prevent browser muting
  const unlockAudio = async () => {
    console.log('🔓 unlockAudio function called!');
    
    try {
      console.log('🔓 Starting audio unlock process...');
      
      // Simple immediate unlock first
      setAudioUnlocked(true);
      console.log('✅ Audio state marked as unlocked');
      
      // Method 1: Create audio context and play silent tone
      if (window.AudioContext || window.webkitAudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created, state:', audioContext.state);
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('Audio context resumed');
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0; // Silent
        oscillator.frequency.value = 440;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        console.log('Silent oscillator played');
      }
      
      // Method 2: Create and play a silent audio element
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IAAAAAEAAQAAEAAAAgACABAAGQAAAWEBAAABAAATAAAKAAIAmZmZAAABAAA=';
      audio.volume = 0.01;
      audio.muted = false;
      
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Silent audio played successfully');
          audio.pause();
        }
      } catch (e) {
        console.log('Silent audio play failed:', e.message);
      }
      
      // Method 3: Force all audio elements to unmute with a delay
      setTimeout(() => {
        const audioElements = document.querySelectorAll('audio');
        console.log('Found', audioElements.length, 'audio elements to unlock');
        
        audioElements.forEach((audioEl, index) => {
          console.log(`Unlocking audio element ${index + 1}`);
          audioEl.muted = false;
          audioEl.volume = 0.8;
          
          // Force properties
          Object.defineProperty(audioEl, 'muted', {
            value: false,
            writable: true
          });
          
          // Add persistent event listeners
          const forceUnmute = () => {
            audioEl.muted = false;
            audioEl.volume = 0.8;
          };
          
          ['loadstart', 'canplay', 'play', 'mouseenter', 'mouseover', 'focus', 'click'].forEach(eventType => {
            audioEl.addEventListener(eventType, forceUnmute, { passive: true });
          });
        });
      }, 100);
      
      console.log('✅ Audio unlocked successfully!');
      alert('Audio unlocked! Try playing audio now.');
      
    } catch (error) {
      console.error('❌ Audio unlock failed:', error);
      alert('Audio unlock attempt completed (some features may be limited by browser)');
    }
  };

  const initializeAudio = (audioElement) => {
    if (!audioElement) return;
    
    // Remove all existing event listeners to start fresh
    const newAudio = audioElement.cloneNode(true);
    audioElement.parentNode.replaceChild(newAudio, audioElement);
    
    // Force initial settings
    setTimeout(() => {
      newAudio.muted = false;
      newAudio.volume = 0.8;
      newAudio.setAttribute('muted', 'false');
    }, 100);
    
    return newAudio;
  };

  const forceUnmute = (audioElement) => {
    if (audioElement) {
      audioElement.muted = false;
      audioElement.volume = 0.8;
      audioElement.removeAttribute('muted');
      audioElement.setAttribute('volume', '0.8');
      console.log('Force unmute applied - muted:', audioElement.muted, 'volume:', audioElement.volume);
    }
  };

  // Comprehensive event handlers that aggressively prevent muting
  const audioEventHandlers = {
    onLoadedData: (e) => {
      forceUnmute(e.target);
      // Set up continuous monitoring
      const intervalId = setInterval(() => {
        if (e.target.muted) {
          e.target.muted = false;
          e.target.volume = 0.8;
        }
      }, 50);
      e.target.setAttribute('data-interval', intervalId);
    },
    onCanPlay: (e) => forceUnmute(e.target),
    onClick: (e) => {
      e.preventDefault();
      forceUnmute(e.target);
      if (e.target.paused) {
        e.target.play().catch(console.error);
      } else {
        e.target.pause();
      }
    },
    onPlay: (e) => forceUnmute(e.target),
    onPause: (e) => forceUnmute(e.target),
    onVolumeChange: (e) => {
      if (e.target.muted) {
        setTimeout(() => {
          e.target.muted = false;
          e.target.volume = 0.8;
        }, 1);
      }
    },
    onMouseEnter: (e) => forceUnmute(e.target),
    onMouseOver: (e) => forceUnmute(e.target),
    onFocus: (e) => forceUnmute(e.target)
  };

  useEffect(() => {
    fetchQuizzes();
    if (user?.isAdmin || user?.role === 'teacher') {
      fetchGrades();
    }
  }, [user]);

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

  const handleCreateQuiz = async () => {
    try {
      const response = await fetch('/api/audio-quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newQuiz = await response.json();
        setQuizzes([newQuiz, ...quizzes]);
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          questions: [{ audioUrl: '', question: '', options: ['', '', '', ''], correctAnswer: 0 }]
        });
        alert('Quiz created successfully!');
      } else {
        const error = await response.json();
        alert('Error creating quiz: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz');
    }
  };

  const handleTakeQuiz = (quiz) => {
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
    const questions = selectedQuiz.questions;
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
      answers: quizAnswers
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

  const canCreateQuiz = user?.isAdmin || user?.role === 'teacher';

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
              onClick={() => setSelectedQuiz(null)}
            >
              ← Back to Quizzes
            </button>
            
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">{selectedQuiz.title}</h3>
                <p className="text-muted mb-0">{selectedQuiz.description}</p>
              </div>
              <div className="card-body">
                {quizResult ? (
                  <div className="text-center">
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
                ) : (
                  <div>
                    {selectedQuiz.questions.map((question, index) => (
                      <div key={index} className="mb-4">
                        <div className="mb-3">
                          <div className="audio-player-wrapper mb-3">
                            {!audioUnlocked && (
                              <div className="alert alert-warning mb-3">
                                <div className="d-flex align-items-center">
                                  <button 
                                    className="btn btn-warning me-3"
                                    onClick={() => {
                                      console.log('🔓 Unlock button clicked!');
                                      unlockAudio();
                                    }}
                                  >
                                    🔓 Unlock Audio
                                  </button>
                                  <small>
                                    Click to enable audio playback and prevent browser muting issues
                                  </small>
                                </div>
                              </div>
                            )}
                            
                            <div className="bg-info p-2 mb-2 rounded">
                              <small className="text-white">🎵 React Audio Player</small>
                            </div>
                            <ReactAudioPlayer
                              src={question.audioUrl}
                              controls
                              volume={0.8}
                              muted={false}
                              preload="metadata"
                              style={{ 
                                width: '100%', 
                                marginBottom: '10px',
                                backgroundColor: '#f8f9fa',
                                border: '2px solid #007bff',
                                borderRadius: '5px'
                              }}
                              onError={(e) => {
                                console.error('ReactAudioPlayer error for:', question.audioUrl, e);
                              }}
                              onCanPlay={() => {
                                console.log('ReactAudioPlayer ready to play MP3:', question.audioUrl);
                              }}
                              onLoadStart={() => {
                                console.log('ReactAudioPlayer loading MP3 started:', question.audioUrl);
                              }}
                              onPlay={() => {
                                console.log('ReactAudioPlayer started playing MP3');
                                // Force unmute on play
                                const audio = document.querySelector('audio');
                                if (audio) {
                                  console.log('Setting audio unmuted and volume to 0.8');
                                  audio.muted = false;
                                  audio.volume = 0.8;
                                }
                              }}
                              onPause={() => {
                                console.log('ReactAudioPlayer paused');
                              }}
                              onVolumeChange={() => {
                                const audio = document.querySelector('audio');
                                if (audio) {
                                  console.log('Volume changed - muted:', audio.muted, 'volume:', audio.volume);
                                }
                              }}
                            />
                            <div className="audio-error alert alert-warning" style={{display: 'none'}}>
                              <small>
                                <strong>Audio Error:</strong> Could not load audio file. 
                                Please check if the URL is valid: <br/>
                                <a href={question.audioUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                  {question.audioUrl}
                                </a>
                              </small>
                            </div>
                          </div>
                          <h5>{question.question}</h5>
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
                        disabled={Object.keys(quizAnswers).length < selectedQuiz.questions.length}
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
                <h3 className="mb-0">Create New Audio Quiz</h3>
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
                
                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter quiz description"
                    rows="3"
                  />
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
                    <h6>Google Drive Link Converter</h6>
                    <div className="mb-2">
                      <label className="form-label small">Google Drive sharing link:</label>
                      <input 
                        type="url" 
                        className="form-control form-control-sm"
                        placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small">Direct download link:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        readOnly
                        value={convertGoogleDriveUrl(driveUrl)}
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                    <small className="text-muted">Copy the direct download link and paste it in your quiz questions.</small>
                  </div>
                  
                  <p className="mb-2"><strong>Working test examples:</strong></p>
                  <ul className="mb-2">
                    <li><code>https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3</code></li>
                    <li><code>https://file-examples.com/storage/fe68c9fa4c07bb91554745a/2017/11/file_example_MP3_700KB.mp3</code></li>
                  </ul>
                </div>

                <h5>Questions</h5>
                {formData.questions.map((question, index) => (
                  <div key={index} className="card mb-3">
                    <div className="card-body">
                      <h6>Question {index + 1}</h6>
                      
                      <div className="mb-3">
                        <label className="form-label">Audio URL</label>
                        <input 
                          type="url" 
                          className="form-control"
                          value={question.audioUrl}
                          onChange={(e) => updateQuestion(index, 'audioUrl', e.target.value)}
                          placeholder="https://example.com/audio.mp3"
                        />
                        {question.audioUrl && (
                          <div className="mt-2">
                            <small className="text-muted">Test audio:</small>
                            <div className="bg-success p-1 mb-1 rounded">
                              <small className="text-white">🎵 React Audio Preview</small>
                            </div>
                            <ReactAudioPlayer
                              src={question.audioUrl}
                              controls
                              volume={0.8}
                              muted={false}
                              style={{ 
                                width: '100%', 
                                height: '40px', 
                                display: 'block', 
                                marginTop: '5px',
                                backgroundColor: '#f8f9fa',
                                border: '2px solid #28a745',
                                borderRadius: '5px'
                              }}
                              onError={() => {
                                console.error('ReactAudioPlayer preview error:', question.audioUrl);
                              }}
                              onCanPlay={() => {
                                console.log('ReactAudioPlayer preview loaded');
                              }}
                              onLoadStart={() => {
                                console.log('ReactAudioPlayer preview loading started');
                              }}
                            />
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
                    Create Quiz
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateForm(false)}
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

      {/* Audio Test Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <h6><i className="fas fa-volume-up me-2"></i>Audio Test</h6>
            <p className="mb-2">Test your audio before taking quizzes:</p>
            <audio 
              controls 
              className="w-100"
              style={{height: '40px'}}
              muted={false}
              onLoadedData={(e) => {
                e.target.muted = false;
                e.target.volume = 0.8;
              }}
              onCanPlay={(e) => {
                e.target.muted = false;
              }}
              onClick={(e) => {
                e.target.muted = false;
                e.target.volume = 0.8;
              }}
              onPlay={(e) => {
                e.target.muted = false;
                e.target.volume = 0.8;
              }}
            >
              <source src="https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3" type="audio/mpeg" />
              <source src="https://file-examples.com/storage/fe68c9fa4c07bb91554745a/2017/11/file_example_MP3_700KB.mp3" type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
            <small className="text-muted">If you can hear the test audio, your browser supports audio playback for quizzes.</small>
          </div>
        </div>
      </div>

      {canCreateQuiz && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-primary">
              <div className="card-body text-center">
                <h5 className="card-title">Teacher Tools</h5>
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
                <h4 className="text-muted">No Audio Quizzes Available</h4>
                <p className="text-muted">
                  {canCreateQuiz 
                    ? "Create your first audio quiz to get started!"
                    : "Check back later for new quizzes from your teachers."
                  }
                </p>
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
                  <p className="text-muted small mb-3">
                    <i className="fas fa-question-circle me-1"></i>
                    {quiz.questions?.length || 0} questions
                  </p>
                  <p className="text-muted small">
                    Created by: {quiz.createdByName}
                  </p>
                </div>
                <div className="card-footer bg-transparent">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => handleTakeQuiz(quiz)}
                  >
                    Take Quiz
                  </button>
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