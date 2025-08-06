import React, { useState, useRef, useEffect } from 'react';

const BUILDING_TYPES = {
  residential: {
    house: { name: "House", icon: "🏠", width: 60, height: 50, color: "#4ade80" },
    apartment: { name: "Apartment", icon: "🏢", width: 80, height: 100, color: "#4ade80" },
    mansion: { name: "Mansion", icon: "🏘️", width: 120, height: 90, color: "#4ade80" }
  },
  commercial: {
    shop: { name: "Shop", icon: "🏪", width: 70, height: 60, color: "#3b82f6" },
    restaurant: { name: "Restaurant", icon: "🍽️", width: 80, height: 70, color: "#3b82f6" },
    mall: { name: "Mall", icon: "🏬", width: 150, height: 120, color: "#3b82f6" }
  },
  public: {
    school: { name: "School", icon: "🏫", width: 100, height: 80, color: "#ef4444" },
    hospital: { name: "Hospital", icon: "🏥", width: 110, height: 90, color: "#ef4444" },
    police: { name: "Police", icon: "👮", width: 70, height: 60, color: "#ef4444" },
    fireStation: { name: "Fire Station", icon: "🚒", width: 90, height: 70, color: "#ef4444" },
    gasStation: { name: "Gas Station", icon: "⛽", width: 80, height: 60, color: "#ef4444" },
    postOffice: { name: "Post Office", icon: "📮", width: 85, height: 65, color: "#ef4444" },
    library: { name: "Library", icon: "📚", width: 95, height: 75, color: "#ef4444" },
    bank: { name: "Bank", icon: "🏦", width: 100, height: 80, color: "#ef4444" }
  },
  nature: {
    park: { name: "Park", icon: "🏊", width: 80, height: 80, color: "#84cc16" },
    tree: { name: "Tree", icon: "🌳", width: 30, height: 30, color: "#84cc16" }
  }
};

const STREET_TYPES = {
  road: { name: "Road", icon: "🛣️", width: 20, height: 20, color: "#f3f4f6" },
  water: { name: "Water", icon: "💧", width: 40, height: 40, color: "#007bff" },
  grass: { name: "Grass", icon: "🟩", width: 100, height: 100, color: "#22c55e" }
};

