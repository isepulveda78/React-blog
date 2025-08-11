import React, { useState } from 'react';
import jsPDF from 'jspdf';

const CrosswordGenerator = ({ user }) => {
  const [acrossWords, setAcrossWords] = useState(['']);
  const [downWords, setDownWords] = useState(['']);
  const [title, setTitle] = useState('My Crossword Puzzle');
  const [isGenerating, setIsGenerating] = useState(false);

  // Add new input field for across words
  const addAcrossWord = () => {
    setAcrossWords([...acrossWords, '']);
  };

  // Add new input field for down words  
  const addDownWord = () => {
    setDownWords([...downWords, '']);
  };

  // Update across word at index
  const updateAcrossWord = (index, value) => {
    const newWords = [...acrossWords];
    newWords[index] = value;
    setAcrossWords(newWords);
  };

  // Update down word at index
  const updateDownWord = (index, value) => {
    const newWords = [...downWords];
    newWords[index] = value;
    setDownWords(newWords);
  };

  // Remove across word at index
  const removeAcrossWord = (index) => {
    if (acrossWords.length > 1) {
      const newWords = acrossWords.filter((_, i) => i !== index);
      setAcrossWords(newWords);
    }
  };

  // Remove down word at index
  const removeDownWord = (index) => {
    if (downWords.length > 1) {
      const newWords = downWords.filter((_, i) => i !== index);
      setDownWords(newWords);
    }
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

  // Generate PDF with crossword puzzle
  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Filter out empty words
      const validAcross = acrossWords.filter(word => word.trim());
      const validDown = downWords.filter(word => word.trim());
      
      if (validAcross.length === 0 && validDown.length === 0) {
        alert('Please add at least one word to generate a crossword puzzle.');
        setIsGenerating(false);
        return;
      }

      const { grid, clues } = generateCrosswordLayout(validAcross, validDown);

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 20, { align: 'center' });

      // Draw grid
      const cellSize = 12;
      const startX = 20;
      const startY = 40;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const x = startX + col * cellSize;
          const y = startY + row * cellSize;
          
          if (grid[row][col] !== '') {
            // Draw cell border
            doc.rect(x, y, cellSize, cellSize);
            // Add letter (for answer key - remove for blank puzzle)
            doc.text(grid[row][col], x + cellSize/2, y + cellSize/2 + 2, { align: 'center' });
          }
        }
      }

      // Add clues
      let yPosition = startY + (grid.length * cellSize) + 20;
      
      // Across clues
      if (clues.across.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ACROSS', startX, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        clues.across.forEach((clue, index) => {
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
        clues.down.forEach((clue, index) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${clue.number}. ${clue.clue}`, startX, yPosition);
          yPosition += 8;
        });
      }

      // Add footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated by BlogCraft Crossword Generator - ${new Date().toLocaleDateString()}`, 
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-arrow-right me-2"></i>
                Across Words
              </h5>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={addAcrossWord}
              >
                <i className="fas fa-plus me-1"></i>
                Add Word
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter words or phrases that will go horizontally across the puzzle
                </small>
              </div>
              {acrossWords.map((word, index) => (
                <div key={index} className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">{index + 1}</span>
                    <input
                      type="text"
                      className="form-control"
                      value={word}
                      onChange={(e) => updateAcrossWord(index, e.target.value)}
                      placeholder="Enter across word/phrase"
                    />
                    {acrossWords.length > 1 && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => removeAcrossWord(index)}
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

        {/* Down Words */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-arrow-down me-2"></i>
                Down Words
              </h5>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={addDownWord}
              >
                <i className="fas fa-plus me-1"></i>
                Add Word
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">
                  Enter words or phrases that will go vertically down the puzzle
                </small>
              </div>
              {downWords.map((word, index) => (
                <div key={index} className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">{index + 1}</span>
                    <input
                      type="text"
                      className="form-control"
                      value={word}
                      onChange={(e) => updateDownWord(index, e.target.value)}
                      placeholder="Enter down word/phrase"
                    />
                    {downWords.length > 1 && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => removeDownWord(index)}
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
              The PDF will include your crossword grid with numbered clues below
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
                <li><strong>Add across words</strong> - these will be placed horizontally in the grid</li>
                <li><strong>Add down words</strong> - these will be placed vertically in the grid</li>
                <li><strong>Click "Generate Crossword PDF"</strong> to create and download your puzzle</li>
                <li><strong>Print and enjoy!</strong> The PDF includes the grid and numbered clues</li>
              </ol>
              <div className="alert alert-info mt-3">
                <strong>Tip:</strong> The crossword generator will automatically arrange your words in a grid format and number them for easy reference with the clues list.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordGenerator;