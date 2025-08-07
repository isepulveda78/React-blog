import React, { useState, useEffect, useRef } from 'react';

const ListenToType = ({ user }) => {
  // Chat functionality only
  const [chatName, setChatName] = useState('');
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [availableChatrooms, setAvailableChatrooms] = useState([]);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  
  const chatMessagesRef = useRef(null);

  // Fetch available chatrooms with retry logic
  const fetchAvailableChatrooms = async (retryCount = 0) => {
    try {
      setLoadingChatrooms(true);
      console.log('[ListenToType] Fetching available chatrooms... (attempt', retryCount + 1, ')');
      
      const response = await fetch('/api/chatrooms', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[ListenToType] Response status:', response.status);
      
      if (response.ok) {
        const chatrooms = await response.json();
        console.log('[ListenToType] Available chatrooms:', chatrooms);
        setAvailableChatrooms(chatrooms);
      } else if (response.status === 401 && retryCount < 2) {
        // Try again after a short delay for session sync
        console.log('[ListenToType] Auth failed, retrying in 1 second...');
        setTimeout(() => fetchAvailableChatrooms(retryCount + 1), 1000);
        return;
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

  // Load chatrooms when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchAvailableChatrooms();
    }
  }, [user]);

  // Also try to load chatrooms after a delay to handle session sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && availableChatrooms.length === 0) {
        console.log('[ListenToType] Delayed chatroom fetch for session sync...');
        fetchAvailableChatrooms();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, availableChatrooms.length]);

  // Direct login to fix session sync
  const handleDirectLogin = async () => {
    try {
      console.log('[ListenToType] Redirecting to login...');
      // Force a login to sync sessions properly
      window.location.href = '/api/auth/quick-login?redirect=' + encodeURIComponent(window.location.pathname);
    } catch (error) {
      console.error('Login redirect error:', error);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const connectToChat = () => {
    // Only allow authenticated users to join chat
    if (!user || !user.name || !selectedChatroom) {
      console.error('[chat] Authentication required to join chat');
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('[chat] Connecting to WebSocket:', wsUrl);
    console.log('[chat] User data for join:', { name: user.name, role: user.role, userId: user.id });
    
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log('[chat] WebSocket connected');
      const joinData = {
        type: 'join',
        name: user.name,
        role: user.role,
        userId: user.id,
        chatroom: selectedChatroom.id
      };
      console.log('[chat] NEW AUTH FORMAT - Sending join data:', joinData);
      newSocket.send(JSON.stringify(joinData));
      setIsChatJoined(true);
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[chat] Received message:', data);
      
      if (data.type === 'error') {
        console.error('[chat] WebSocket error:', data.message);
        alert('Chat Error: ' + data.message);
        setIsChatJoined(false);
        newSocket.close();
        return;
      }
      
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        ...data,
        timestamp: new Date().toISOString()
      }]);
    };

    newSocket.onclose = () => {
      console.log('[chat] WebSocket disconnected');
      setIsChatJoined(false);
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

  // Chatroom interface for all users - this is the ONLY content
  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-comments me-2"></i>
                Live Chat Room
                {selectedChatroom && ` - ${selectedChatroom.name}`}
                {user?.role && (
                  <span className="badge bg-light text-dark ms-2">{user.role}</span>
                )}
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
                  {user ? (
                    <div>
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
                          {user?.isAdmin && (
                            <a href="/admin" className="btn btn-outline-primary btn-sm">
                              <i className="fas fa-plus me-1"></i>Create Chatroom
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="alert alert-warning">
                        <i className="fas fa-lock fa-2x mb-3"></i>
                        <h5>Authentication Required</h5>
                        <p>Please log in to access chatrooms for collaborative learning.</p>
                      </div>
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <a 
                          href="/api/auth/quick-login?user=teacher&redirect=/listen-to-type" 
                          className="btn btn-success"
                        >
                          <i className="fas fa-chalkboard-teacher me-1"></i>Teacher Login
                        </a>
                        <a 
                          href="/api/auth/quick-login?user=student&redirect=/listen-to-type" 
                          className="btn btn-primary"
                        >
                          <i className="fas fa-user me-1"></i>Student Login
                        </a>
                      </div>
                      <p className="mt-3 text-muted small">
                        Only authenticated users can access the chat system for security and accountability.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Interface */}
              {selectedChatroom && user && (
                <div>
                  {!isChatJoined ? (
                    <div className="text-center">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Join {selectedChatroom.name} as {user.name}:</h6>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedChatroom(null)}
                        >
                          <i className="fas fa-arrow-left me-1"></i>Back
                        </button>
                      </div>
                      <div className="alert alert-info">
                        <i className="fas fa-user me-2"></i>
                        You will join as: <strong>{user.name}</strong> ({user.role})
                      </div>
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={connectToChat}
                      >
                        <i className="fas fa-sign-in-alt me-2"></i>Join Chat as {user.name}
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Chat Messages */}
                      <div 
                        ref={chatMessagesRef}
                        className="border rounded p-3 mb-3"
                        style={{ height: '300px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}
                      >
                        {messages.length === 0 ? (
                          <div className="text-center text-muted">
                            <i className="fas fa-comments fa-2x mb-2"></i>
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div key={message.id} className="mb-2">
                              {message.type === 'user_joined' ? (
                                <div className="text-center">
                                  <small className="text-success">
                                    <i className="fas fa-user-plus me-1"></i>
                                    {message.username} ({message.role}) joined the chat at {formatTime(message.timestamp)}
                                  </small>
                                </div>
                              ) : message.type === 'user_left' ? (
                                <div className="text-center">
                                  <small className="text-warning">
                                    <i className="fas fa-user-minus me-1"></i>
                                    {message.username} ({message.role}) left the chat at {formatTime(message.timestamp)}
                                  </small>
                                </div>
                              ) : (
                                <div className="d-flex justify-content-start">
                                  <div className="bg-white rounded p-2 shadow-sm" style={{ maxWidth: '70%' }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="d-flex align-items-center">
                                        <strong className="text-primary me-2">{message.username}</strong>
                                        <span className={`badge ${message.role === 'teacher' ? 'bg-success' : 'bg-primary'} text-white me-2`} style={{ fontSize: '0.7em' }}>
                                          {message.role}
                                        </span>
                                      </div>
                                      <small className="text-muted">{formatTime(message.timestamp)}</small>
                                    </div>
                                    <p className="mb-0">{message.text}</p>
                                  </div>
                                </div>
                              )}
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
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListenToType;