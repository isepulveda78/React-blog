import React, { useState, useCallback, useRef, useEffect } from 'react';

// Building and street type definitions
const BUILDING_TYPES = {
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  warehouse: { category: "industrial", name: "Warehouse", icon: "🏢", width: 120, height: 60 },
  hospital: { category: "public", name: "Hospital", icon: "🏥", width: 90, height: 80 },
  "fire-station": { category: "public", name: "Fire Station", icon: "🚒", width: 70, height: 60 },
  "police-station": { category: "public", name: "Police Station", icon: "🚓", width: 70, height: 60 },
  school: { category: "public", name: "School", icon: "🏫", width: 100, height: 70 },
  "college-campus": { category: "public", name: "University", icon: "🏛️", width: 140, height: 120 },
  "hair-salon": { category: "public", name: "Hair Salon", icon: "💇", width: 50, height: 50 },
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 },
  park: { category: "nature", name: "Park", icon: "🌿", width: 60, height: 60 },
  "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
};

const STREET_TYPES = {
  road: { category: "roads", name: "Road", icon: "🛣️", width: 60, height: 20 },
  water: { category: "water", name: "Water", icon: "🌊", width: 40, height: 40 }
};

const GRID_SIZE = 20;

const CityBuilder = () => {
  // State management
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBuildingType, setDraggedBuildingType] = useState(null);
  const [draggedStreetType, setDraggedStreetType] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#90EE90");
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPoint, setPanStartPoint] = useState(null);
  const [initialCanvasOffset, setInitialCanvasOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingItem, setResizingItem] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef(null);

  // Utility functions
  const snapToGrid = useCallback((value) => {
    return gridEnabled ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;
  }, [gridEnabled]);

  const checkCollision = useCallback((newItem, existingItems, excludeId = null) => {
    return existingItems.some(item => {
      if (excludeId && item.id === excludeId) return false;
      
      const itemLeft = item.x;
      const itemRight = item.x + item.width;
      const itemTop = item.y;
      const itemBottom = item.y + item.height;
      
      const newLeft = newItem.x;
      const newRight = newItem.x + newItem.width;
      const newTop = newItem.y;
      const newBottom = newItem.y + newItem.height;
      
      return !(newRight <= itemLeft || newLeft >= itemRight || newBottom <= itemTop || newTop >= itemBottom);
    });
  }, []);

  // Building operations
  const addBuilding = useCallback((buildingType, x, y) => {
    try {
      console.log('Adding building:', { buildingType, x, y });
      
      let parsedType = buildingType;
      if (typeof buildingType === 'string' && buildingType.startsWith('{')) {
        const parsed = JSON.parse(buildingType);
        parsedType = parsed.type;
      }
      
      const typeData = BUILDING_TYPES[parsedType];
      if (!typeData) {
        console.warn('Unknown building type:', parsedType);
        return false;
      }

      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);
      
      const newBuilding = {
        id: Date.now() + Math.random(),
        type: parsedType,
        x: snappedX,
        y: snappedY,
        width: typeData.width,
        height: typeData.height,
        label: typeData.name,
        color: getDefaultColor(typeData.category)
      };

      // Check for collisions
      if (checkCollision(newBuilding, [...buildings, ...streets])) {
        console.log('Building placement blocked by collision');
        return false;
      }

      setBuildings(prev => [...prev, newBuilding]);
      console.log('Building added successfully');
      return true;
    } catch (error) {
      console.error('Error adding building:', error);
      return false;
    }
  }, [buildings, streets, snapToGrid, checkCollision]);

  const addStreet = useCallback((streetType, x, y) => {
    try {
      let parsedType = streetType;
      if (typeof streetType === 'string' && streetType.startsWith('{')) {
        const parsed = JSON.parse(streetType);
        parsedType = parsed.type;
      }
      
      const typeData = STREET_TYPES[parsedType];
      if (!typeData) {
        console.warn('Unknown street type:', parsedType);
        return false;
      }

      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);
      
      const newStreet = {
        id: Date.now() + Math.random(),
        type: parsedType,
        x: snappedX,
        y: snappedY,
        width: typeData.width,
        height: typeData.height,
        label: typeData.name,
        color: parsedType === 'water' ? '#4A90E2' : '#666'
      };

      // Check for collisions with buildings only (streets can overlap)
      if (checkCollision(newStreet, buildings)) {
        console.log('Street placement blocked by building collision');
        return false;
      }

      setStreets(prev => [...prev, newStreet]);
      return true;
    } catch (error) {
      console.error('Error adding street:', error);
      return false;
    }
  }, [buildings, snapToGrid, checkCollision]);

  const updateBuilding = useCallback((id, updates) => {
    setBuildings(prev => prev.map(building => 
      building.id === id ? { ...building, ...updates } : building
    ));
  }, []);

  const updateStreet = useCallback((id, updates) => {
    setStreets(prev => prev.map(street => 
      street.id === id ? { ...street, ...updates } : street
    ));
  }, []);

  const deleteBuilding = useCallback((id) => {
    setBuildings(prev => prev.filter(building => building.id !== id));
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
  }, [selectedBuilding]);

  const deleteStreet = useCallback((id) => {
    setStreets(prev => prev.filter(street => street.id !== id));
    if (selectedStreet?.id === id) {
      setSelectedStreet(null);
    }
  }, [selectedStreet]);

  const selectBuilding = useCallback((building) => {
    setSelectedBuilding(building);
    setSelectedStreet(null);
  }, []);

  const selectStreet = useCallback((street) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
  }, []);

  // Canvas operations
  const clearCanvas = useCallback(() => {
    setBuildings([]);
    setStreets([]);
    setSelectedBuilding(null);
    setSelectedStreet(null);
  }, []);

  const toggleGrid = useCallback(() => {
    setGridEnabled(prev => !prev);
  }, []);

  const getCityStats = useCallback(() => {
    const stats = {
      totalBuildings: buildings.length,
      totalStreets: streets.length,
      residential: 0,
      commercial: 0,
      industrial: 0,
      public: 0,
      nature: 0
    };

    buildings.forEach(building => {
      const typeData = BUILDING_TYPES[building.type];
      if (typeData) {
        stats[typeData.category]++;
      }
    });

    return stats;
  }, [buildings, streets]);

  // Zoom and pan operations
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  }, []);

  const resetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setZoomLevel(100);
  }, []);

  // Helper function for default colors
  const getDefaultColor = (category) => {
    const colors = {
      residential: '#FFE4B5',
      commercial: '#87CEEB',
      industrial: '#D3D3D3',
      public: '#98FB98',
      nature: '#90EE90'
    };
    return colors[category] || '#FFFFFF';
  };

  // Export functionality
  const exportToPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCanvas.width = 1200;
    exportCanvas.height = 800;
    
    // Fill background
    exportCtx.fillStyle = backgroundColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw grid if enabled
    if (gridEnabled) {
      exportCtx.strokeStyle = '#ddd';
      exportCtx.lineWidth = 1;
      for (let x = 0; x <= exportCanvas.width; x += GRID_SIZE) {
        exportCtx.beginPath();
        exportCtx.moveTo(x, 0);
        exportCtx.lineTo(x, exportCanvas.height);
        exportCtx.stroke();
      }
      for (let y = 0; y <= exportCanvas.height; y += GRID_SIZE) {
        exportCtx.beginPath();
        exportCtx.moveTo(0, y);
        exportCtx.lineTo(exportCanvas.width, y);
        exportCtx.stroke();
      }
    }
    
    // Draw streets first (background layer)
    streets.forEach(street => {
      const typeData = STREET_TYPES[street.type];
      if (typeData) {
        exportCtx.fillStyle = street.color;
        exportCtx.fillRect(street.x, street.y, street.width, street.height);
        
        // Add icon/text
        exportCtx.fillStyle = '#000';
        exportCtx.font = '16px Arial';
        exportCtx.textAlign = 'center';
        exportCtx.fillText(typeData.icon, street.x + street.width/2, street.y + street.height/2 + 6);
      }
    });
    
    // Draw buildings on top
    buildings.forEach(building => {
      const typeData = BUILDING_TYPES[building.type];
      if (typeData) {
        exportCtx.fillStyle = building.color;
        exportCtx.fillRect(building.x, building.y, building.width, building.height);
        
        // Add building icon
        exportCtx.fillStyle = '#000';
        exportCtx.font = '20px Arial';
        exportCtx.textAlign = 'center';
        exportCtx.fillText(typeData.icon, building.x + building.width/2, building.y + building.height/2 + 7);
        
        // Add building label
        if (building.label) {
          exportCtx.fillStyle = '#333';
          exportCtx.font = '12px Arial';
          exportCtx.fillText(building.label, building.x + building.width/2, building.y + building.height + 15);
        }
      }
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${cityName.replace(/\s+/g, '_')}_city.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
  }, [buildings, streets, backgroundColor, gridEnabled, cityName]);

  // Resize functionality
  const startResize = useCallback((e, item, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizingItem(item);
    setResizeHandle(handle);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: item.width, height: item.height });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizingItem) return;

    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;

    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;

    switch (resizeHandle) {
      case 'se':
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        break;
      case 'e':
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        break;
      case 'w':
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        break;
      case 's':
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        break;
      case 'n':
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        break;
    }

    // Update the item
    if (resizingItem.type && BUILDING_TYPES[resizingItem.type]) {
      updateBuilding(resizingItem.id, { width: newWidth, height: newHeight });
    } else if (resizingItem.type && STREET_TYPES[resizingItem.type]) {
      updateStreet(resizingItem.id, { width: newWidth, height: newHeight });
    }
  }, [isResizing, resizingItem, resizeHandle, resizeStartPos, resizeStartSize, updateBuilding, updateStreet]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingItem(null);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Canvas event handlers
  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) * (100 / zoomLevel);
    const y = (e.clientY - rect.top - canvasOffset.y) * (100 / zoomLevel);

    const buildingType = e.dataTransfer.getData('buildingType');
    const streetType = e.dataTransfer.getData('streetType');

    console.log('Drop event triggered:', { buildingType, streetType });

    if (buildingType) {
      addBuilding(buildingType, x, y);
    } else if (streetType) {
      addStreet(streetType, x, y);
    }
  }, [canvasOffset, zoomLevel, addBuilding, addStreet]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleCanvasClick = useCallback((e) => {
    if (isResizing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) * (100 / zoomLevel);
    const y = (e.clientY - rect.top - canvasOffset.y) * (100 / zoomLevel);

    // Check if clicked on a building
    const clickedBuilding = buildings.find(building => 
      x >= building.x && x <= building.x + building.width &&
      y >= building.y && y <= building.y + building.height
    );

    if (clickedBuilding) {
      selectBuilding(clickedBuilding);
      return;
    }

    // Check if clicked on a street
    const clickedStreet = streets.find(street => 
      x >= street.x && x <= street.x + street.width &&
      y >= street.y && y <= street.y + street.height
    );

    if (clickedStreet) {
      selectStreet(clickedStreet);
      return;
    }

    // Clear selection if clicked on empty space
    setSelectedBuilding(null);
    setSelectedStreet(null);
  }, [buildings, streets, canvasOffset, zoomLevel, selectBuilding, selectStreet, isResizing]);

  // Drag start handlers
  const handleBuildingDragStart = useCallback((e, buildingType) => {
    console.log('Building drag start:', buildingType);
    const dragData = JSON.stringify({
      type: buildingType,
      category: BUILDING_TYPES[buildingType]?.category,
      isBuilding: true,
      itemData: BUILDING_TYPES[buildingType]
    });
    
    e.dataTransfer.setData('buildingType', dragData);
    e.dataTransfer.setData('text/plain', dragData);
    setIsDragging(true);
    setDraggedBuildingType(buildingType);
  }, []);

  const handleStreetDragStart = useCallback((e, streetType) => {
    console.log('Street drag start:', streetType);
    const dragData = JSON.stringify({
      type: streetType,
      category: STREET_TYPES[streetType]?.category,
      isStreet: true,
      itemData: STREET_TYPES[streetType]
    });
    
    e.dataTransfer.setData('streetType', dragData);
    e.dataTransfer.setData('text/plain', dragData);
    setIsDragging(true);
    setDraggedStreetType(streetType);
  }, []);

  // Render resize handles
  const renderResizeHandles = (item) => {
    if (!item || (selectedBuilding?.id !== item.id && selectedStreet?.id !== item.id)) return null;

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    
    return handles.map(handle => {
      let style = {
        position: 'absolute',
        width: '8px',
        height: '8px',
        backgroundColor: '#007bff',
        border: '1px solid #fff',
        borderRadius: '50%',
        cursor: `${handle}-resize`,
        zIndex: 1000
      };

      // Position the handle
      switch (handle) {
        case 'nw':
          style.top = '-4px';
          style.left = '-4px';
          break;
        case 'n':
          style.top = '-4px';
          style.left = `${item.width / 2 - 4}px`;
          break;
        case 'ne':
          style.top = '-4px';
          style.right = '-4px';
          break;
        case 'e':
          style.top = `${item.height / 2 - 4}px`;
          style.right = '-4px';
          break;
        case 'se':
          style.bottom = '-4px';
          style.right = '-4px';
          break;
        case 's':
          style.bottom = '-4px';
          style.left = `${item.width / 2 - 4}px`;
          break;
        case 'sw':
          style.bottom = '-4px';
          style.left = '-4px';
          break;
        case 'w':
          style.top = `${item.height / 2 - 4}px`;
          style.left = '-4px';
          break;
      }

      return (
        <div
          key={handle}
          style={style}
          onMouseDown={(e) => startResize(e, item, handle)}
        />
      );
    });
  };

  return (
    <div className="vh-100 d-flex flex-column" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom px-4 py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-city text-primary" style={{ fontSize: "1.5rem" }}></i>
              <h1 className="h3 fw-bold text-dark mb-0">City Builder</h1>
            </div>
            <div className="d-flex align-items-center gap-2 bg-light rounded px-3 py-1">
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="form-control form-control-sm border-0 bg-transparent"
                style={{ outline: "none", boxShadow: "none", minWidth: "200px" }}
                placeholder="Enter city name"
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={exportToPNG}
            >
              <i className="fas fa-image"></i>
              <span className="d-none d-md-inline">Export PNG</span>
            </button>
            
            <a 
              href="/educational-tools" 
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/educational-tools');
                window.location.reload();
              }}
            >
              <i className="fas fa-arrow-left"></i>
              <span className="d-none d-md-inline">Back to Tools</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow-1 d-flex">
        {/* Building Palette Sidebar */}
        <div className="bg-white border-end" style={{ width: "300px", minWidth: "300px" }}>
          <div className="p-3 h-100 overflow-auto">
            <h5 className="fw-bold mb-3">Building Palette</h5>
            
            {/* Buildings */}
            <div className="mb-4">
              <h6 className="fw-semibold text-muted mb-2">🏠 Buildings</h6>
              <div className="row g-2">
                {Object.entries(BUILDING_TYPES).map(([type, data]) => (
                  <div key={type} className="col-6">
                    <div
                      className="card h-100 border text-center p-2"
                      style={{ cursor: "grab" }}
                      draggable
                      onDragStart={(e) => handleBuildingDragStart(e, type)}
                    >
                      <div style={{ fontSize: "1.5rem" }}>{data.icon}</div>
                      <small className="text-muted">{data.name}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Streets & Water */}
            <div className="mb-4">
              <h6 className="fw-semibold text-muted mb-2">🛣️ Infrastructure</h6>
              <div className="row g-2">
                {Object.entries(STREET_TYPES).map(([type, data]) => (
                  <div key={type} className="col-6">
                    <div
                      className="card h-100 border text-center p-2"
                      style={{ cursor: "grab" }}
                      draggable
                      onDragStart={(e) => handleStreetDragStart(e, type)}
                    >
                      <div style={{ fontSize: "1.5rem" }}>{data.icon}</div>
                      <small className="text-muted">{data.name}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Controls */}
            <div className="border-top pt-3">
              <h6 className="fw-semibold text-muted mb-2">⚙️ Controls</h6>
              
              <div className="mb-3">
                <label className="form-label small">Background Color</label>
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
              
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="gridToggle"
                  checked={gridEnabled}
                  onChange={toggleGrid}
                />
                <label className="form-check-label" htmlFor="gridToggle">
                  Show Grid
                </label>
              </div>
              
              <button
                className="btn btn-danger w-100"
                onClick={clearCanvas}
              >
                <i className="fas fa-trash"></i> Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-grow-1 position-relative">
          <div
            ref={canvasRef}
            className="w-100 h-100 position-relative overflow-hidden"
            style={{
              backgroundColor: backgroundColor,
              cursor: isDragging ? 'copy' : 'default'
            }}
            onDrop={handleCanvasDrop}
            onDragOver={handleDragOver}
            onClick={handleCanvasClick}
          >
            {/* Grid overlay */}
            {gridEnabled && (
              <div
                className="position-absolute top-0 start-0"
                style={{
                  width: '2000px',
                  height: '2000px',
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                  backgroundSize: `${GRID_SIZE * (zoomLevel / 100)}px ${GRID_SIZE * (zoomLevel / 100)}px`,
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel / 100})`,
                  transformOrigin: '0 0',
                  pointerEvents: 'none'
                }}
              />
            )}
            
            {/* Streets (render first, behind buildings) */}
            {streets.map((street) => {
              const typeData = STREET_TYPES[street.type];
              return (
                <div
                  key={street.id}
                  className="position-absolute"
                  style={{
                    left: `${street.x * (zoomLevel / 100) + canvasOffset.x}px`,
                    top: `${street.y * (zoomLevel / 100) + canvasOffset.y}px`,
                    width: `${street.width * (zoomLevel / 100)}px`,
                    height: `${street.height * (zoomLevel / 100)}px`,
                    backgroundColor: street.color,
                    border: selectedStreet?.id === street.id ? '3px solid #007bff' : '1px solid #333',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${16 * (zoomLevel / 100)}px`,
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectStreet(street);
                  }}
                >
                  {typeData?.icon}
                  {renderResizeHandles(street)}
                </div>
              );
            })}
            
            {/* Buildings (render on top) */}
            {buildings.map((building) => {
              const typeData = BUILDING_TYPES[building.type];
              return (
                <div
                  key={building.id}
                  className="position-absolute"
                  style={{
                    left: `${building.x * (zoomLevel / 100) + canvasOffset.x}px`,
                    top: `${building.y * (zoomLevel / 100) + canvasOffset.y}px`,
                    width: `${building.width * (zoomLevel / 100)}px`,
                    height: `${building.height * (zoomLevel / 100)}px`,
                    backgroundColor: building.color,
                    border: selectedBuilding?.id === building.id ? '2px solid #007bff' : '1px solid #333',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${20 * (zoomLevel / 100)}px`,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectBuilding(building);
                  }}
                >
                  {typeData?.icon}
                  {building.label && (
                    <div
                      className="position-absolute text-center small"
                      style={{
                        bottom: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: `${12 * (zoomLevel / 100)}px`,
                        color: '#333',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {building.label}
                    </div>
                  )}
                  {renderResizeHandles(building)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Properties Panel */}
        {(selectedBuilding || selectedStreet) && (
          <div className="bg-white border-start" style={{ width: "320px", minWidth: "320px" }}>
            <div className="p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">Properties</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSelectedBuilding(null);
                    setSelectedStreet(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {selectedBuilding && (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Label</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedBuilding.label || ''}
                      onChange={(e) => updateBuilding(selectedBuilding.id, { label: e.target.value })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={selectedBuilding.color}
                      onChange={(e) => updateBuilding(selectedBuilding.id, { color: e.target.value })}
                    />
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Width</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedBuilding.width}
                        onChange={(e) => updateBuilding(selectedBuilding.id, { width: parseInt(e.target.value) || 40 })}
                        min="20"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Height</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedBuilding.height}
                        onChange={(e) => updateBuilding(selectedBuilding.id, { height: parseInt(e.target.value) || 40 })}
                        min="20"
                      />
                    </div>
                  </div>
                  
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => deleteBuilding(selectedBuilding.id)}
                  >
                    <i className="fas fa-trash"></i> Delete Building
                  </button>
                </div>
              )}
              
              {selectedStreet && (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Label</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedStreet.label || ''}
                      onChange={(e) => updateStreet(selectedStreet.id, { label: e.target.value })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Road Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={selectedStreet.color}
                      onChange={(e) => updateStreet(selectedStreet.id, { color: e.target.value })}
                    />
                    <div className="mt-2">
                      <small className="text-muted d-block mb-1">Quick Colors:</small>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm border"
                          style={{ backgroundColor: '#8B8B8B', width: '30px', height: '30px' }}
                          onClick={() => updateStreet(selectedStreet.id, { color: '#8B8B8B' })}
                          title="Gray Road"
                        ></button>
                        <button
                          className="btn btn-sm border"
                          style={{ backgroundColor: '#2C2C2C', width: '30px', height: '30px' }}
                          onClick={() => updateStreet(selectedStreet.id, { color: '#2C2C2C' })}
                          title="Asphalt"
                        ></button>
                        <button
                          className="btn btn-sm border"
                          style={{ backgroundColor: '#8B4513', width: '30px', height: '30px' }}
                          onClick={() => updateStreet(selectedStreet.id, { color: '#8B4513' })}
                          title="Dirt Road"
                        ></button>
                        <button
                          className="btn btn-sm border"
                          style={{ backgroundColor: '#FFD700', width: '30px', height: '30px' }}
                          onClick={() => updateStreet(selectedStreet.id, { color: '#FFD700' })}
                          title="Brick Road"
                        ></button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Width</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedStreet.width}
                        onChange={(e) => updateStreet(selectedStreet.id, { width: parseInt(e.target.value) || 20 })}
                        min="20"
                        max="200"
                        step="10"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Height</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedStreet.height}
                        onChange={(e) => updateStreet(selectedStreet.id, { height: parseInt(e.target.value) || 20 })}
                        min="10"
                        max="200"
                        step="10"
                      />
                    </div>
                  </div>
                  
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => deleteStreet(selectedStreet.id)}
                  >
                    <i className="fas fa-trash"></i> Delete Street
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* City Stats Footer */}
      <footer className="bg-white border-top px-4 py-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary">
                {getCityStats().totalBuildings} Buildings
              </span>
              <span className="badge bg-info">
                {getCityStats().totalStreets} Roads
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 small text-muted">
              <span>🏠 {getCityStats().residential}</span>
              <span>🏢 {getCityStats().commercial}</span>
              <span>🏭 {getCityStats().industrial}</span>
              <span>🏥 {getCityStats().public}</span>
              <span>🌳 {getCityStats().nature}</span>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Zoom: {zoomLevel}%</span>
            <div className="d-flex align-items-center gap-1">
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={zoomOut}
                disabled={zoomLevel <= 50}
              >
                <i className="fas fa-minus"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={resetView}
              >
                <i className="fas fa-home"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={zoomIn}
                disabled={zoomLevel >= 200}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CityBuilder;