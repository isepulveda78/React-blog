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
  if (gridSize !== 5) {
    // For non-5x5 grids, use simple random placement
    const shuffledWords = shuffleArray(words);
    const cellsNeeded = gridSize * gridSize;
    
    const card = [];
    let wordIndex = 0;
    
    for (let i = 0; i < cellsNeeded; i++) {
      if (wordIndex < shuffledWords.length) {
        card.push(shuffledWords[wordIndex]);
        wordIndex++;
      } else {
        card.push(shuffledWords[wordIndex % shuffledWords.length]);
        wordIndex++;
      }
    }
    
    return card;
  }
  
  // For 5x5 BINGO cards, organize by columns
  const shuffledWords = shuffleArray(words);
  const wordsPerColumn = 4; // 5 rows minus header, and center is FREE for N column
  const totalWordsNeeded = wordsPerColumn * 5; // 4 words per column × 5 columns = 20 words
  
  // Distribute words across columns
  const columns = {
    B: [], I: [], N: [], G: [], O: []
  };
  
  const columnKeys = ['B', 'I', 'N', 'G', 'O'];
  let wordIndex = 0;
  
  // Fill each column with words
  for (let col = 0; col < 5; col++) {
    const columnKey = columnKeys[col];
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        // Center space is FREE for N column
        columns[columnKey].push('FREE');
      } else {
        if (wordIndex < shuffledWords.length) {
          columns[columnKey].push(shuffledWords[wordIndex]);
          wordIndex++;
        } else {
          // If we run out of words, repeat from the beginning
          columns[columnKey].push(shuffledWords[wordIndex % shuffledWords.length]);
          wordIndex++;
        }
      }
    }
  }
  
  // Convert columns to flat array for display
  const card = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const columnKey = columnKeys[col];
      card.push(columns[columnKey][row]);
    }
  }
  
  return { card, columns };
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
    
    const result = generateRandomCard(wordList, gridSize);
    if (gridSize === 5 && result.card) {
      setCurrentCard(result.card);
    } else {
      setCurrentCard(result);
    }
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
      const maxCardSize = Math.min(pageWidth - (2 * margin), 150); // Limit card size
      const cellSize = maxCardSize / gridSize;
      
      for (let cardNum = 0; cardNum < numCards; cardNum++) {
        if (cardNum > 0) {
          pdf.addPage();
        }
        
        // Generate random card
        const result = generateRandomCard(wordList, gridSize);
        const card = gridSize === 5 && result.card ? result.card : result;
        
        // Title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const titleWidth = pdf.getTextWidth(cardTitle);
        pdf.text(cardTitle, (pageWidth - titleWidth) / 2, margin + 15);
        
        // Card number (if multiple cards)
        if (numCards > 1) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const cardLabel = `Card ${cardNum + 1}`;
          const labelWidth = pdf.getTextWidth(cardLabel);
          pdf.text(cardLabel, (pageWidth - labelWidth) / 2, margin + 30);
        }
        
        // Center the grid horizontally
        const gridStartX = (pageWidth - maxCardSize) / 2;
        const gridStartY = margin + (numCards > 1 ? 45 : 30);
        
        // Draw column headers for 5x5 BINGO cards
        if (gridSize === 5) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          const letters = ['B', 'I', 'N', 'G', 'O'];
          for (let col = 0; col < 5; col++) {
            const headerX = gridStartX + (col * cellSize) + cellSize / 2;
            const headerY = gridStartY - 10;
            const letterWidth = pdf.getTextWidth(letters[col]);
            pdf.text(letters[col], headerX - letterWidth / 2, headerY);
          }
        }
        
        // Draw the bingo grid
        pdf.setLineWidth(0.5);
        pdf.setFont('helvetica', 'normal');
        
        // Calculate appropriate font size based on cell size
        let fontSize = Math.min(12, cellSize / 4);
        if (fontSize < 6) fontSize = 6;
        pdf.setFontSize(fontSize);
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const x = gridStartX + (col * cellSize);
            const y = gridStartY + (row * cellSize);
            const cellIndex = row * gridSize + col;
            const word = card[cellIndex];
            
            // Draw cell border with black outline
            pdf.setDrawColor(0, 0, 0); // Black border
            pdf.setFillColor(255, 255, 255); // White background
            pdf.rect(x, y, cellSize, cellSize, 'FD'); // Fill and Draw
            
            // Special styling for FREE space
            if (word === 'FREE') {
              pdf.setFillColor(230, 230, 230); // Light gray background for FREE
              pdf.rect(x, y, cellSize, cellSize, 'FD');
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(Math.min(14, cellSize / 3));
            } else {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(fontSize);
            }
            
            // Add text in center of cell
            if (word) {
              // Split long words if needed
              let displayText = word;
              let currentFontSize = word === 'FREE' ? Math.min(14, cellSize / 3) : fontSize;
              
              // Check if text fits, if not, reduce font size
              let textWidth = pdf.getTextWidth(displayText);
              while (textWidth > cellSize - 4 && currentFontSize > 4) {
                currentFontSize -= 0.5;
                pdf.setFontSize(currentFontSize);
                textWidth = pdf.getTextWidth(displayText);
              }
              
              // If still too long, try to split the word
              if (textWidth > cellSize - 4) {
                const maxCharsPerLine = Math.floor((cellSize - 4) / (textWidth / displayText.length));
                if (displayText.length > maxCharsPerLine && maxCharsPerLine > 3) {
                  const lines = [];
                  for (let i = 0; i < displayText.length; i += maxCharsPerLine) {
                    lines.push(displayText.substring(i, i + maxCharsPerLine));
                  }
                  displayText = lines;
                }
              }
              
              const textX = x + cellSize / 2;
              const textY = y + cellSize / 2;
              
              if (Array.isArray(displayText)) {
                // Multi-line text
                const lineHeight = currentFontSize * 0.3;
                const totalHeight = displayText.length * lineHeight;
                const startY = textY - totalHeight / 2 + lineHeight / 2;
                
                displayText.forEach((line, index) => {
                  const lineWidth = pdf.getTextWidth(line);
                  pdf.text(line, textX - lineWidth / 2, startY + (index * lineHeight));
                });
              } else {
                // Single line text
                const finalTextWidth = pdf.getTextWidth(displayText);
                pdf.text(displayText, textX - finalTextWidth / 2, textY + currentFontSize / 3);
              }
            }
          }
        }
        
        // Instructions at bottom
        const instructionY = gridStartY + maxCardSize + 20;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const instructions = 'Instructions: Mark off words as they are called. Get 5 in a row (horizontal, vertical, or diagonal) to win!';
        const splitInstructions = pdf.splitTextToSize(instructions, pageWidth - (2 * margin));
        pdf.text(splitInstructions, margin, instructionY);
        
        // For non-5x5 grids, add generic "BINGO" header if there's space
        if (gridSize !== 5 && gridStartY > 50) {
          pdf.setFontSize(24);
          pdf.setFont('helvetica', 'bold');
          const bingoText = 'BINGO';
          const bingoWidth = pdf.getTextWidth(bingoText);
          if (bingoWidth <= maxCardSize) {
            pdf.text(bingoText, (pageWidth - bingoWidth) / 2, gridStartY - 15);
          }
        }
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
          <h1 className="display-4 fw-bold text-primary mb-3">Bingo Generator</h1>
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
                  {gridSize === 5 ? '5x5 Traditional BINGO with B-I-N-G-O columns and FREE center space' : `${gridSize}x${gridSize} grid needs ${gridSize * gridSize} words`}
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
                  
                  {/* BINGO Column Headers for 5x5 grid */}
                  {gridSize === 5 && (
                    <div 
                      className="bingo-headers mx-auto mb-2"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(5, 1fr)`,
                        gap: '2px',
                        maxWidth: '400px',
                        backgroundColor: '#000'
                      }}
                    >
                      {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
                        <div
                          key={index}
                          className="bingo-header d-flex align-items-center justify-content-center text-center"
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            minHeight: '40px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            border: '1px solid #0056b3'
                          }}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                  )}
                  
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