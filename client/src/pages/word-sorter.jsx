const { React } = window;

const WordSorter = ({ user }) => {
  const [userName, setUserName] = React.useState('');
  const [newWord, setNewWord] = React.useState('');
  const [list1, setList1] = React.useState([]);
  const [list2, setList2] = React.useState([]);
  const [list1Title, setList1Title] = React.useState('List 1');
  const [list2Title, setList2Title] = React.useState('List 2');
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [draggedFrom, setDraggedFrom] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Set default user name from authenticated user
  React.useEffect(() => {
    if (user && user.name) {
      setUserName(user.name);
    }
  }, [user]);

  const addWord = () => {
    if (newWord.trim()) {
      setList1([...list1, { id: Date.now(), text: newWord.trim() }]);
      setNewWord('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addWord();
    }
  };

  const handleDragStart = (e, item, fromList) => {
    setDraggedItem(item);
    setDraggedFrom(fromList);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetList) => {
    e.preventDefault();
    
    if (!draggedItem || !draggedFrom) return;

    // Remove from source list
    if (draggedFrom === 'list1') {
      setList1(list1.filter(item => item.id !== draggedItem.id));
    } else {
      setList2(list2.filter(item => item.id !== draggedItem.id));
    }

    // Add to target list
    if (targetList === 'list1') {
      setList1([...list1, draggedItem]);
    } else {
      setList2([...list2, draggedItem]);
    }

    setDraggedItem(null);
    setDraggedFrom(null);
  };

  const removeWord = (wordId, fromList) => {
    if (fromList === 'list1') {
      setList1(list1.filter(item => item.id !== wordId));
    } else {
      setList2(list2.filter(item => item.id !== wordId));
    }
  };

  const exportToPDF = async () => {
    setIsLoading(true);
    try {
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 30;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Word Sorter Lists', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // User name
      if (userName.trim()) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Created by: ${userName}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;
      }

      // Date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 30;

      // List 1
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(list1Title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      if (list1.length === 0) {
        doc.text('(No words)', margin + 5, yPosition);
        yPosition += 10;
      } else {
        list1.forEach((word, index) => {
          doc.text(`${index + 1}. ${word.text}`, margin + 5, yPosition);
          yPosition += 8;
        });
      }
      yPosition += 20;

      // List 2
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(list2Title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      if (list2.length === 0) {
        doc.text('(No words)', margin + 5, yPosition);
        yPosition += 10;
      } else {
        list2.forEach((word, index) => {
          doc.text(`${index + 1}. ${word.text}`, margin + 5, yPosition);
          yPosition += 8;
        });
      }

      // Save the PDF
      const fileName = userName.trim() ? 
        `${userName.replace(/[^a-zA-Z0-9]/g, '_')}_word_sorter.pdf` : 
        'word_sorter.pdf';
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllLists = () => {
    if (confirm('Are you sure you want to clear all words from both lists?')) {
      setList1([]);
      setList2([]);
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">Word Sorter</h1>
            <a 
              href="/educational-tools" 
              className="btn btn-outline-secondary"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/educational-tools');
                window.location.reload();
              }}
            >
              ← Back to Tools
            </a>
          </div>

          {/* User Name Input */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card p-3">
                <h5>Student Information</h5>
                <div className="mb-3">
                  <label className="form-label">Your Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>

            {/* Add Word Section */}
            <div className="col-md-6">
              <div className="card p-3">
                <h5>Add New Word</h5>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a word and press Enter"
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={addWord}
                    disabled={!newWord.trim()}
                  >
                    Add Word
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List Titles */}
          <div className="row mb-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                value={list1Title}
                onChange={(e) => setList1Title(e.target.value)}
                placeholder="List 1 Title"
              />
            </div>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                value={list2Title}
                onChange={(e) => setList2Title(e.target.value)}
                placeholder="List 2 Title"
              />
            </div>
          </div>

          {/* Word Lists */}
          <div className="row">
            {/* List 1 */}
            <div className="col-md-6">
              <div 
                className="card h-100"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'list1')}
                style={{ minHeight: '400px' }}
              >
                <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0abde3', color: 'white' }}>
                  <h5 className="mb-0">{list1Title}</h5>
                  <span className="badge bg-light text-dark">{list1.length} words</span>
                </div>
                <div className="card-body">
                  {list1.length === 0 ? (
                    <p className="text-muted text-center py-5">
                      Drop words here or add new words above
                    </p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {list1.map((word) => (
                        <div
                          key={word.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, word, 'list1')}
                          className="badge bg-primary p-2 d-flex align-items-center gap-2"
                          style={{ cursor: 'grab', fontSize: '14px' }}
                        >
                          {word.text}
                          <button
                            className="btn-close btn-close-white"
                            style={{ fontSize: '10px' }}
                            onClick={() => removeWord(word.id, 'list1')}
                            title="Remove word"
                          ></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List 2 */}
            <div className="col-md-6">
              <div 
                className="card h-100"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'list2')}
                style={{ minHeight: '400px' }}
              >
                <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#222f3e', color: 'white' }}>
                  <h5 className="mb-0">{list2Title}</h5>
                  <span className="badge bg-light text-dark">{list2.length} words</span>
                </div>
                <div className="card-body">
                  {list2.length === 0 ? (
                    <p className="text-muted text-center py-5">
                      Drop words here from the other list
                    </p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {list2.map((word) => (
                        <div
                          key={word.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, word, 'list2')}
                          className="badge bg-secondary p-2 d-flex align-items-center gap-2"
                          style={{ cursor: 'grab', fontSize: '14px' }}
                        >
                          {word.text}
                          <button
                            className="btn-close btn-close-white"
                            style={{ fontSize: '10px' }}
                            onClick={() => removeWord(word.id, 'list2')}
                            title="Remove word"
                          ></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-success"
                  onClick={exportToPDF}
                  disabled={isLoading || (list1.length === 0 && list2.length === 0)}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Generating PDF...
                    </>
                  ) : (
                    <>📄 Export to PDF</>
                  )}
                </button>
                
                <button
                  className="btn btn-outline-danger"
                  onClick={clearAllLists}
                  disabled={list1.length === 0 && list2.length === 0}
                >
                  Clear All Lists
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h6>How to use:</h6>
                  <ul className="mb-0">
                    <li>Enter your name at the top</li>
                    <li>Type words in the input field and click "Add Word"</li>
                    <li>Drag words between the two lists to organize them</li>
                    <li>Customize list titles by clicking on them</li>
                    <li>Click the X on any word to remove it</li>
                    <li>Export your organized lists to PDF with your name</li>
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

window.WordSorter = WordSorter;