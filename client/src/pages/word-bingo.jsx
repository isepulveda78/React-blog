import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';

// Utility function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Utility function to generate a random bingo card
const generateRandomCard = (words, gridSize) => {
  const shuffledWords = shuffleArray(words);
  const cellsNeeded = gridSize * gridSize;
  const centerIndex = Math.floor(cellsNeeded / 2);
  
  const card = [];
  let wordIndex = 0;
  
  for (let i = 0; i < cellsNeeded; i++) {
    if (gridSize === 5 && i === centerIndex) {
      // Center space is FREE for 5x5 grids
      card.push('FREE');
    } else if (wordIndex < shuffledWords.length) {
      card.push(shuffledWords[wordIndex]);
      wordIndex++;
    } else {
      // If we run out of words, repeat from the beginning
      card.push(shuffledWords[wordIndex % shuffledWords.length]);
      wordIndex++;
    }
  }
  
  return card;
};

const WordBingo = ({ user }) => {
  const [words, setWords] = useState('');
  const [wordList, setWordList] = useState([]);
  const [gridSize, setGridSize] = useState(5);
  const [currentCard, setCurrentCard] = useState([]);
  const [numCards, setNumCards] = useState(1);
  const [cardTitle, setCardTitle] = useState('Word Bingo');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef(null);

  const handleWordsChange = (e) => {
    const input = e.target.value;
    setWords(input);
    
    // Split by commas or new lines and clean up
    const wordArray = input
      .split(/[,\n]/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    setWordList(wordArray);
  };

  const generateSingleCard = () => {
    if (wordList.length === 0) {
      alert('Please enter some words first!');
      return;
    }
    
    const minWords = gridSize === 5 ? 24 : gridSize * gridSize; // 24 for 5x5 (FREE space), full grid for others
    if (wordList.length < minWords) {
      alert(`You need at least ${minWords} words for a ${gridSize}x${gridSize} grid!`);
      return;
    }
    
    const card = generateRandomCard(wordList, gridSize);
    setCurrentCard(card);
  };

  const exportToPDF = () => {
    if (wordList.length === 0) {
      alert('Please enter some words first!');
      return;
    }
    
    const minWords = gridSize === 5 ? 24 : gridSize * gridSize;
    if (wordList.length < minWords) {
      alert(`You need at least ${minWords} words for a ${gridSize}x${gridSize} grid!`);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const cardWidth = pageWidth - (2 * margin);
      const cardHeight = cardWidth; // Square cards
      
      for (let cardNum = 0; cardNum < numCards; cardNum++) {
        if (cardNum > 0) {
          pdf.addPage();
        }
        
        // Generate random card
        const card = generateRandomCard(wordList, gridSize);
        
        // Title
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        const titleWidth = pdf.getTextWidth(cardTitle);
        pdf.text(cardTitle, (pageWidth - titleWidth) / 2, margin + 10);
        
        // Card number (if multiple cards)
        if (numCards > 1) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'normal');
          const cardLabel = `Card ${cardNum + 1}`;
          const labelWidth = pdf.getTextWidth(cardLabel);
          pdf.text(cardLabel, (pageWidth - labelWidth) / 2, margin + 25);
        }
        
        // Grid
        const startY = margin + (numCards > 1 ? 40 : 25);
        const cellSize = cardWidth / gridSize;
        
        // Draw grid and text
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const x = margin + (col * cellSize);
            const y = startY + (row * cellSize);
            const cellIndex = row * gridSize + col;
            const word = card[cellIndex];
            
            // Draw cell border
            pdf.rect(x, y, cellSize, cellSize);
            
            // Add text in center of cell
            if (word) {
              const textWidth = pdf.getTextWidth(word);
              const textX = x + (cellSize - textWidth) / 2;
              const textY = y + cellSize / 2 + 2; // +2 for vertical centering
              
              // Handle long text by reducing font size if needed
              if (textWidth > cellSize - 4) {
                const newFontSize = Math.max(6, 10 * (cellSize - 4) / textWidth);
                pdf.setFontSize(newFontSize);
                const newTextWidth = pdf.getTextWidth(word);
                const newTextX = x + (cellSize - newTextWidth) / 2;
                pdf.text(word, newTextX, textY);
                pdf.setFontSize(10); // Reset font size
              } else {
                pdf.text(word, textX, textY);
              }
            }
          }
        }
        
        // Instructions at bottom
        const instructions = 'Instructions: Mark off words as they are called. Get 5 in a row (horizontal, vertical, or diagonal) to win!';
        pdf.setFontSize(8);
        const instructionY = startY + cardHeight + 15;
        const splitInstructions = pdf.splitTextToSize(instructions, cardWidth);
        pdf.text(splitInstructions, margin, instructionY);
      }
      
      // Save the PDF
      const filename = `${cardTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_bingo_cards.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">Word Bingo Generator</h1>
          <p className="lead text-muted">
            Create random bingo cards with your custom word lists and export to PDF
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Settings</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Card Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="Enter card title"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Grid Size</label>
                <select
                  className="form-select"
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                >
                  <option value={3}>3x3 Grid</option>
                  <option value={4}>4x4 Grid</option>
                  <option value={5}>5x5 Grid (Traditional)</option>
                </select>
                <small className="text-muted">
                  {gridSize === 5 ? '5x5 includes a FREE center space' : `${gridSize}x${gridSize} grid needs ${gridSize * gridSize} words`}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Words ({wordList.length} entered)
                </label>
                <textarea
                  className="form-control"
                  rows="8"
                  value={words}
                  onChange={handleWordsChange}
                  placeholder="Enter words separated by commas or new lines&#10;Example:&#10;apple, banana, orange&#10;grape&#10;watermelon"
                />
                <small className="text-muted">
                  Minimum needed: {gridSize === 5 ? 24 : gridSize * gridSize} words
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Number of Cards to Generate</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="50"
                  value={numCards}
                  onChange={(e) => setNumCards(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                />
                <small className="text-muted">Generate 1-50 unique cards</small>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={generateSingleCard}
                  disabled={wordList.length === 0}
                >
                  Preview Single Card
                </button>
                <button
                  className="btn btn-success"
                  onClick={exportToPDF}
                  disabled={wordList.length === 0 || isGenerating}
                >
                  {isGenerating ? 'Generating PDF...' : `Export ${numCards} Card${numCards > 1 ? 's' : ''} to PDF`}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Preview</h5>
            </div>
            <div className="card-body">
              {currentCard.length > 0 ? (
                <div className="text-center">
                  <h4 className="mb-3">{cardTitle}</h4>
                  <div 
                    ref={cardRef}
                    className="bingo-card mx-auto"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                      gap: '2px',
                      maxWidth: '400px',
                      backgroundColor: '#000'
                    }}
                  >
                    {currentCard.map((word, index) => (
                      <div
                        key={index}
                        className="bingo-cell d-flex align-items-center justify-content-center text-center"
                        style={{
                          backgroundColor: word === 'FREE' ? '#e3f2fd' : '#fff',
                          minHeight: '60px',
                          padding: '5px',
                          fontSize: word === 'FREE' ? '14px' : '12px',
                          fontWeight: word === 'FREE' ? 'bold' : 'normal',
                          border: '1px solid #ddd',
                          wordBreak: 'break-word',
                          lineHeight: '1.2'
                        }}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                  <p className="text-muted mt-3">
                    This is a preview of one card. PDF export will generate {numCards} unique card{numCards > 1 ? 's' : ''}.
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <h5>No card generated yet</h5>
                  <p>Enter your words and click "Preview Single Card" to see a sample.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">How to Use</h5>
            </div>
            <div className="card-body">
              <ol>
                <li><strong>Enter Words:</strong> Type your words in the text area, separated by commas or new lines.</li>
                <li><strong>Choose Grid Size:</strong> Select 3x3, 4x4, or 5x5 (traditional bingo with FREE center space).</li>
                <li><strong>Set Number of Cards:</strong> Choose how many unique cards you want to generate.</li>
                <li><strong>Preview:</strong> Click "Preview Single Card" to see what your cards will look like.</li>
                <li><strong>Export:</strong> Click "Export to PDF" to generate and download your bingo cards.</li>
              </ol>
              <div className="alert alert-info mt-3">
                <strong>Tips:</strong>
                <ul className="mb-0">
                  <li>Each PDF export creates unique cards with different word arrangements</li>
                  <li>Make sure you have enough words for your grid size</li>
                  <li>Shorter words work better for readability</li>
                  <li>Perfect for vocabulary practice, review sessions, or fun classroom activities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordBingo;