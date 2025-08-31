import React, { useState, useEffect, useRef } from 'react';

const TankBattle = ({ user }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, playing, finished
    players: [],
    tanks: {},
    bullets: [],
    gameRoom: null,
    winner: null
  });
  const [socket, setSocket] = useState(null);
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

  const joinQueue = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_queue',
        userId: user.id,
        username: user.name
      }));
    }
  };

  const leaveQueue = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'leave_queue',
        userId: user.id
      }));
    }
  };

  const startNewGame = () => {
    setGameState({
      status: 'waiting',
      players: [],
      tanks: {},
      bullets: [],
      gameRoom: null,
      winner: null
    });
    joinQueue();
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
          <h1 className="display-4 fw-bold text-primary mb-3">Tank Battle</h1>
          <p className="lead text-muted">
            Real-time multiplayer tank combat game for two players
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-9">
          <div className="card">
            <div className="card-body text-center">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  border: '2px solid #333',
                  backgroundColor: '#2d5a2d',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Game Status</h5>
            </div>
            <div className="card-body">
              {gameState.status === 'waiting' && (
                <div>
                  <p className="text-muted">Waiting for opponent...</p>
                  <p>Players: {gameState.players.length}/2</p>
                  {gameState.players.length === 0 ? (
                    <button className="btn btn-primary btn-sm" onClick={joinQueue}>
                      Join Queue
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={leaveQueue}>
                      Leave Queue
                    </button>
                  )}
                </div>
              )}

              {gameState.status === 'playing' && (
                <div>
                  <p className="text-success fw-bold">Game Active!</p>
                  <p>Players: {gameState.players.length}/2</p>
                  {gameState.players.map((player, index) => (
                    <div key={player.userId} className="mb-2">
                      <small className={player.userId === user.id ? 'fw-bold' : ''}>
                        {player.username} {player.userId === user.id ? '(You)' : ''}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {gameState.status === 'finished' && (
                <div>
                  <p className="text-info fw-bold">Game Over!</p>
                  {gameState.winner && (
                    <p className={gameState.winner.userId === user.id ? 'text-success' : 'text-danger'}>
                      Winner: {gameState.winner.username}
                      {gameState.winner.userId === user.id ? ' (You!)' : ''}
                    </p>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={startNewGame}>
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Controls</h6>
            </div>
            <div className="card-body">
              <small>
                <strong>Movement:</strong><br/>
                W/↑ - Move forward<br/>
                S/↓ - Move backward<br/>
                A/← - Turn left<br/>
                D/→ - Turn right<br/>
                <strong>Combat:</strong><br/>
                Spacebar - Shoot
              </small>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">How to Play</h6>
            </div>
            <div className="card-body">
              <small>
                <ul className="mb-0">
                  <li>Join the queue to find an opponent</li>
                  <li>Move your tank and shoot at your opponent</li>
                  <li>Each hit reduces health by 25 points</li>
                  <li>First tank to reach 0 health loses</li>
                  <li>Strategic movement and timing are key!</li>
                </ul>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TankBattle;