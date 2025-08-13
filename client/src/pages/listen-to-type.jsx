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
        console.log(
          "[ListenToType] Delayed chatroom fetch for session sync...",
        );
        fetchAvailableChatrooms();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, availableChatrooms.length]);

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
              <div className="card-header bg-primary text-white">
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
                {/* Chatroom Selection */}
                {!selectedChatroom && (
                  <div className="mb-4">
                    <h6 className="mb-3">Select a chatroom to join:</h6>
                    {loadingChatrooms ? (
                      <div className="text-center">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Loading chatrooms...
                          </span>
                        </div>
                      </div>
                    ) : availableChatrooms.length > 0 ? (
                      <div className="row">
                        {availableChatrooms.map((chatroom) => (
                          <div key={chatroom.id} className="col-md-6 mb-2">
                            <div
                              className="card border-primary cursor-pointer h-100"
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedChatroom(chatroom)}
                            >
                              <div className="card-body text-center">
                                <h6 className="card-title text-primary">
                                  {decodeHtmlEntities(chatroom.name)}
                                </h6>
                                {chatroom.description && (
                                  <p className="card-text small text-muted">
                                    {decodeHtmlEntities(chatroom.description)}
                                  </p>
                                )}
                                <button className="btn btn-sm btn-primary">
                                  <i className="fas fa-sign-in-alt me-1"></i>
                                  Join
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
                        <p className="small">
                          Ask your teacher to create a chatroom for you!
                        </p>
                        <div className="mt-3">
                          <button
                            className="btn btn-primary btn-sm me-2"
                            onClick={() => fetchAvailableChatrooms()}
                          >
                            <i className="fas fa-sync me-1"></i>Refresh
                          </button>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={handleDirectLogin}
                            title="Click this to fix authentication and see chatrooms"
                          >
                            <i className="fas fa-sign-in-alt me-1"></i>Fix
                            Session
                          </button>
                          <a
                            href="/api/auth/quick-login"
                            className="btn btn-success btn-sm me-2"
                            title="Login as Admin/Teacher"
                          >
                            <i className="fas fa-key me-1"></i>Teacher Login
                          </a>
                          <a
                            href="/api/auth/quick-login?type=student"
                            className="btn btn-info btn-sm me-2"
                            title="Login as Student"
                          >
                            <i className="fas fa-user me-1"></i>Student Login
                          </a>
                          {user?.isAdmin && (
                            <a
                              href="/admin"
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="fas fa-plus me-1"></i>Create
                            </a>
                          )}
                          <div className="mt-2">
                            <small className="text-muted">
                              Debug: User {user?.email || "not logged in"} (
                              {user?.role || "no role"})
                            </small>
                          </div>
                          <div className="mt-2">
                            <div className="alert alert-info alert-sm">
                              <i className="fas fa-info-circle me-1"></i>
                              <strong>Can't see chatrooms?</strong> Click
                              "Direct Login" to authenticate and access
                              chatrooms.
                              <br />
                              <small>
                                All students and teachers can access chatrooms
                                for collaborative learning!
                              </small>
                            </div>
                          </div>
                        </div>
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
