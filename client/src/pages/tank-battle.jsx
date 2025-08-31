import React, { useState, useEffect, useRef } from 'react';

const TankBattle = ({ user }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    status: 'lobby', // lobby, waiting, playing, finished
    players: [],
    tanks: {},
    bullets: [],
    gameRoom: null,
    winner: null
  });
  const [socket, setSocket] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [controls, setControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
  });

  // Game configuration
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const TANK_SIZE = 30;
  const TANK_SPEED = 3;
  const BULLET_SPEED = 5;
  const BULLET_SIZE = 4;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to tank battle server');
      ws.send(JSON.stringify({
        type: 'join_tank_battle',
        userId: user.id,
        username: user.name
      }));
      // Request available rooms
      ws.send(JSON.stringify({
        type: 'get_rooms'
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      console.log('Disconnected from tank battle server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'rooms_list':
        setAvailableRooms(data.rooms);
        break;
      case 'room_created':
        setAvailableRooms(prev => [...prev, data.room]);
        break;
      case 'room_updated':
        setAvailableRooms(prev => 
          prev.map(room => room.roomId === data.room.roomId ? data.room : room)
        );
        break;
      case 'room_removed':
        setAvailableRooms(prev => 
          prev.filter(room => room.roomId !== data.roomId)
        );
        break;
      case 'game_update':
        setGameState(prevState => ({
          ...prevState,
          ...data.gameState
        }));
        break;
      case 'game_started':
        setGameState(prevState => ({
          ...prevState,
          status: 'playing',
          tanks: data.tanks,
          gameRoom: data.gameRoom
        }));
        break;
      case 'player_joined':
        setGameState(prevState => ({
          ...prevState,
          players: data.players
        }));
        break;
      case 'game_ended':
        setGameState(prevState => ({
          ...prevState,
          status: 'finished',
          winner: data.winner
        }));
        break;
      case 'error':
        alert(data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState.status !== 'playing') return;

      const newControls = { ...controls };
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newControls.up = true;
          break;
        case 's':
        case 'arrowdown':
          newControls.down = true;
          break;
        case 'a':
        case 'arrowleft':
          newControls.left = true;
          break;
        case 'd':
        case 'arrowright':
          newControls.right = true;
          break;
        case ' ':
          newControls.shoot = true;
          e.preventDefault();
          break;
      }
      setControls(newControls);
    };

    const handleKeyUp = (e) => {
      const newControls = { ...controls };
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newControls.up = false;
          break;
        case 's':
        case 'arrowdown':
          newControls.down = false;
          break;
        case 'a':
        case 'arrowleft':
          newControls.left = false;
          break;
        case 'd':
        case 'arrowright':
          newControls.right = false;
          break;
        case ' ':
          newControls.shoot = false;
          break;
      }
      setControls(newControls);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controls, gameState.status]);

  // Send controls to server
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && gameState.status === 'playing') {
      socket.send(JSON.stringify({
        type: 'player_input',
        controls: controls,
        userId: user.id
      }));
    }
  }, [controls, socket, gameState.status, user]);

  // Render game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = '#1a4d1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw tanks
    Object.entries(gameState.tanks || {}).forEach(([playerId, tank]) => {
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.rotate(tank.angle);

      // Tank body
      ctx.fillStyle = tank.color;
      ctx.fillRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);

      // Tank outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);

      // Tank cannon
      ctx.fillStyle = '#444';
      ctx.fillRect(-2, -TANK_SIZE/2 - 10, 4, 15);

      ctx.restore();

      // Player name
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tank.username, tank.x, tank.y - TANK_SIZE);

      // Health bar
      const healthBarWidth = TANK_SIZE;
      const healthBarHeight = 4;
      const healthPercent = tank.health / 100;
      
      ctx.fillStyle = '#600';
      ctx.fillRect(tank.x - healthBarWidth/2, tank.y + TANK_SIZE/2 + 5, healthBarWidth, healthBarHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#090' : healthPercent > 0.25 ? '#990' : '#900';
      ctx.fillRect(tank.x - healthBarWidth/2, tank.y + TANK_SIZE/2 + 5, healthBarWidth * healthPercent, healthBarHeight);
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [gameState]);

  // Room management functions
  const createRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN && roomName.trim()) {
      socket.send(JSON.stringify({
        type: 'create_room',
        userId: user.id,
        username: user.name,
        roomName: roomName.trim()
      }));
      setRoomName('');
      setShowCreateRoom(false);
      setGameState(prev => ({ ...prev, status: 'waiting' }));
    }
  };

  const joinRoom = (roomId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_room',
        userId: user.id,
        username: user.name,
        roomId: roomId
      }));
      setGameState(prev => ({ ...prev, status: 'waiting' }));
    }
  };

  const leaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'leave_room',
        userId: user.id
      }));
      setGameState(prev => ({ ...prev, status: 'lobby' }));
    }
  };

  const refreshRooms = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'get_rooms'
      }));
    }
  };

  const startNewGame = () => {
    setGameState({
      status: 'lobby',
      players: [],
      tanks: {},
      bullets: [],
      gameRoom: null,
      winner: null
    });
    refreshRooms();
  };

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">
          <h4>Authentication Required</h4>
          <p>Please log in to play Tank Battle.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold text-warning mb-3">
            <i className="fas fa-gamepad me-3"></i>
            Tank Battle Arena
          </h1>
          <p className="lead text-muted">
            Real-time multiplayer tank vs tank combat
          </p>
        </div>
      </div>

      {/* Room Lobby */}
      {gameState.status === 'lobby' && (
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="text-primary mb-0">
                <i className="fas fa-door-open me-2"></i>
                Available Rooms
              </h3>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={refreshRooms}
                >
                  <i className="fas fa-sync me-2"></i>
                  Refresh
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => setShowCreateRoom(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Room
                </button>
              </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoom && (
              <div className="card border-success mb-4">
                <div className="card-body">
                  <h5 className="card-title">Create New Room</h5>
                  <div className="mb-3">
                    <label className="form-label">Room Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name..."
                      maxLength={30}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success"
                      onClick={createRoom}
                      disabled={!roomName.trim()}
                    >
                      Create Room
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowCreateRoom(false);
                        setRoomName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rooms List */}
            {availableRooms.length === 0 ? (
              <div className="card">
                <div className="card-body text-center">
                  <i className="fas fa-door-closed fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No rooms available</h5>
                  <p className="text-muted">Create a new room to start playing!</p>
                </div>
              </div>
            ) : (
              <div className="row">
                {availableRooms.map(room => (
                  <div key={room.roomId} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">
                          <i className="fas fa-door-open me-2 text-primary"></i>
                          {room.roomName}
                        </h6>
                        <p className="card-text text-muted mb-2">
                          <small>
                            <i className="fas fa-user me-1"></i>
                            Created by: {room.creator.username}
                          </small>
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-info">
                            {room.playersCount}/{room.maxPlayers} players
                          </span>
                          <button 
                            className={`btn btn-sm ${room.playersCount >= room.maxPlayers ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => joinRoom(room.roomId)}
                            disabled={room.playersCount >= room.maxPlayers}
                          >
                            {room.playersCount >= room.maxPlayers ? 'Full' : 'Join'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiting in Room */}
      {gameState.status === 'waiting' && (
        <div className="row">
          <div className="col-12">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h3 className="text-warning mb-3">
                  <i className="fas fa-clock me-2"></i>
                  Waiting for Opponent
                </h3>
                <p className="text-muted mb-4">
                  You are in a room. Waiting for another player to join...
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={leaveRoom}
                  >
                    <i className="fas fa-times me-2"></i>
                    Leave Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Playing */}
      {gameState.status === 'playing' && (
        <div className="row">
          <div className="col-12">
            {/* Game Canvas */}
            <div className="d-flex justify-content-center mb-4">
              <div className="border border-warning rounded" style={{ display: 'inline-block' }}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  style={{ display: 'block', background: '#2d5a2d' }}
                />
              </div>
            </div>

            {/* Game Controls */}
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-keyboard me-2"></i>
                      Controls
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-6">
                        <strong>Movement</strong>
                        <br />
                        <span className="badge bg-primary me-1">W/↑</span> Forward
                        <br />
                        <span className="badge bg-primary me-1">S/↓</span> Backward
                        <br />
                        <span className="badge bg-primary me-1">A/←</span> Turn Left
                        <br />
                        <span className="badge bg-primary me-1">D/→</span> Turn Right
                      </div>
                      <div className="col-6">
                        <strong>Combat</strong>
                        <br />
                        <span className="badge bg-danger me-1">SPACE</span> Shoot
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-users me-2"></i>
                      Players
                    </h6>
                  </div>
                  <div className="card-body">
                    {Object.entries(gameState.tanks || {}).map(([playerId, tank]) => (
                      <div key={playerId} className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <div 
                            className="rounded me-2" 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              backgroundColor: tank.color 
                            }}
                          ></div>
                          <span>{tank.username}</span>
                        </div>
                        <div className="progress" style={{ width: '60px', height: '15px' }}>
                          <div 
                            className={`progress-bar ${
                              tank.health > 50 ? 'bg-success' : 
                              tank.health > 25 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${tank.health}%` }}
                          >
                            {tank.health}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Finished */}
      {gameState.status === 'finished' && (
        <div className="row">
          <div className="col-12">
            <div className="card border-success">
              <div className="card-body text-center">
                <h3 className="text-success mb-3">
                  <i className="fas fa-trophy me-2"></i>
                  Battle Complete!
                </h3>
                {gameState.winner ? (
                  <div className="mb-4">
                    <h4 className="text-warning">
                      🏆 {gameState.winner.username} Wins!
                    </h4>
                    <p className="text-muted">
                      Congratulations! You've emerged victorious from the tank battle.
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h4 className="text-info">
                      Game Ended
                    </h4>
                    <p className="text-muted">
                      The battle has concluded.
                    </p>
                  </div>
                )}
                
                <button 
                  className="btn btn-warning btn-lg"
                  onClick={startNewGame}
                >
                  <i className="fas fa-door-open me-2"></i>
                  Back to Lobby
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankBattle;