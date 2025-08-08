import React, { useState } from 'react';

const { toast } = window;

const BingoGenerator = () => {
  const [title, setTitle] = useState('');
  const [minNumber, setMinNumber] = useState(1);
  const [maxNumber, setMaxNumber] = useState(75);
  const [numCards, setNumCards] = useState(1);
  const [includeFree, setIncludeFree] = useState(true);
  const [previewCard, setPreviewCard] = useState(null);

  // Generate a single bingo card
  const generateBingoCard = () => {
    const numbers = [];
    const range = maxNumber - minNumber + 1;
    
    if (range < 24) {
      toast({
        title: "Validation Error",
        description: "Number range must be at least 24 numbers for a valid bingo card",
        variant: "destructive"
      });
      return null;
    }

    // Generate available numbers
    const availableNumbers = [];
    for (let i = minNumber; i <= maxNumber; i++) {
      availableNumbers.push(i);
    }

    // Shuffle and select 24 numbers (25 spaces minus center if FREE)
    const selectedNumbers = [];
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 24; i++) {
      selectedNumbers.push(shuffled[i]);
    }

    // Create 5x5 grid
    const card = [];
    let numberIndex = 0;
    
    for (let row = 0; row < 5; row++) {
      const cardRow = [];
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2 && includeFree) {
          cardRow.push('FREE');
        } else {
          cardRow.push(selectedNumbers[numberIndex]);
          numberIndex++;
        }
      }
      card.push(cardRow);
    }

    return card;
  };

  const handlePreview = () => {
    const card = generateBingoCard();
    setPreviewCard(card);
  };

  const generatePDF = () => {
    // For now, we'll generate multiple cards and display them
    // In a real implementation, you'd use a PDF library like jsPDF
    const cards = [];
    for (let i = 0; i < numCards; i++) {
      cards.push(generateBingoCard());
    }
    
    // Create a new window with printable content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title || 'Bingo Cards'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .card { page-break-after: always; margin-bottom: 30px; }
            .card:last-child { page-break-after: avoid; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 400px; margin: 0 auto; border-collapse: collapse; }
            td { width: 80px; height: 80px; border: 2px solid #000; text-align: center; font-size: 18px; font-weight: bold; }
            th { width: 80px; height: 60px; border: 2px solid #000; text-align: center; font-size: 24px; font-weight: bold; background-color: #333; color: white; }
            .free { background-color: #f0f0f0; }
            @media print { .card { page-break-after: always; } }
          </style>
        </head>
        <body>
          ${cards.map((card, index) => `
            <div class="card">
              <h2>${title || 'BINGO'}</h2>
              <table>
                <thead>
                  <tr>
                    <th>B</th>
                    <th>I</th>
                    <th>N</th>
                    <th>G</th>
                    <th>O</th>
                  </tr>
                </thead>
                <tbody>
                  ${card.map(row => `
                    <tr>
                      ${row.map(cell => `
                        <td class="${cell === 'FREE' ? 'free' : ''}">${cell}</td>
                      `).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="text-center mb-4">Bingo Card Generator</h1>
          <p className="text-center text-muted mb-5">
            Create custom bingo cards with random number distribution
          </p>
        </div>
      </div>

      <div className="row">
        {/* Configuration Panel */}
        <div className="col-md-6">
          <div className="card p-4">
            <h3 className="mb-4">Configuration</h3>
            
            {/* Title Input */}
            <div className="mb-3">
              <label className="form-label">Title (Optional):</label>
              <input 
                type="text" 
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter bingo card title"
              />
            </div>

            {/* Number Range */}
            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Min Number:</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={minNumber}
                  onChange={(e) => setMinNumber(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="col-6">
                <label className="form-label">Max Number:</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={maxNumber}
                  onChange={(e) => setMaxNumber(parseInt(e.target.value) || 75)}
                  min="25"
                />
              </div>
            </div>

            {/* Number of Cards */}
            <div className="mb-3">
              <label className="form-label">Number of Cards:</label>
              <input 
                type="number" 
                className="form-control"
                value={numCards}
                onChange={(e) => setNumCards(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
              />
            </div>

            {/* FREE Space Option */}
            <div className="mb-4">
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="includeFree"
                  checked={includeFree}
                  onChange={(e) => setIncludeFree(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeFree">
                  Include FREE space
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary flex-fill"
                onClick={handlePreview}
              >
                Preview Card
              </button>
              <button 
                className="btn btn-primary flex-fill"
                onClick={generatePDF}
              >
                Generate PDF
              </button>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-4">
            <h5>Features:</h5>
            <ul className="list-unstyled">
              <li>• Random number distribution</li>
              <li>• Customizable number ranges</li>
              <li>• Multiple cards per PDF</li>
              <li>• Large, readable format</li>
              <li>• Optional FREE space</li>
              <li>• Professional PDF output</li>
            </ul>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="col-md-6">
          <div className="card p-4">
            <h3 className="mb-4">Preview</h3>
            
            {previewCard ? (
              <div className="text-center">
                <h4 className="mb-3">{title || 'BINGO'}</h4>
                <table className="table table-bordered mx-auto" style={{width: '300px'}}>
                  <thead>
                    <tr>
                      {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
                        <th 
                          key={index}
                          className="text-center bg-dark text-white"
                          style={{
                            width: '60px',
                            height: '50px',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}
                        >
                          {letter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewCard.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td 
                            key={colIndex} 
                            className={`text-center ${cell === 'FREE' ? 'bg-light' : ''}`}
                            style={{
                              width: '60px',
                              height: '60px',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-5">
                <p>Click "Preview Card" to see a sample bingo card</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BingoGenerator;