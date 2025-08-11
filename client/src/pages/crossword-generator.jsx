import React, { useState } from 'react';
import jsPDF from 'jspdf';

const CrosswordGenerator = ({ user }) => {
  const [acrossWords, setAcrossWords] = useState('');
  const [downWords, setDownWords] = useState('');
  const [title, setTitle] = useState('My Crossword Puzzle');
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse comma-separated words from input strings
  const parseWords = (input) => {
    return input.split(',').map(word => word.trim()).filter(word => word.length > 0);
  };

  // Generate a simple crossword grid layout
  const generateCrosswordLayout = (across, down) => {
    // Simple layout algorithm - create a basic crossword structure
    const gridSize = 15; // 15x15 grid
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const clues = { across: [], down: [] };
    let clueNumber = 1;

    // Place across words
    across.forEach((word, index) => {
      if (word.trim()) {
        const row = 2 + index * 2; // Space out the words
        const col = 1;
        if (row < gridSize && col + word.length < gridSize) {
          for (let i = 0; i < word.length; i++) {
            if (col + i < gridSize) {
              grid[row][col + i] = word[i].toUpperCase();
            }
          }
          clues.across.push({ number: clueNumber + index, clue: word, row, col });
        }
      }
    });

    // Place down words (intersecting with across words when possible)
    down.forEach((word, index) => {
      if (word.trim()) {
        const col = 3 + index * 2; // Space out the words
        const row = 1;
        if (col < gridSize && row + word.length < gridSize) {
          for (let i = 0; i < word.length; i++) {
            if (row + i < gridSize) {
              grid[row + i][col] = word[i].toUpperCase();
            }
          }
          clues.down.push({ number: clueNumber + across.length + index, clue: word, row, col });
        }
      }
    });

    return { grid, clues };
  };

  // Helper function to draw crossword grid
  const drawCrosswordGrid = (doc, grid, clues, showAnswers, startX, startY, cellSize) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Track which cells have clue numbers
    const clueNumbers = {};
    [...clues.across, ...clues.down].forEach(clue => {
      const key = `${clue.row}-${clue.col}`;
      if (!clueNumbers[key]) {
        clueNumbers[key] = clue.number;
      }
    });
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        
        if (grid[row][col] !== '') {
          // Draw cell border
          doc.rect(x, y, cellSize, cellSize);
          
          // Add clue number in top-left corner if this cell starts a word
          const cellKey = `${row}-${col}`;
          if (clueNumbers[cellKey]) {
            doc.setFontSize(7);
            doc.text(clueNumbers[cellKey].toString(), x + 1, y + 6);
          }
          
          // Add letter only if showing answers
          if (showAnswers) {
            doc.setFontSize(10);
            doc.text(grid[row][col], x + cellSize/2, y + cellSize/2 + 2, { align: 'center' });
          }
        }
      }
    }
  };

  // Helper function to add clues to PDF
  const addCluesList = (doc, clues, startX, startY, pageHeight) => {
    let yPosition = startY;
    
    // Across clues
    if (clues.across.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ACROSS', startX, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      clues.across.forEach((clue) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${clue.number}. ${clue.clue}`, startX, yPosition);
        yPosition += 8;
      });
    }

    yPosition += 10;

    // Down clues
    if (clues.down.length > 0) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DOWN', startX, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      clues.down.forEach((clue) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${clue.number}. ${clue.clue}`, startX, yPosition);
        yPosition += 8;
      });
    }
    
    return yPosition;
  };

  // Generate PDF with crossword puzzle (answer key + blank puzzle)
  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Parse comma-separated words
      const validAcross = parseWords(acrossWords);
      const validDown = parseWords(downWords);
      
      if (validAcross.length === 0 && validDown.length === 0) {
        alert('Please add at least one word to generate a crossword puzzle.');
        setIsGenerating(false);
        return;
      }

      const { grid, clues } = generateCrosswordLayout(validAcross, validDown);
      const cellSize = 12;
      const startX = 20;
      const gridStartY = 40;

      // PAGE 1: ANSWER KEY
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title + ' - ANSWER KEY', pageWidth / 2, 20, { align: 'center' });

      // Draw grid with answers
      drawCrosswordGrid(doc, grid, clues, true, startX, gridStartY, cellSize);

      // Add clues below the grid
      const cluesStartY = gridStartY + (grid.length * cellSize) + 20;
      addCluesList(doc, clues, startX, cluesStartY, pageHeight);

      // Add footer to answer key page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Answer Key - Generated by BlogCraft Crossword Generator - ${new Date().toLocaleDateString()}`, 
               pageWidth / 2, pageHeight - 10, { align: 'center' });

      // PAGE 2: BLANK PUZZLE
      doc.addPage();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 20, { align: 'center' });

      // Draw grid without answers (empty boxes)
      drawCrosswordGrid(doc, grid, clues, false, startX, gridStartY, cellSize);

      // Add clues below the grid
      addCluesList(doc, clues, startX, cluesStartY, pageHeight);

      // Add footer to puzzle page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Student Worksheet - Generated by BlogCraft Crossword Generator - ${new Date().toLocaleDateString()}`, 
               pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_crossword.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-secondary mb-3">
            <i className="fas fa-puzzle-piece me-3"></i>
            Crossword Generator
          </h1>
          <p className="lead text-muted">
            Create custom crossword puzzles by adding your across and down words, then export as PDF
          </p>
        </div>
      </div>

      <div className="row">
        {/* Settings Panel */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                Crossword Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Puzzle Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter crossword title"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Across Words */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-arrow-right me-2"></i>
                Across Words
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter words or phrases separated by commas (e.g., cat, dog, house, tree)
                </small>
              </div>
              <textarea
                className="form-control"
                rows="6"
                value={acrossWords}
                onChange={(e) => setAcrossWords(e.target.value)}
                placeholder="Enter across words separated by commas..."
                style={{ resize: 'vertical' }}
              />
              {acrossWords && (
                <div className="mt-2">
                  <small className="text-muted">
                    Words: {parseWords(acrossWords).length}
                  </small>
                  {parseWords(acrossWords).length > 0 && (
                    <div className="mt-1">
                      {parseWords(acrossWords).map((word, index) => (
                        <span key={index} className="badge bg-primary me-1 mb-1">
                          {index + 1}. {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Down Words */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-arrow-down me-2"></i>
                Down Words
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter words or phrases separated by commas (e.g., apple, banana, orange, grape)
                </small>
              </div>
              <textarea
                className="form-control"
                rows="6"
                value={downWords}
                onChange={(e) => setDownWords(e.target.value)}
                placeholder="Enter down words separated by commas..."
                style={{ resize: 'vertical' }}
              />
              {downWords && (
                <div className="mt-2">
                  <small className="text-muted">
                    Words: {parseWords(downWords).length}
                  </small>
                  {parseWords(downWords).length > 0 && (
                    <div className="mt-1">
                      {parseWords(downWords).map((word, index) => (
                        <span key={index} className="badge bg-success me-1 mb-1">
                          {index + 1}. {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="row mt-4">
        <div className="col-12 text-center">
          <button
            className="btn btn-success btn-lg"
            onClick={generatePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Generating PDF...
              </>
            ) : (
              <>
                <i className="fas fa-file-pdf me-2"></i>
                Generate Crossword PDF
              </>
            )}
          </button>
          <div className="mt-3">
            <small className="text-muted">
              The PDF will contain two pages: Answer Key (with solutions) and Student Worksheet (empty boxes)
            </small>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                How to Use
              </h5>
            </div>
            <div className="card-body">
              <ol>
                <li><strong>Enter a title</strong> for your crossword puzzle</li>
                <li><strong>Add across words</strong> - enter words separated by commas for horizontal placement</li>
                <li><strong>Add down words</strong> - enter words separated by commas for vertical placement</li>
                <li><strong>Click "Generate Crossword PDF"</strong> to create and download your puzzle</li>
                <li><strong>Print and enjoy!</strong> The PDF includes the grid and numbered clues</li>
              </ol>
              <div className="alert alert-info mt-3">
                <strong>Tip:</strong> The crossword generator creates two pages - the first page shows the answer key for teachers, and the second page has empty boxes for students to fill in.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordGenerator;