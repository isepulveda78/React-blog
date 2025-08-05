import React, { useState, useRef } from 'react';

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
    police: { name: "Police", icon: "👮", width: 70, height: 60, color: "#ef4444" }
  },
  nature: {
    park: { name: "Park", icon: "🌳", width: 80, height: 80, color: "#84cc16" },
    tree: { name: "Tree", icon: "🌳", width: 30, height: 30, color: "#84cc16" }
  }
};

const STREET_TYPES = {
  road: { name: "Road", icon: "🛣️", width: 20, height: 20, color: "#666" },
  water: { name: "Water", icon: "💧", width: 40, height: 40, color: "#007bff" }
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
    if (selectedItem) {
      if (selectedItem.isBuilding) {
        setBuildings(prev => prev.filter(b => b.id !== selectedItem.id));
      } else {
        setStreets(prev => prev.filter(s => s.id !== selectedItem.id));
      }
      setSelectedItem(null);
    }
  };

  const clearAll = () => {
    setBuildings([]);
    setStreets([]);
    setSelectedItem(null);
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

  const handleItemClick = (item, isBuilding) => {
    if (isResizing) return;
    setSelectedItem({ ...item, isBuilding });
  };

  const handleDoubleClick = (item, isBuilding) => {
    setEditingLabel(item.id);
    setLabelInput(item.label || item.name);
  };

  const handleLabelSave = () => {
    if (selectedItem && editingLabel) {
      if (selectedItem.isBuilding) {
        setBuildings(prev => prev.map(b => 
          b.id === editingLabel ? { ...b, label: labelInput } : b
        ));
      } else {
        setStreets(prev => prev.map(s => 
          s.id === editingLabel ? { ...s, label: labelInput } : s
        ));
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
      } else {
        setStreets(prev => prev.map(s => 
          s.id === item.id ? { ...s, width: newWidth, height: newHeight } : s
        ));
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
          
          {/* Background Color - Top Priority */}
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
            
            <div className="d-flex gap-2">
              <button className="btn btn-danger btn-sm" onClick={deleteSelected} disabled={!selectedItem}>
                Delete Selected
              </button>
              <button className="btn btn-warning btn-sm" onClick={clearAll}>
                Clear All
              </button>
            </div>
          </div>

          {/* Building Categories */}
          {Object.entries(BUILDING_TYPES).map(([category, buildings]) => (
            <div key={category} className="mb-3">
              <h5 className="text-uppercase text-muted">{category}</h5>
              <div className="row g-2">
                {Object.entries(buildings).map(([type, building]) => (
                  <div key={type} className="col-6">
                    <div
                      className="card text-center p-2"
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
                      <div style={{ fontSize: '20px' }}>{building.icon}</div>
                      <small>{building.name}</small>
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
                    className="card text-center p-2"
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
                    <div style={{ fontSize: '20px' }}>{street.icon}</div>
                    <small>{street.name}</small>
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
        onClick={() => setSelectedItem(null)}
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
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleItemClick(street, false);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick(street, false);
            }}
          >
            {street.label && (
              <div style={{ 
                fontSize: '10px', 
                backgroundColor: 'rgba(255,255,255,0.8)', 
                padding: '2px 4px', 
                borderRadius: '3px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {street.label}
              </div>
            )}
            
            {/* Resize handles for selected street */}
            {selectedItem?.id === street.id && (
              <>
                {/* SE corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    bottom: '-5px',
                    right: '-5px',
                    cursor: 'se-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'se')}
                />
                {/* SW corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    bottom: '-5px',
                    left: '-5px',
                    cursor: 'sw-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'sw')}
                />
                {/* NE corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    top: '-5px',
                    right: '-5px',
                    cursor: 'ne-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, street, 'ne')}
                />
                {/* NW corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    top: '-5px',
                    left: '-5px',
                    cursor: 'nw-resize',
                    zIndex: 10
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
              backgroundColor: building.color,
              cursor: 'pointer',
              fontSize: building.width > 60 ? '24px' : '18px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleItemClick(building, true);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick(building, true);
            }}
          >
            <div>{building.icon}</div>
            {building.label && (
              <div style={{ 
                fontSize: '10px', 
                backgroundColor: 'rgba(255,255,255,0.8)', 
                padding: '2px 4px', 
                borderRadius: '3px',
                marginTop: '2px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {building.label}
              </div>
            )}
            
            {/* Resize handles for selected building */}
            {selectedItem?.id === building.id && (
              <>
                {/* SE corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    bottom: '-5px',
                    right: '-5px',
                    cursor: 'se-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'se')}
                />
                {/* SW corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    bottom: '-5px',
                    left: '-5px',
                    cursor: 'sw-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'sw')}
                />
                {/* NE corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    top: '-5px',
                    right: '-5px',
                    cursor: 'ne-resize',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleResizeStart(e, building, 'ne')}
                />
                {/* NW corner */}
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{
                    width: '10px',
                    height: '10px',
                    top: '-5px',
                    left: '-5px',
                    cursor: 'nw-resize',
                    zIndex: 10
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
            • Click to select, double-click to name<br/>
            • Drag blue corners to resize<br/>
            • Use Delete Selected to remove items
          </small>
        </div>

        {/* Label Edit Modal */}
        {editingLabel && (
          <div className="position-fixed top-50 start-50 translate-middle bg-white p-3 rounded shadow" style={{ zIndex: 1000 }}>
            <h6>Enter Name:</h6>
            <input
              type="text"
              className="form-control mb-2"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLabelSave();
              }}
            />
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleLabelSave}>
                Save
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setEditingLabel(null);
                setLabelInput('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityBuilder;