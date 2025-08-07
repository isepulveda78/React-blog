import React, { useState, useEffect, useRef } from 'react';

const ListenToType = ({ user }) => {
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [feedback, setFeedback] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  // Chat functionality
  const [chatName, setChatName] = useState('');
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [availableChatrooms, setAvailableChatrooms] = useState([]);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  
  const audioRef = useRef(null);
  const chatMessagesRef = useRef(null);
  
  // Sample texts for different difficulty levels
  const texts = {
    easy: [
      'The cat sat on the mat.',
      'I like to eat pizza.',
      'The sun is bright today.',
      'Dogs are good friends.',
      'We play in the park.',
      'Books are fun to read.',
      'I love my family.',
      'The bird can fly high.'
    ],
    medium: [
      'Learning new skills takes practice and patience.',
      'Technology helps us connect with people around the world.',
      'Reading books expands our knowledge and imagination.',
      'Exercise is important for maintaining good health.',
      'Music can change our mood and inspire creativity.',
      'Cooking teaches us about different cultures and flavors.',
      'Nature provides peace and beauty in our busy lives.',
      'Education opens doors to new opportunities.'
    ],
    hard: [
      'The quintessential entrepreneur demonstrates remarkable perseverance.',
      'Sophisticated algorithms revolutionize computational methodologies.',
      'Unprecedented circumstances require extraordinary collaborative solutions.',
      'Innovative technologies facilitate unprecedented global communication.',
      'Comprehensive educational curricula enhance intellectual development significantly.',
      'Environmental sustainability necessitates immediate comprehensive action.',
      'Interdisciplinary research approaches yield groundbreaking scientific discoveries.',
      'Contemporary philosophical debates challenge traditional ethical frameworks.'
    ]
  };

  // Generate a random text based on difficulty
  const generateNewText = () => {
    const textArray = texts[difficulty];
    const randomIndex = Math.floor(Math.random() * textArray.length);
    return textArray[randomIndex];
  };

  // Text-to-speech function
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech settings based on difficulty
      switch(difficulty) {
        case 'easy':
          utterance.rate = 0.7;
          utterance.pitch = 1.1;
          break;
        case 'medium':
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          break;
        case 'hard':
          utterance.rate = 1.0;
          utterance.pitch = 0.9;
          break;
      }
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      setFeedback('Speech synthesis not supported in this browser.');
    }
  };

  // Start new challenge
  const startNewChallenge = () => {
    const newText = generateNewText();
    setCurrentText(newText);
    setUserInput('');
    setShowResult(false);
    setFeedback('');
    
    // Automatically play the text
    setTimeout(() => {
      speakText(newText);
    }, 500);
  };

  // Check user's answer
  const checkAnswer = () => {
    const isCorrect = userInput.trim().toLowerCase() === currentText.toLowerCase();
    setTotalAttempts(totalAttempts + 1);
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedback('Perfect! Well done!');
    } else {
      setFeedback(`Close! The correct text was: "${currentText}"`);
    }
    
    setShowResult(true);
  };

  // Calculate accuracy percentage
  const getAccuracy = () => {
    return totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
  };

  // Reset game
  const resetGame = () => {
    setScore(0);
    setTotalAttempts(0);
    setUserInput('');
    setCurrentText('');
    setFeedback('');
    setShowResult(false);
  };

  // Handle key press for Enter to submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentText && userInput.trim()) {
      checkAnswer();
    }
  };

  // Fetch available chatrooms
  const fetchAvailableChatrooms = async () => {
    try {
      setLoadingChatrooms(true);
      console.log('[ListenToType] Fetching available chatrooms...');
      console.log('[ListenToType] Current user:', user);
      
      const response = await fetch('/api/chatrooms', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[ListenToType] Response status:', response.status);
      console.log('[ListenToType] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const chatrooms = await response.json();
        console.log('[ListenToType] Available chatrooms:', chatrooms);
        setAvailableChatrooms(chatrooms);
      } else {
        const errorData = await response.text();
        console.error('[ListenToType] Error fetching chatrooms:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
    } finally {
      setLoadingChatrooms(false);
    }
  };

  // Load chatrooms when component mounts
  useEffect(() => {
    if (user) {
      fetchAvailableChatrooms();
    }
  }, [user]);

  // Quick login for testing session sync
  const handleQuickLogin = async () => {
    try {
      const response = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'admin@example.com' })
      });
      
      if (response.ok) {
        console.log('[ListenToType] Quick login successful, refetching chatrooms...');
        await fetchAvailableChatrooms();
      }
    } catch (error) {
      console.error('Quick login error:', error);
    }
  };

  // Chat functionality
  const connectToChat = () => {
    if (!chatName.trim()) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('[chat] Connected to chat');
      newSocket.send(JSON.stringify({
        type: 'join',
        name: chatName.trim(),
        chatroom: selectedChatroom?.id
      }));
      setIsChatJoined(true);
      setSocket(newSocket);
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    };

    newSocket.onclose = () => {
      console.log('[chat] Disconnected from chat');
      setIsChatJoined(false);
      setSocket(null);
    };

    newSocket.onerror = (error) => {
      console.error('[chat] WebSocket error:', error);
    };
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !isChatJoined) return;

    socket.send(JSON.stringify({
      type: 'message',
      text: newMessage.trim(),
      chatroom: selectedChatroom?.id
    }));

    setNewMessage('');
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const disconnectFromChat = () => {
    if (socket) {
      socket.close();
    }
    setIsChatJoined(false);
    setSocket(null);
    setMessages([]);
    setChatName('');
    setSelectedChatroom(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 text-center mb-4">
          <h1 className="display-4 fw-bold text-primary mb-3">
            <i className="fas fa-headphones me-3"></i>Listen to Type
          </h1>
          <p className="lead text-muted">
            Improve your listening and typing skills with interactive audio challenges
          </p>
        </div>
      </div>

      {/* Game Interface */}
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-gamepad me-2"></i>Challenge
                </h4>
                <div className="d-flex gap-2">
                  <span className="badge bg-light text-dark">Score: {score}/{totalAttempts}</span>
                  {totalAttempts > 0 && (
                    <span className="badge bg-success">Accuracy: {getAccuracy()}%</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="card-body">
              {/* Difficulty Selection */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Difficulty Level:</label>
                  <select 
                    className="form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">🟢 Easy - Simple sentences</option>
                    <option value="medium">🟡 Medium - Longer phrases</option>
                    <option value="hard">🔴 Hard - Complex vocabulary</option>
                  </select>
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={startNewChallenge}
                    disabled={isPlaying}
                  >
                    {isPlaying ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Playing Audio...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play me-2"></i>Start Challenge
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Challenge Area */}
              {currentText && (
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-semibold">Type what you hear:</label>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => speakText(currentText)}
                          disabled={isPlaying}
                        >
                          <i className="fas fa-volume-up me-1"></i>Replay
                        </button>
                      </div>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Type here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={showResult}
                      />
                    </div>
                    
                    {!showResult ? (
                      <button 
                        className="btn btn-primary btn-lg w-100"
                        onClick={checkAnswer}
                        disabled={!userInput.trim()}
                      >
                        <i className="fas fa-check me-2"></i>Check Answer
                      </button>
                    ) : (
                      <div className="text-center">
                        <div className={`alert ${feedback.includes('Perfect') ? 'alert-success' : 'alert-warning'}`}>
                          <h5 className="mb-2">{feedback}</h5>
                        </div>
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-success"
                            onClick={startNewChallenge}
                          >
                            <i className="fas fa-forward me-2"></i>Next Challenge
                          </button>
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={resetGame}
                          >
                            <i className="fas fa-redo me-2"></i>Reset Game
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      {user?.role === 'student' && (
        <div className="row mt-4">
          <div className="col-12 text-center">
            <button 
              className={`btn ${showChat ? 'btn-outline-primary' : 'btn-primary'} btn-lg`}
              onClick={() => setShowChat(!showChat)}
            >
              <i className={`fas ${showChat ? 'fa-eye-slash' : 'fa-comments'} me-2`}></i>
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
        </div>
      )}

      {/* Chat Section - Students Only */}
      {showChat && user?.role === 'student' && (
        <div className="row mt-4">
          <div className="col-md-8 mx-auto">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-comments me-2"></i>
                  Live Chat Room
                  {selectedChatroom && ` - ${selectedChatroom.name}`}
                  {isChatJoined && (
                    <button 
                      className="btn btn-sm btn-outline-light float-end"
                      onClick={disconnectFromChat}
                    >
                      <i className="fas fa-sign-out-alt me-1"></i>Leave
                    </button>
                  )}
                </h5>
              </div>
              <div className="card-body">
                {/* Chatroom Selection */}
                {!selectedChatroom && (
                  <div className="mb-4">
                    <h6 className="mb-3">Select a chatroom to join:</h6>
                    {loadingChatrooms ? (
                      <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading chatrooms...</span>
                        </div>
                      </div>
                    ) : availableChatrooms.length > 0 ? (
                      <div className="row">
                        {availableChatrooms.map((chatroom) => (
                          <div key={chatroom.id} className="col-md-6 mb-2">
                            <div 
                              className="card border-primary cursor-pointer h-100"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedChatroom(chatroom)}
                            >
                              <div className="card-body text-center">
                                <h6 className="card-title text-primary">{chatroom.name}</h6>
                                {chatroom.description && (
                                  <p className="card-text small text-muted">{chatroom.description}</p>
                                )}
                                <button className="btn btn-sm btn-primary">
                                  <i className="fas fa-sign-in-alt me-1"></i>Join
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted">
                        <i className="fas fa-comment-slash fa-3x mb-3"></i>
                        <p>No chatrooms available yet.</p>
                        <p className="small">Ask your teacher to create a chatroom for you!</p>
                        <button 
                          className="btn btn-outline-primary btn-sm mt-2"
                          onClick={handleQuickLogin}
                        >
                          <i className="fas fa-sync me-1"></i>Refresh Chatrooms
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Interface */}
                {selectedChatroom && (
                  <div>
                    {!isChatJoined ? (
                      <div className="text-center">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">Enter your name to join {selectedChatroom.name}:</h6>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedChatroom(null)}
                          >
                            <i className="fas fa-arrow-left me-1"></i>Back
                          </button>
                        </div>
                        <div className="row">
                          <div className="col-md-8 mx-auto">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Your name..."
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && connectToChat()}
                                maxLength={20}
                              />
                              <button 
                                className="btn btn-primary"
                                onClick={connectToChat}
                                disabled={!chatName.trim()}
                              >
                                <i className="fas fa-sign-in-alt me-1"></i>Join Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Messages */}
                        <div 
                          ref={chatMessagesRef}
                          className="chat-messages mb-3"
                          style={{ 
                            height: '300px', 
                            overflowY: 'auto', 
                            border: '1px solid #dee2e6', 
                            borderRadius: '0.375rem',
                            padding: '10px',
                            backgroundColor: '#f8f9fa'
                          }}
                        >
                          {messages.length === 0 ? (
                            <div className="text-center text-muted">
                              <i className="fas fa-comments fa-2x mb-2"></i>
                              <p>No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div key={msg.id} className="mb-2">
                                {msg.type === 'message' ? (
                                  <div className="d-flex">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-1">
                                        <strong className="text-primary me-2">{msg.name}</strong>
                                        <small className="text-muted">{formatTime(msg.timestamp)}</small>
                                      </div>
                                      <div className="bg-white rounded p-2 shadow-sm">
                                        {msg.text}
                                      </div>
                                    </div>
                                  </div>
                                ) : msg.type === 'user_joined' ? (
                                  <div className="text-center">
                                    <small className="text-success">
                                      <i className="fas fa-user-plus me-1"></i>
                                      {msg.name} joined the chat
                                    </small>
                                  </div>
                                ) : msg.type === 'user_left' ? (
                                  <div className="text-center">
                                    <small className="text-warning">
                                      <i className="fas fa-user-minus me-1"></i>
                                      {msg.name} left the chat
                                    </small>
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Message Input */}
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleChatKeyPress}
                            maxLength={200}
                          />
                          <button 
                            className="btn btn-primary"
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                          >
                            <i className="fas fa-paper-plane"></i>
                          </button>
                        </div>
                        <small className="text-muted">Press Enter to send, Shift+Enter for new line</small>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Information - For Testing */}
      {user && (
        <div className="row mt-3">
          <div className="col-12 text-center">
            <small className="text-muted">
              User Role: {user.role || 'Not Set'} | 
              Chat Access: {user?.role === 'student' ? '✅ Available' : '❌ Teacher/Admin Only'}
            </small>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="row mt-5">
        <div className="col-md-10 mx-auto">
          <div className="card border-info">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><i className="fas fa-info-circle me-2"></i>How to Play & Chat</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary">Game Instructions:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-play text-success me-2"></i>Click "Start Challenge" to begin</li>
                    <li><i className="fas fa-headphones text-info me-2"></i>Listen carefully to the audio</li>
                    <li><i className="fas fa-keyboard text-warning me-2"></i>Type exactly what you hear</li>
                    <li><i className="fas fa-check text-success me-2"></i>Click "Check Answer" or press Enter</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary">Chat Features:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-comments text-primary me-2"></i>Join chatrooms created by your teacher</li>
                    <li><i className="fas fa-user text-secondary me-2"></i>Enter your name to join conversations</li>
                    <li><i className="fas fa-eye text-info me-2"></i>See when users join and leave</li>
                    <li><i className="fas fa-clock text-success me-2"></i>All messages show timestamps</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListenToType;