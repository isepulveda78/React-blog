import React, { useState } from 'react';
import jsPDF from 'jspdf';

const CrosswordGenerator = ({ user }) => {
  const [acrossEntries, setAcrossEntries] = useState([{ clue: '', answer: '' }]);
  const [downEntries, setDownEntries] = useState([{ clue: '', answer: '' }]);
  const [title, setTitle] = useState('My Crossword Puzzle');
  const [isGenerating, setIsGenerating] = useState(false);

  // Add new entry for across words
  const addAcrossEntry = () => {
    setAcrossEntries([...acrossEntries, { clue: '', answer: '' }]);
  };

  // Add new entry for down words
  const addDownEntry = () => {
    setDownEntries([...downEntries, { clue: '', answer: '' }]);
  };

  // Update across entry
  const updateAcrossEntry = (index, field, value) => {
    const newEntries = [...acrossEntries];
    newEntries[index][field] = value;
    setAcrossEntries(newEntries);
  };

  // Update down entry
  const updateDownEntry = (index, field, value) => {
    const newEntries = [...downEntries];
    newEntries[index][field] = value;
    setDownEntries(newEntries);
  };

  // Remove across entry
  const removeAcrossEntry = (index) => {
    if (acrossEntries.length > 1) {
      const newEntries = acrossEntries.filter((_, i) => i !== index);
      setAcrossEntries(newEntries);
    }
  };

  // Remove down entry
  const removeDownEntry = (index) => {
    if (downEntries.length > 1) {
      const newEntries = downEntries.filter((_, i) => i !== index);
      setDownEntries(newEntries);
    }
  };

  // Generate a simple crossword grid layout
  const generateCrosswordLayout = (acrossEntries, downEntries) => {
    // Simple layout algorithm - create a basic crossword structure
    const gridSize = 15; // 15x15 grid
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const clues = { across: [], down: [] };
    let clueNumber = 1;

    // Place across words
    acrossEntries.forEach((entry, index) => {
      if (entry.answer.trim()) {
        const word = entry.answer.trim();
        const row = 2 + index * 2; // Space out the words
        const col = 1;
        if (row < gridSize && col + word.length < gridSize) {
          for (let i = 0; i < word.length; i++) {
            if (col + i < gridSize) {
              grid[row][col + i] = word[i].toUpperCase();
            }
          }
          clues.across.push({ 
            number: clueNumber + index, 
            clue: entry.clue || entry.answer, 
            answer: entry.answer,
            row, 
            col 
          });
        }
      }
    });

    // Place down words (intersecting with across words when possible)
    downEntries.forEach((entry, index) => {
      if (entry.answer.trim()) {
        const word = entry.answer.trim();
        const col = 3 + index * 2; // Space out the words
        const row = 1;
        if (col < gridSize && row + word.length < gridSize) {
          for (let i = 0; i < word.length; i++) {
            if (row + i < gridSize) {
              grid[row + i][col] = word[i].toUpperCase();
            }
          }
          clues.down.push({ 
            number: clueNumber + acrossEntries.length + index, 
            clue: entry.clue || entry.answer, 
            answer: entry.answer,
            row, 
            col 
          });
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

  // Helper function to add clues to PDF (compact layout for single page)
  const addCluesListCompact = (doc, clues, startX, startY, pageHeight, maxWidth) => {
    let yPosition = startY;
    const columnWidth = maxWidth / 2 - 10; // Two column layout
    
    // Across clues (left column)
    if (clues.across.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ACROSS', startX, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      clues.across.forEach((clue) => {
        if (yPosition > pageHeight - 20) {
          return; // Stop if we run out of space
        }
        // Wrap text if too long
        const clueText = `${clue.number}. ${clue.clue}`;
        if (clueText.length > 35) {
          const wrapped = clueText.substring(0, 35) + '...';
          doc.text(wrapped, startX, yPosition);
        } else {
          doc.text(clueText, startX, yPosition);
        }
        yPosition += 6;
      });
    }

    // Reset position for down clues (right column)
    let downStartY = startY;
    const downStartX = startX + columnWidth + 10;

    // Down clues (right column)
    if (clues.down.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DOWN', downStartX, downStartY);
      downStartY += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      clues.down.forEach((clue) => {
        if (downStartY > pageHeight - 20) {
          return; // Stop if we run out of space
        }
        // Wrap text if too long
        const clueText = `${clue.number}. ${clue.clue}`;
        if (clueText.length > 35) {
          const wrapped = clueText.substring(0, 35) + '...';
          doc.text(wrapped, downStartX, downStartY);
        } else {
          doc.text(clueText, downStartX, downStartY);
        }
        downStartY += 6;
      });
    }
    
    return Math.max(yPosition, downStartY);
  };

  // Generate PDF with crossword puzzle (answer key + blank puzzle)
  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Filter entries that have answers
      const validAcross = acrossEntries.filter(entry => entry.answer.trim());
      const validDown = downEntries.filter(entry => entry.answer.trim());
      
      if (validAcross.length === 0 && validDown.length === 0) {
        alert('Please add at least one word with an answer to generate a crossword puzzle.');
        setIsGenerating(false);
        return;
      }

      const { grid, clues } = generateCrosswordLayout(validAcross, validDown);
      const cellSize = 10; // Smaller cells to fit more content
      const startX = 20;
      const gridStartY = 35;
      const gridWidth = Math.min(grid[0].length * cellSize, pageWidth - 40);
      const gridHeight = grid.length * cellSize;

      // PAGE 1: ANSWER KEY
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title + ' - ANSWER KEY', pageWidth / 2, 20, { align: 'center' });

      // Draw grid with answers (smaller, positioned to leave room for clues)
      drawCrosswordGrid(doc, grid, clues, true, startX, gridStartY, cellSize);

      // Add clues to the right of the grid and below it
      const cluesStartY = gridStartY + gridHeight + 15;
      addCluesListCompact(doc, clues, startX, cluesStartY, pageHeight, pageWidth - 40);

      // Add footer to answer key page
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`Answer Key - Generated by BlogCraft Crossword Generator - ${new Date().toLocaleDateString()}`, 
               pageWidth / 2, pageHeight - 8, { align: 'center' });

      // PAGE 2: BLANK PUZZLE
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 20, { align: 'center' });

      // Draw grid without answers (empty boxes)
      drawCrosswordGrid(doc, grid, clues, false, startX, gridStartY, cellSize);

      // Add clues in compact format
      addCluesListCompact(doc, clues, startX, cluesStartY, pageHeight, pageWidth - 40);

      // Add footer to puzzle page
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`Student Worksheet - Generated by BlogCraft Crossword Generator - ${new Date().toLocaleDateString()}`, 
               pageWidth / 2, pageHeight - 8, { align: 'center' });

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

        {/* Across Clues */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-arrow-right me-2"></i>
                Across Clues & Answers
              </h5>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={addAcrossEntry}
              >
                <i className="fas fa-plus me-1"></i>
                Add Entry
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter English clues and their Spanish translations for horizontal words
                </small>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <strong>English Clue</strong>
                </div>
                <div className="col-md-6">
                  <strong>Spanish Answer</strong>
                </div>
              </div>
              {acrossEntries.map((entry, index) => (
                <div key={index} className="row mb-2 align-items-center">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      value={entry.clue}
                      onChange={(e) => updateAcrossEntry(index, 'clue', e.target.value)}
                      placeholder={`English clue ${index + 1} (e.g., "House")`}
                    />
                  </div>
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control"
                      value={entry.answer}
                      onChange={(e) => updateAcrossEntry(index, 'answer', e.target.value)}
                      placeholder={`Spanish answer ${index + 1} (e.g., "casa")`}
                    />
                  </div>
                  <div className="col-md-1">
                    {acrossEntries.length > 1 && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeAcrossEntry(index)}
                        type="button"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Down Clues */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-arrow-down me-2"></i>
                Down Clues & Answers
              </h5>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={addDownEntry}
              >
                <i className="fas fa-plus me-1"></i>
                Add Entry
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter English clues and their Spanish translations for vertical words
                </small>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <strong>English Clue</strong>
                </div>
                <div className="col-md-6">
                  <strong>Spanish Answer</strong>
                </div>
              </div>
              {downEntries.map((entry, index) => (
                <div key={index} className="row mb-2 align-items-center">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      value={entry.clue}
                      onChange={(e) => updateDownEntry(index, 'clue', e.target.value)}
                      placeholder={`English clue ${index + 1} (e.g., "Cat")`}
                    />
                  </div>
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control"
                      value={entry.answer}
                      onChange={(e) => updateDownEntry(index, 'answer', e.target.value)}
                      placeholder={`Spanish answer ${index + 1} (e.g., "gato")`}
                    />
                  </div>
                  <div className="col-md-1">
                    {downEntries.length > 1 && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeDownEntry(index)}
                        type="button"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                <li><strong>Add across clues</strong> - enter English clues with Spanish answers for horizontal words</li>
                <li><strong>Add down clues</strong> - enter English clues with Spanish answers for vertical words</li>
                <li><strong>Click "Generate Crossword PDF"</strong> to create and download your puzzle</li>
                <li><strong>Print and enjoy!</strong> Students will translate English clues to fill Spanish answers</li>
              </ol>
              <div className="alert alert-info mt-3">
                <strong>Perfect for Language Learning:</strong> Students read the English clues and write the Spanish translations in the crossword grid. The first PDF page shows the answer key for teachers, and the second page has empty boxes for students.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordGenerator;