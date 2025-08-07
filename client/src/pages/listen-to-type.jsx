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
  
  const audioRef = useRef(null);
  
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

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-danger mb-3">Listen to Type</h1>
          <p className="lead text-muted">
            Practice your typing skills by listening to audio prompts and typing what you hear
          </p>
        </div>
      </div>

      {/* Score and Controls */}
      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <h5 className="text-success mb-1">{score}</h5>
                  <small className="text-muted">Correct</small>
                </div>
                <div className="col-md-3">
                  <h5 className="text-info mb-1">{totalAttempts}</h5>
                  <small className="text-muted">Total</small>
                </div>
                <div className="col-md-3">
                  <h5 className="text-warning mb-1">{getAccuracy()}%</h5>
                  <small className="text-muted">Accuracy</small>
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select form-select-sm"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <small className="text-muted">Difficulty</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-body">
              
              {/* Audio Controls */}
              <div className="text-center mb-4">
                <button 
                  className="btn btn-primary btn-lg me-3"
                  onClick={startNewChallenge}
                  disabled={isPlaying}
                >
                  <i className="fas fa-play me-2"></i>
                  {currentText ? 'New Challenge' : 'Start Challenge'}
                </button>
                
                {currentText && (
                  <button 
                    className="btn btn-outline-secondary btn-lg"
                    onClick={() => speakText(currentText)}
                    disabled={isPlaying}
                  >
                    <i className="fas fa-volume-up me-2"></i>
                    {isPlaying ? 'Playing...' : 'Repeat'}
                  </button>
                )}
              </div>

              {/* Typing Input */}
              {currentText && (
                <div className="mb-4">
                  <label className="form-label fw-bold">Type what you heard:</label>
                  <textarea
                    className="form-control form-control-lg"
                    rows="3"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Start typing here..."
                    disabled={showResult}
                  />
                </div>
              )}

              {/* Submit Button */}
              {currentText && !showResult && (
                <div className="text-center mb-3">
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={checkAnswer}
                    disabled={!userInput.trim()}
                  >
                    <i className="fas fa-check me-2"></i>
                    Check Answer
                  </button>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className={`alert ${feedback.includes('Perfect') ? 'alert-success' : 'alert-warning'} text-center`}>
                  <strong>{feedback}</strong>
                </div>
              )}

              {/* Next Challenge Button */}
              {showResult && (
                <div className="text-center">
                  <button 
                    className="btn btn-primary btn-lg me-3"
                    onClick={startNewChallenge}
                  >
                    <i className="fas fa-arrow-right me-2"></i>
                    Next Challenge
                  </button>
                  <button 
                    className="btn btn-outline-danger"
                    onClick={resetGame}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Reset Game
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="row mt-5">
        <div className="col-md-10 mx-auto">
          <div className="card border-info">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><i className="fas fa-info-circle me-2"></i>How to Play</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary">Instructions:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-play text-success me-2"></i>Click "Start Challenge" to begin</li>
                    <li><i className="fas fa-headphones text-info me-2"></i>Listen carefully to the audio</li>
                    <li><i className="fas fa-keyboard text-warning me-2"></i>Type exactly what you hear</li>
                    <li><i className="fas fa-check text-success me-2"></i>Click "Check Answer" or press Enter</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary">Tips:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-volume-up text-primary me-2"></i>Use the "Repeat" button if needed</li>
                    <li><i className="fas fa-cog text-secondary me-2"></i>Adjust difficulty level anytime</li>
                    <li><i className="fas fa-eye text-info me-2"></i>Pay attention to punctuation</li>
                    <li><i className="fas fa-chart-line text-success me-2"></i>Track your accuracy over time</li>
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