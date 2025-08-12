import React, { useState, useEffect } from 'react';
// Removed React audio player - using iframe approach instead

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
  const [randomizedQuestions, setRandomizedQuestions] = useState([]);

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
                    {randomizedQuestions.map((question, index) => (
                      <div key={index} className="mb-4">
                        <h5 className="text-primary mb-3">
                          Question {index + 1} of {randomizedQuestions.length}
                        </h5>
                        <div className="mb-3">
                          <div className="audio-player-wrapper mb-3">
                            <div className="mb-2">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <small className="text-muted">Audio URL: {question.audioUrl}</small>
                                <button 
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    console.log('Testing audio URL:', question.audioUrl);
                                    
                                    // Check if URL needs proxy (Google Drive, Dropbox, etc.)
                                    const needsProxy = question.audioUrl.includes('drive.google.com') || 
                                                      question.audioUrl.includes('dropbox.com') ||
                                                      question.audioUrl.includes('onedrive.live.com') ||
                                                      question.audioUrl.includes('icloud.com');
                                    
                                    const audioUrl = needsProxy 
                                      ? `/api/audio-proxy?url=${encodeURIComponent(question.audioUrl)}`
                                      : question.audioUrl;
                                    
                                    console.log('[Audio Test] Using', needsProxy ? 'PROXY' : 'DIRECT', 'for:', question.audioUrl);
                                    
                                    const audio = new Audio(audioUrl);
                                    audio.volume = 0.8;
                                    
                                    // Add event listeners for debugging
                                    audio.addEventListener('loadstart', () => console.log('Direct test: Load started'));
                                    audio.addEventListener('loadeddata', () => console.log('Direct test: Data loaded'));
                                    audio.addEventListener('canplay', () => console.log('Direct test: Can play'));
                                    audio.addEventListener('error', (e) => console.error('Direct test: Error event', e));
                                    
                                    audio.play().then(() => {
                                      console.log('Direct audio test: SUCCESS - Audio is playing');
                                      alert('✅ Audio URL works! The issue might be with the React player.');
                                    }).catch((error) => {
                                      console.error('Direct audio test: FAILED', error);
                                      console.error('Error name:', error.name);
                                      console.error('Error message:', error.message);
                                      alert(`❌ Audio URL failed: ${error.message}\n\nThis could be:\n- Invalid URL\n- CORS policy blocking\n- Network timeout\n- File not found`);
                                    });
                                  }}
                                >
                                  Test URL
                                </button>
                              </div>
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
                                          alert('Audio failed to load. Check the URL or try a different file.');
                                        });
                                        
                                        audio.play().then(() => {
                                          console.log('Custom audio playing successfully');
                                        }).catch(error => {
                                          console.error('Custom audio play failed:', error);
                                          btn.disabled = false;
                                          btn.textContent = 'Retry';
                                          btn.className = 'btn btn-warning me-3';
                                          alert(`Audio blocked by browser: ${error.message}\n\nTry:\n1. Click elsewhere on page first\n2. Check browser settings\n3. Try incognito mode`);
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
                                    
                                    <div className="flex-grow-1">
                                      <div className="text-muted small mb-1">Audio Question</div>
                                      <div className="text-truncate small" title={question.audioUrl}>
                                        {question.audioUrl.split('/').pop() || 'Audio file'}
                                      </div>
                                    </div>
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

                <div className="alert alert-warning mb-4">
                  <h6>🔧 Audio Play Button Not Working?</h6>
                  <p className="mb-2"><strong>Quick Test:</strong></p>
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
                        
                        alert('✅ If you heard a beep, your browser audio works!\n\nThe issue is with your audio URLs or files.');
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
                          alert('✅ Local audio works! Problem is with your quiz audio URLs.');
                        }).catch(error => {
                          alert('❌ Audio blocked: ' + error.message + '\n\n• Click anywhere on page first\n• Check browser audio settings\n• Try refreshing page');
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
                              alert('✅ Audio proxy is working! Google Drive/Dropbox URLs will now work.');
                            } else {
                              alert('⚠️ Audio proxy test failed. Check server logs.');
                            }
                          })
                          .catch(error => {
                            alert('❌ Audio proxy error: ' + error.message);
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
                        <input 
                          type="url" 
                          className="form-control"
                          value={question.audioUrl}
                          onChange={(e) => updateQuestion(index, 'audioUrl', e.target.value)}
                          placeholder="Paste your MP3 URL here - it will appear as an audio player below"
                        />
                        {question.audioUrl && (
                          <div className="mt-2">
                            <small className="text-muted">Your audio player (this is how students will hear it):</small>
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
                                    
                                    console.log('[Audio Preview] Using', needsProxy ? 'PROXY' : 'DIRECT', 'for:', question.audioUrl);
                                    
                                    const audio = new Audio(audioUrl);
                                    audio.volume = 0.6;
                                    
                                    const btn = e.target;
                                    btn.disabled = true;
                                    btn.textContent = 'Loading...';
                                    
                                    audio.addEventListener('loadeddata', () => {
                                      btn.textContent = '▶ Test';
                                      btn.disabled = false;
                                    });
                                    
                                    audio.addEventListener('error', (err) => {
                                      console.error('Preview audio error:', err);
                                      btn.textContent = 'Error';
                                      btn.className = 'btn btn-danger btn-sm me-2';
                                    });
                                    
                                    audio.play().then(() => {
                                      console.log('Preview audio playing');
                                      btn.textContent = '🔊 Playing...';
                                      btn.className = 'btn btn-info btn-sm me-2';
                                    }).catch(error => {
                                      console.error('Preview audio failed:', error);
                                      btn.disabled = false;
                                      btn.textContent = 'Blocked';
                                      btn.className = 'btn btn-warning btn-sm me-2';
                                    });
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