const CityBuilder = ({ user }) => {
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#90EE90');
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelInput, setLabelInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [cityName, setCityName] = useState('My City');
  const canvasRef = useRef(null);

  const addBuilding = (building) => {
    const newBuilding = {
      ...building,
      id: Date.now() + Math.random()
    };
    setBuildings(prev => [...prev, newBuilding]);
  };

  const addStreet = (street) => {
    const newStreet = {
      ...street,
      id: Date.now() + Math.random()
    };
    setStreets(prev => [...prev, newStreet]);
  };

  const deleteSelected = () => {
    console.log('Delete button clicked, selectedItem:', selectedItem);
    if (selectedItem) {
      console.log('Deleting item:', selectedItem.id, 'isBuilding:', selectedItem.isBuilding);
      if (selectedItem.isBuilding) {
        setBuildings(prev => {
          const filtered = prev.filter(b => b.id !== selectedItem.id);
          console.log('Buildings after delete:', filtered);
          return filtered;
        });
      } else {
        setStreets(prev => {
          const filtered = prev.filter(s => s.id !== selectedItem.id);
          console.log('Streets after delete:', filtered);
          return filtered;
        });
      }
      setSelectedItem(null);
    } else {
      console.log('No item selected for deletion');
    }
  };

  // Add keyboard event handler for delete functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItem && !editingLabel) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem, editingLabel]);

  const copySelected = () => {
    if (selectedItem) {
      if (selectedItem.isBuilding) {
        const newBuilding = {
          ...selectedItem,
          id: Date.now() + Math.random(),
          x: selectedItem.x + 20,
          y: selectedItem.y + 20
        };
        setBuildings(prev => [...prev, newBuilding]);
        setSelectedItem({ ...newBuilding, isBuilding: true });
      } else {
        const newStreet = {
          ...selectedItem,
          id: Date.now() + Math.random(),
          x: selectedItem.x + 20,
          y: selectedItem.y + 20
        };
        setStreets(prev => [...prev, newStreet]);
        setSelectedItem({ ...newStreet, isBuilding: false });
      }
    }
  };

  const clearAll = () => {
    setBuildings([]);
    setStreets([]);
    setSelectedItem(null);
  };

  const exportAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas for export with higher resolution
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set export dimensions (4x resolution for better quality)
    const scale = 4;
    const canvasRect = canvas.getBoundingClientRect();
    exportCanvas.width = canvasRect.width * scale;
    exportCanvas.height = canvasRect.height * scale;
    
    // Set background
    exportCtx.fillStyle = backgroundColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw city name at the top
    exportCtx.fillStyle = 'rgba(255,255,255,0.95)';
    exportCtx.fillRect(20 * scale, 20 * scale, (cityName.length * 20 + 40) * scale, 60 * scale);
    exportCtx.fillStyle = 'black';
    exportCtx.font = `bold ${24 * scale}px Arial`;
    exportCtx.textAlign = 'left';
    exportCtx.fillText(cityName, 40 * scale, 55 * scale);
    
    // Draw grid if enabled
    if (gridEnabled) {
      exportCtx.strokeStyle = 'rgba(0,0,0,0.1)';
      exportCtx.lineWidth = 1;
      const gridSize = 20 * scale;
      
      for (let x = 0; x <= exportCanvas.width; x += gridSize) {
        exportCtx.beginPath();
        exportCtx.moveTo(x, 0);
        exportCtx.lineTo(x, exportCanvas.height);
        exportCtx.stroke();
      }
      
      for (let y = 0; y <= exportCanvas.height; y += gridSize) {
        exportCtx.beginPath();
        exportCtx.moveTo(0, y);
        exportCtx.lineTo(exportCanvas.width, y);
        exportCtx.stroke();
      }
    }
    
    // Draw streets (infrastructure)
    streets.forEach(street => {
      exportCtx.fillStyle = street.color;
      exportCtx.fillRect(
        street.x * scale,
        street.y * scale,
        street.width * scale,
        street.height * scale
      );
      
      // Draw label if exists
      if (street.label) {
        exportCtx.fillStyle = 'rgba(255,255,255,0.9)';
        exportCtx.fillRect(
          (street.x + street.width/2 - 30) * scale,
          (street.y - 25) * scale,
          60 * scale,
          20 * scale
        );
        exportCtx.fillStyle = 'black';
        exportCtx.font = `${12 * scale}px Arial`;
        exportCtx.textAlign = 'center';
        exportCtx.fillText(
          street.label,
          (street.x + street.width/2) * scale,
          (street.y - 10) * scale
        );
      }
    });
    
    // Draw buildings
    buildings.forEach(building => {
      // Draw building icon
      exportCtx.font = `${(building.width > 60 ? 36 : 28) * scale}px Arial`;
      exportCtx.textAlign = 'center';
      exportCtx.fillStyle = 'black';
      exportCtx.fillText(
        building.icon,
        (building.x + building.width/2) * scale,
        (building.y + building.height/2 + 10) * scale
      );
      
      // Draw label if exists
      if (building.label) {
        exportCtx.fillStyle = 'rgba(255,255,255,0.9)';
        exportCtx.fillRect(
          (building.x + building.width/2 - 30) * scale,
          (building.y - 25) * scale,
          60 * scale,
          20 * scale
        );
        exportCtx.fillStyle = 'black';
        exportCtx.font = `${12 * scale}px Arial`;
        exportCtx.textAlign = 'center';
        exportCtx.fillText(
          building.label,
          (building.x + building.width/2) * scale,
          (building.y - 10) * scale
        );
      }
    });
    
    // Create download link
    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    const snappedX = gridEnabled ? Math.round(x / 20) * 20 : x;
    const snappedY = gridEnabled ? Math.round(y / 20) * 20 : y;
    
    if (dragData.isBuilding) {
      const newBuilding = {
        type: dragData.type,
        x: snappedX,
        y: snappedY,
        width: dragData.itemData.width,
        height: dragData.itemData.height,
        category: dragData.category,
        name: dragData.itemData.name,
        icon: dragData.itemData.icon,
        color: dragData.itemData.color
      };
      addBuilding(newBuilding);
    } else {
      const newStreet = {
        type: dragData.type,
        x: snappedX,
        y: snappedY,
        width: dragData.itemData.width,
        height: dragData.itemData.height,
        name: dragData.itemData.name,
        color: dragData.itemData.color
      };
      addStreet(newStreet);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleItemClick = (e, item, isBuilding) => {
    if (isResizing) return;
    e.stopPropagation();
    const selectedItemData = { ...item, isBuilding };
    setSelectedItem(selectedItemData);
    
    // If no label exists, start editing immediately
    if (!item.label) {
      setEditingLabel(item.id);
      setLabelInput(item.name);
    }
    
    console.log('Item clicked - selectedItem set to:', selectedItemData);
  };

  const handleLabelClick = (e, itemId, currentLabel) => {
    e.stopPropagation();
    setEditingLabel(itemId);
    setLabelInput(currentLabel || '');
  };

  const handleItemMouseDown = (e, item, isBuilding) => {
    if (isResizing) return;
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
        setIsDragging(true);
        setSelectedItem({ ...item, isBuilding });
        
        const canvasX = moveEvent.clientX - canvasRect.left - dragOffset.x;
        const canvasY = moveEvent.clientY - canvasRect.top - dragOffset.y;
        
        const snappedX = gridEnabled ? Math.round(canvasX / 20) * 20 : canvasX;
        const snappedY = gridEnabled ? Math.round(canvasY / 20) * 20 : canvasY;
        
        if (isBuilding) {
          setBuildings(prev => prev.map(b => 
            b.id === item.id ? { ...b, x: Math.max(0, snappedX), y: Math.max(0, snappedY) } : b
          ));
        } else {
          setStreets(prev => prev.map(s => 
            s.id === item.id ? { ...s, x: Math.max(0, snappedX), y: Math.max(0, snappedY) } : s
          ));
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (!hasMoved) {
        // This was a click, not a drag
        handleItemClick(e, item, isBuilding);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleLabelSave = () => {
    if (editingLabel && labelInput.trim()) {
      console.log('Saving label:', labelInput.trim(), 'for item:', editingLabel, 'isBuilding:', selectedItem?.isBuilding);
      
      if (selectedItem?.isBuilding) {
        setBuildings(prev => {
          const updated = prev.map(b => 
            b.id === editingLabel ? { ...b, label: labelInput.trim() } : b
          );
          console.log('Updated buildings:', updated);
          return updated;
        });
        setSelectedItem(prev => ({ ...prev, label: labelInput.trim() }));
      } else {
        setStreets(prev => {
          const updated = prev.map(s => 
            s.id === editingLabel ? { ...s, label: labelInput.trim() } : s
          );
          console.log('Updated streets:', updated);
          return updated;
        });
        setSelectedItem(prev => ({ ...prev, label: labelInput.trim() }));
      }
    }
    setEditingLabel(null);
    setLabelInput('');
  };

  const handleResizeStart = (e, item, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('e')) newWidth = Math.max(20, startWidth + deltaX);
      if (direction.includes('w')) newWidth = Math.max(20, startWidth - deltaX);
      if (direction.includes('s')) newHeight = Math.max(20, startHeight + deltaY);
      if (direction.includes('n')) newHeight = Math.max(20, startHeight - deltaY);
      
      if (gridEnabled) {
        newWidth = Math.round(newWidth / 20) * 20;
        newHeight = Math.round(newHeight / 20) * 20;
      }
      
      if (selectedItem.isBuilding) {
        setBuildings(prev => prev.map(b => 
          b.id === item.id ? { ...b, width: newWidth, height: newHeight } : b
        ));
        // Update selectedItem to keep it in sync
        setSelectedItem(prev => ({ ...prev, width: newWidth, height: newHeight }));
      } else {
        setStreets(prev => prev.map(s => 
          s.id === item.id ? { ...s, width: newWidth, height: newHeight } : s
        ));
        // Update selectedItem to keep it in sync
        setSelectedItem(prev => ({ ...prev, width: newWidth, height: newHeight }));
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 60px)', display: 'flex', marginTop: '60px' }}>
      {/* Sidebar */}
      <div className="bg-light border-end" style={{ width: '280px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <div className="p-3">
          <h2 className="h4 mb-3">City Builder</h2>
          
          {/* City Name - Top Priority */}
          <div className="mb-3">
            <label className="form-label fw-bold">City Name:</label>
            <input
              type="text"
              className="form-control"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name..."
              maxLength="30"
            />
          </div>

          {/* Background Color */}
          <div className="mb-3">
            <label className="form-label fw-bold">Background Color:</label>
            <input
              type="color"
              className="form-control form-control-color w-100"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
          
          {/* Other Controls */}
          <div className="mb-3">
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="gridToggle"
                checked={gridEnabled}
                onChange={(e) => setGridEnabled(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="gridToggle">
                Show Grid
              </label>
            </div>
            
            <button 
              className="btn btn-danger w-100 mb-2" 
              onClick={(e) => {
                alert('Delete button clicked!'); // Visual confirmation
                console.log('Delete button physically clicked!');
                console.log('Current selectedItem:', selectedItem);
                if (selectedItem) {
                  if (selectedItem.isBuilding) {
                    setBuildings(prev => prev.filter(b => b.id !== selectedItem.id));
                  } else {
                    setStreets(prev => prev.filter(s => s.id !== selectedItem.id));
                  }
                  setSelectedItem(null);
                  alert('Item deleted!');
                } else {
                  alert('No item selected');
                }
              }} 
              disabled={!selectedItem}
              style={{
                cursor: 'pointer',
                fontSize: '16px',
                padding: '10px',
                backgroundColor: selectedItem ? '#dc3545' : '#6c757d'
              }}
            >
              🗑️ DELETE SELECTED ITEM
            </button>
            
            <div className="d-flex gap-2 mb-2">
              <button className="btn btn-primary btn-sm" onClick={copySelected} disabled={!selectedItem}>
                Copy
              </button>
            </div>
            <div className="mb-2">
              <small className="text-muted">
                {selectedItem ? `Selected: ${selectedItem.name || selectedItem.type}` : 'No item selected'}
              </small>
            </div>
            <button 
              className="btn btn-warning btn-sm w-100 mb-2" 
              onClick={() => {
                console.log('Clear All button clicked!');
                clearAll();
              }}
            >
              Clear All
            </button>
            <button className="btn btn-success btn-sm w-100" onClick={exportAsImage}>
              Export as Image
            </button>
          </div>

          {/* Building Categories */}
          {Object.entries(BUILDING_TYPES).map(([category, buildings]) => (
            <div key={category} className="mb-3">
              <h5 className="text-uppercase text-muted">{category}</h5>
              <div className="row g-2">
                {Object.entries(buildings).map(([type, building]) => (
                  <div key={type} className="col-6">
                    <div
                      className="card text-center p-2 d-flex flex-column justify-content-center"
                      style={{ cursor: 'grab', height: '80px' }}
                      draggable
                      onDragStart={(e) => {
                        const dragData = {
                          type,
                          category,
                          isBuilding: true,
                          itemData: building
                        };
                        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '4px' }}>{building.icon}</div>
                      <small style={{ marginTop: '2px', paddingTop: '2px' }}>{building.name}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Streets */}
          <div className="mb-3">
            <h5 className="text-uppercase text-muted">Infrastructure</h5>
            <div className="row g-2">
              {Object.entries(STREET_TYPES).map(([type, street]) => (
                <div key={type} className="col-6">
                  <div
                    className="card text-center p-2 d-flex flex-column justify-content-center"
                    style={{ cursor: 'grab', height: '80px' }}
                    draggable
                    onDragStart={(e) => {
                      const dragData = {
                        type,
                        isBuilding: false,
                        itemData: street
                      };
                      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '4px' }}>{street.icon}</div>
                    <small style={{ marginTop: '2px', paddingTop: '2px' }}>{street.name}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4">
            <h6>City Stats</h6>
            <small className="text-muted">
              Buildings: {buildings.length}<br/>
              Infrastructure: {streets.length}
            </small>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="position-relative flex-grow-1"
        style={{
          height: 'calc(100vh - 60px)',
          backgroundColor: backgroundColor,
          overflow: 'hidden'
        }}
        onDrop={handleCanvasDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          // Only clear selection if clicking on canvas background, not during editing
          if (!editingLabel) {
            setSelectedItem(null);
          }
        }}
      >
        {/* Grid */}
        {gridEnabled && (
          <div
            className="position-absolute w-100 h-100"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Streets */}
        {streets.map((street) => (
          <div
            key={street.id}
            className={`position-absolute d-flex align-items-center justify-content-center ${selectedItem?.id === street.id ? 'border border-primary border-3' : ''}`}
            style={{
              left: `${street.x}px`,
              top: `${street.y}px`,
              width: `${street.width}px`,
              height: `${street.height}px`,
              backgroundColor: street.color,
              cursor: 'pointer',
              zIndex: street.type === 'grass' ? 1 : 5
            }}
            onMouseDown={(e) => handleItemMouseDown(e, street, false)}
          >
            {street.label && (
              <div style={{ 
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px', 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                padding: '4px 8px', 
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                zIndex: 20,
                cursor: 'pointer',
                marginBottom: '5px'
              }}
              onClick={(e) => handleLabelClick(e, street.id, street.label)}
              >
                {street.label}
              </div>
            )}
            
            {/* Resize handles for selected street */}
            {selectedItem?.id === street.id && selectedItem && !selectedItem.isBuilding && (
              <>
                {/* SE corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    bottom: '-6px',
                    right: '-6px',
                    cursor: 'se-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'se')}
                />
                {/* SW corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    bottom: '-6px',
                    left: '-6px',
                    cursor: 'sw-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'sw')}
                />
                {/* NE corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    top: '-6px',
                    right: '-6px',
                    cursor: 'ne-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'ne')}
                />
                {/* NW corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    top: '-6px',
                    left: '-6px',
                    cursor: 'nw-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'nw')}
                />
              </>
            )}
          </div>
        ))}

        {/* Buildings */}
        {buildings.map((building) => (
          <div
            key={building.id}
            className={`position-absolute d-flex flex-column align-items-center justify-content-center ${
              selectedItem?.id === building.id ? 'border border-primary border-3' : ''
            }`}
            style={{
              left: `${building.x}px`,
              top: `${building.y}px`,
              width: `${building.width}px`,
              height: `${building.height}px`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: building.width > 60 ? '36px' : '28px',
              zIndex: 10
            }}
            onMouseDown={(e) => handleItemMouseDown(e, building, true)}
          >
            <div>{building.icon}</div>
            {building.label && (
              <div style={{ 
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px', 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                padding: '4px 8px', 
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                zIndex: 20,
                cursor: 'pointer',
                marginBottom: '5px'
              }}
              onClick={(e) => handleLabelClick(e, building.id, building.label)}
              >
                {building.label}
              </div>
            )}
            
            {/* Resize handles for selected building */}
            {selectedItem?.id === building.id && selectedItem.isBuilding && (
              <>
                {/* SE corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    bottom: '-6px',
                    right: '-6px',
                    cursor: 'se-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'se')}
                />
                {/* SW corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    bottom: '-6px',
                    left: '-6px',
                    cursor: 'sw-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'sw')}
                />
                {/* NE corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    top: '-6px',
                    right: '-6px',
                    cursor: 'ne-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'ne')}
                />
                {/* NW corner */}
                <div
                  className="position-absolute rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    top: '-6px',
                    left: '-6px',
                    cursor: 'nw-resize',
                    zIndex: 25,
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'nw')}
                />
              </>
            )}
          </div>
        ))}

        {/* Instructions */}
        <div className="position-absolute top-0 start-0 m-3 bg-white p-2 rounded shadow-sm">
          <small>
            <strong>Instructions:</strong><br/>
            • Drag items from sidebar to canvas<br/>
            • Click to select and name, drag to move<br/>
            • Drag blue corners to resize<br/>
            • Use Copy/Delete buttons to duplicate/remove items
          </small>
        </div>

        {/* Inline Label Editor */}
        {editingLabel && (
          <div className="position-fixed" style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '2px solid #007bff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') {
                  setEditingLabel(null);
                  setLabelInput('');
                }
              }}
              onBlur={handleLabelSave}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: 'transparent',
                minWidth: '120px',
                textAlign: 'center'
              }}
              placeholder="Enter name..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CityBuilder;