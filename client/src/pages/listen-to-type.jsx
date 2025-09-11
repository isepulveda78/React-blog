import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../components/Toast.jsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function to decode HTML entities
const decodeHtmlEntities = (str) => {
  if (!str) return str;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const ListenToType = ({ user }) => {
  // Chat functionality only
  const [chatName, setChatName] = useState("");
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [availableChatrooms, setAvailableChatrooms] = useState([]);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  
  // Access key functionality
  const [accessKey, setAccessKey] = useState("");
  const [joiningWithKey, setJoiningWithKey] = useState(false);

  const chatMessagesRef = useRef(null);
  const { showToast, ToastContainer } = useToast();

  // Test toast on component load (for debugging)
  useEffect(() => {
    console.log("[ListenToType] Component loaded, toast system ready");
  }, []);

  // PDF Export function for teachers
  const exportChatToPDF = async () => {
    if (!user?.isAdmin && user?.role !== "teacher") {
      showToast("Only teachers can export chat conversations", "error", 3000);
      return;
    }

    if (messages.length === 0) {
      showToast("No messages to export", "info", 3000);
      return;
    }

    try {
      // Create a temporary container for PDF content
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.padding = "20px";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.style.lineHeight = "1.4";

      // Add header
      const header = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
          <h2 style="margin: 0; color: #333;">Chat Conversation Export</h2>
          <p style="margin: 5px 0; color: #666;">Chatroom: ${decodeHtmlEntities(selectedChatroom?.name) || "Unknown"}</p>
          <p style="margin: 5px 0; color: #666;">Exported on: ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0; color: #666;">Exported by: ${user?.name || "Teacher"}</p>
        </div>
      `;

      // Add messages
      const messagesHTML = messages
        .map((message, index) => {
          const timestamp = new Date(message.timestamp).toLocaleString();
          const messageType =
            message.type === "message"
              ? "Message"
              : message.type === "user_joined"
                ? "Joined"
                : message.type === "user_left"
                  ? "Left"
                  : message.type;

          return `
          <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; background-color: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <strong style="color: #007bff;">${message.username || message.name || "Unknown User"}</strong>
              <span style="font-size: 10px; color: #666;">${timestamp}</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="background-color: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                ${message.role || "student"}
              </span>
              <span style="background-color: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">
                ${messageType}
              </span>
            </div>
            ${message.text ? `<div style="color: #333;">${message.text}</div>` : ""}
          </div>
        `;
        })
        .join("");

      tempDiv.innerHTML = header + messagesHTML;
      document.body.appendChild(tempDiv);

      // Convert to canvas and then PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `chat-${selectedChatroom?.name || "conversation"}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      showToast("Chat conversation exported successfully!", "success", 3000);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      showToast("Failed to export PDF. Please try again.", "error", 3000);
    }
  };

  // Fetch available chatrooms with retry logic
  const fetchAvailableChatrooms = async (retryCount = 0) => {
    try {
      setLoadingChatrooms(true);
      console.log(
        "[ListenToType] Fetching available chatrooms... (attempt",
        retryCount + 1,
        ")",
      );

      const response = await fetch("/api/chatrooms", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[ListenToType] Response status:", response.status);

      if (response.ok) {
        const chatrooms = await response.json();
        console.log("[ListenToType] Available chatrooms:", chatrooms);
        setAvailableChatrooms(chatrooms);
      } else if (response.status === 401 && retryCount < 2) {
        // Try again after a short delay for session sync
        console.log("[ListenToType] Auth failed, retrying in 1 second...");
        setTimeout(() => fetchAvailableChatrooms(retryCount + 1), 1000);
        return;
      } else {
        const errorData = await response.text();
        console.error(
          "[ListenToType] Error fetching chatrooms:",
          response.status,
          errorData,
        );
      }
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
    } finally {
      setLoadingChatrooms(false);
    }
  };

  // Load chatrooms when component mounts (public access, no authentication needed)
  useEffect(() => {
    fetchAvailableChatrooms();
  }, []);

  // Also try to load chatrooms after a delay to handle any issues
  useEffect(() => {
    const timer = setTimeout(() => {
      if (availableChatrooms.length === 0) {
        console.log(
          "[ListenToType] Delayed chatroom fetch...",
        );
        fetchAvailableChatrooms();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [availableChatrooms.length]);

  // Direct login to fix session sync
  const handleDirectLogin = async () => {
    try {
      console.log("[ListenToType] Redirecting to login...");
      // Force a login to sync sessions properly
      window.location.href =
        "/api/auth/quick-login?redirect=" +
        encodeURIComponent(window.location.pathname);
    } catch (error) {
      console.error("Login redirect error:", error);
    }
  };

  // Join chatroom with access key
  const joinWithAccessKey = async () => {
    if (!accessKey.trim()) {
      showToast("Please enter an access key", "error", 3000);
      return;
    }

    try {
      setJoiningWithKey(true);
      console.log("[ListenToType] Joining with access key:", accessKey);

      const response = await fetch("/api/chatrooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[ListenToType] Successfully joined chatroom:", data.chatroom);
        setSelectedChatroom(data.chatroom);
        showToast(`Joined ${data.chatroom.name}!`, "success", 3000);
      } else {
        const error = await response.text();
        console.error("[ListenToType] Error joining with key:", error);
        showToast("Invalid access key or chatroom is not active", "error", 3000);
      }
    } catch (error) {
      console.error("Error joining with access key:", error);
      showToast("Failed to join chatroom. Please try again.", "error", 3000);
    } finally {
      setJoiningWithKey(false);
    }
  };

  // Generate new access key (teachers/admins only)
  const generateNewKey = async (chatroomId) => {
    if (!user?.isAdmin && user?.role !== 'teacher') {
      showToast("Only teachers and admins can generate new keys", "error", 3000);
      return;
    }

    try {
      console.log("[ListenToType] Generating new key for chatroom:", chatroomId);

      const response = await fetch(`/api/admin/chatrooms/${chatroomId}/new-key`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[ListenToType] New key generated:", data.accessKey);
        
        // Update the selectedChatroom with new key if it's the current one
        if (selectedChatroom && selectedChatroom.id === chatroomId) {
          setSelectedChatroom(data.chatroom);
        }
        
        // Refresh available chatrooms to show updated keys
        fetchAvailableChatrooms();
        
        showToast(`New access key generated: ${data.accessKey}`, "success", 5000);
      } else {
        const error = await response.text();
        console.error("[ListenToType] Error generating new key:", error);
        showToast("Failed to generate new key", "error", 3000);
      }
    } catch (error) {
      console.error("Error generating new key:", error);
      showToast("Failed to generate new key. Please try again.", "error", 3000);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const connectToChat = () => {
    const displayName = user?.name || chatName;
    if (!displayName.trim() || !selectedChatroom) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log("[chat] Connecting to WebSocket:", wsUrl);

    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log("[chat] WebSocket connected");
      
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        // PRIORITIZE typed name over authenticated user name
        const displayName = chatName.trim() || user?.name || "Anonymous";

        const joinData = {
          type: "join",
          name: displayName,
          role: user?.role || "student",
          chatroom: selectedChatroom.id,
        };
        console.log("[chat] Sending join data:", joinData);
        
        try {
          newSocket.send(JSON.stringify(joinData));
          console.log("[chat] Join data sent successfully");
        } catch (error) {
          console.error("[chat] Error sending join data:", error);
          setSocket(null);
          setIsChatJoined(false);
        }
      }, 100); // 100ms delay to ensure connection is ready
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[chat] Received message:", data);

      // Handle join_rejected first - highest priority
      if (data.type === "join_rejected") {
        console.log("[chat] ⚠️ JOIN REJECTED - Processing rejection:", data);
        console.log("[chat] Toast function available:", typeof showToast);

        // Show toast notification with retry
        setTimeout(() => {
          try {
            showToast(
              `❌ Name "${data.name}" is already taken! Please choose a different name to join this chatroom.`,
              "error",
              10000,
            );
            console.log("[chat] ✅ Toast notification sent successfully");
          } catch (error) {
            console.error("[chat] ❌ Error showing toast:", error);
          }
        }, 50); // Small delay to ensure DOM is ready

        // Reset state
        setSocket(null);
        setIsChatJoined(false);
        // Don't add this to messages, just handle the rejection
        return;
      }

      // Handle other message types
      if (data.type === "user_joined") {
        console.log("[chat] User joined event:", data.name);
        setConnectedUsers((prev) => new Set([...prev, data.name]));
        
        // Check if this is our own join confirmation
        const ourName = chatName.trim() || user?.name;
        if (data.name === ourName) {
          console.log("[chat] ✅ Successfully joined chatroom as:", ourName);
          setIsChatJoined(true);
        }
      } else if (data.type === "user_left") {
        setConnectedUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.name);
          return newSet;
        });
      } else if (data.type === "message") {
        console.log("[chat] Received chat message:", data);
      }

      // Add to messages for display (except rejections)
      if (data.type === "message" || data.type === "user_joined" || data.type === "user_left") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now() + Math.random(),
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ]);
      }
    };

    newSocket.onclose = (event) => {
      console.log("[chat] WebSocket disconnected - code:", event.code, "reason:", event.reason);
      if (isChatJoined) {
        showToast("Chat connection lost. Please rejoin.", "warning", 3000);
      }
      setSocket(null);
      setIsChatJoined(false);
    };

    newSocket.onerror = (error) => {
      console.error("[chat] WebSocket error:", error);
      if (!isChatJoined) {
        setTimeout(() => {
          showToast("Connection failed. Please try again.", "error", 3000);
        }, 500);
      }
    };
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !isChatJoined) return;

    socket.send(
      JSON.stringify({
        type: "message",
        text: newMessage.trim(),
        chatroom: selectedChatroom?.id,
      }),
    );

    setNewMessage("");
  };

  const handleChatKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    setConnectedUsers(new Set());
    setChatName("");
    setSelectedChatroom(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Chatroom interface for all users - this is the ONLY content
  return (
    <>
      <div className="container py-4">
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card shadow">
              <div className="card-header bg-primary">
                <h5 className="mb-0 d-flex justify-content-between align-items-center">
                  <span>
                    <i className="fas fa-comments me-2"></i>
                    Live Chat Room
                    {selectedChatroom && ` - ${decodeHtmlEntities(selectedChatroom.name)}`}
                    {user?.role && (
                      <span className="badge bg-light text-dark ms-2">
                        {user.role}
                      </span>
                    )}
                  </span>
                  <div>
                    {(user?.isAdmin || user?.role === "teacher") &&
                      messages.length > 0 && (
                        <button
                          className="btn btn-sm btn-outline-light me-2"
                          onClick={exportChatToPDF}
                          title="Export chat to PDF"
                        >
                          <i className="fas fa-file-pdf me-1"></i>Export PDF
                        </button>
                      )}
                    {isChatJoined && (
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={disconnectFromChat}
                      >
                        <i className="fas fa-sign-out-alt me-1"></i>Leave
                      </button>
                    )}
                  </div>
                </h5>
              </div>
              <div className="card-body">
                {/* Access Key Input - Public Access */}
                {!selectedChatroom && (
                  <div className="mb-4">
                    <div className="text-center mb-4">
                      <h5 className="text-primary">
                        <i className="fas fa-key me-2"></i>
                        Join Chatroom with Access Key
                      </h5>
                      <p className="text-muted">
                        Enter the 6-digit code from your teacher to join the conversation
                      </p>
                    </div>

                    <div className="row justify-content-center">
                      <div className="col-md-6">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control text-center fs-4"
                            placeholder="123456"
                            maxLength="6"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value.replace(/\D/g, ''))}
                            onKeyPress={(e) => e.key === "Enter" && joinWithAccessKey()}
                            style={{ letterSpacing: '0.3em' }}
                            data-testid="input-access-key"
                          />
                          <button
                            className="btn btn-primary btn-lg"
                            onClick={joinWithAccessKey}
                            disabled={joiningWithKey || accessKey.length !== 6}
                            data-testid="button-join-chatroom"
                          >
                            {joiningWithKey ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Joining...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-sign-in-alt me-1"></i>
                                Join
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Available Chatrooms - Public Access */}
                    <div className="mt-5">
                      <div className="border-top pt-4">
                        <h6 className="text-info mb-3">
                          <i className="fas fa-comments me-2"></i>
                          Available Chatrooms
                        </h6>
                        
                        {loadingChatrooms ? (
                          <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading chatrooms...</span>
                            </div>
                          </div>
                        ) : availableChatrooms.length > 0 ? (
                          <div className="row">
                            {availableChatrooms.filter(room => room.isActive).map((chatroom) => (
                              <div key={chatroom.id} className="col-md-6 mb-3">
                                <div className="card border-info">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title text-info mb-0">
                                        {decodeHtmlEntities(chatroom.name)}
                                      </h6>
                                      {(user?.isAdmin || user?.role === 'teacher') && (
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => generateNewKey(chatroom.id)}
                                          title="Generate new access key"
                                          data-testid={`button-new-key-${chatroom.id}`}
                                        >
                                          <i className="fas fa-sync me-1"></i>
                                          New Key
                                        </button>
                                      )}
                                    </div>
                                    <div className="alert alert-info mb-2 text-center">
                                      <strong className="fs-3" style={{ letterSpacing: '0.2em' }}>
                                        {chatroom.accessKey}
                                      </strong>
                                      <br />
                                      <small>Use this code to join the conversation</small>
                                    </div>
                                    {chatroom.description && (
                                      <p className="card-text small text-muted">
                                        {decodeHtmlEntities(chatroom.description)}
                                      </p>
                                    )}
                                    <button
                                      className="btn btn-sm btn-info"
                                      onClick={() => {
                                        setAccessKey(chatroom.accessKey);
                                        setSelectedChatroom(chatroom);
                                      }}
                                      data-testid={`button-join-${chatroom.id}`}
                                    >
                                      <i className="fas fa-sign-in-alt me-1"></i>
                                      Join This Room
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted">
                            <i className="fas fa-comment-slash fa-2x mb-3"></i>
                            <p>No active chatrooms available.</p>
                            {(user?.isAdmin || user?.role === 'teacher') && (
                              <a href="/admin" className="btn btn-info btn-sm">
                                <i className="fas fa-plus me-1"></i>Create Chatroom
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Chat Interface */}
                {selectedChatroom && (
                  <div>
                    {!isChatJoined ? (
                      <div className="text-center">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">
                            Enter your name to join {decodeHtmlEntities(selectedChatroom.name)}:
                          </h6>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedChatroom(null)}
                          >
                            <i className="fas fa-arrow-left me-1"></i>Back
                          </button>
                        </div>
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder={
                              user?.name
                                ? `Default: ${user.name}`
                                : "Enter your name"
                            }
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && connectToChat()
                            }
                          />
                          <button
                            className="btn btn-primary"
                            onClick={connectToChat}
                            disabled={!chatName.trim() && !user?.name}
                          >
                            <i className="fas fa-sign-in-alt me-1"></i>Join as{" "}
                            {user?.name || chatName || "User"}
                          </button>
                        </div>
                        {user?.name && (
                          <small className="text-muted d-block mb-2">
                            <i className="fas fa-info-circle me-1"></i>
                            Using your account name:{" "}
                            <strong>{user.name}</strong> ({user.role})
                          </small>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Chat Messages */}
                        <div
                          ref={chatMessagesRef}
                          className="border rounded p-3 mb-3"
                          style={{
                            height: "300px",
                            overflowY: "auto",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          {messages.length === 0 ? (
                            <div className="text-center text-muted">
                              <i className="fas fa-comments fa-2x mb-2"></i>
                              <p>No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div key={message.id} className="mb-2">
                                {message.type === "user_joined" ? (
                                  <div className="text-center">
                                    <small className="text-success">
                                      <i className="fas fa-user-plus me-1"></i>
                                      {message.username} ({message.role}) joined
                                      the chat at{" "}
                                      {formatTime(message.timestamp)}
                                    </small>
                                  </div>
                                ) : message.type === "user_left" ? (
                                  <div className="text-center">
                                    <small className="text-warning">
                                      <i className="fas fa-user-minus me-1"></i>
                                      {message.username} ({message.role}) left
                                      the chat at{" "}
                                      {formatTime(message.timestamp)}
                                    </small>
                                  </div>
                                ) : (
                                  <div className="d-flex justify-content-start mb-2">
                                    <div
                                      className="bg-white rounded p-3 shadow-sm border"
                                      style={{ maxWidth: "75%" }}
                                    >
                                      <div className="d-flex justify-content-between align-items-center mb-1">
                                        <div className="d-flex align-items-center">
                                          <strong className="text-primary me-2">
                                            {message.username ||
                                              message.name ||
                                              "Unknown User"}
                                          </strong>
                                          <span
                                            className={`badge ${message.role === "teacher" ? "bg-success" : "bg-info"} text-white`}
                                            style={{ fontSize: "0.65em" }}
                                          >
                                            {message.role || "student"}
                                          </span>
                                        </div>
                                        <small
                                          className="text-muted ms-1"
                                          style={{ fontSize: "0.75em" }}
                                        >
                                          {formatTime(message.timestamp)}
                                        </small>
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
                        
                        {/* Multi-user Testing Info */}
                        <div className="mt-3">
                          <div className="alert alert-info py-2">
                            <small>
                              <strong><i className="fas fa-info-circle me-1"></i>Testing Multi-User Chat:</strong>
                              <br/>
                              • Open another browser (Chrome + Firefox) or incognito window
                              <br/>
                              • Join the same chatroom with a different name
                              <br/>
                              • Messages will appear on both screens in real-time
                            </small>
                          </div>
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
      <ToastContainer />
    </>
  );
};

export default ListenToType;
