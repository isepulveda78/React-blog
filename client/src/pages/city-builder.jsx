const { React } = window;
const { useState, useEffect, useRef } = React;

// Enhanced Building Types Configuration with all features
const BUILDING_TYPES = {
  // Residential
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  condo: { category: "residential", name: "Condo", icon: "🏘️", width: 50, height: 70 },
  
  // Commercial
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  mall: { category: "commercial", name: "Mall", icon: "🏬", width: 120, height: 80 },
  restaurant: { category: "commercial", name: "Restaurant", icon: "🍽️", width: 60, height: 50 },
  "hair-salon": { category: "commercial", name: "Hair Salon", icon: "💇", width: 50, height: 50 },
  
  // Industrial
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  warehouse: { category: "industrial", name: "Warehouse", icon: "🏬", width: 90, height: 70 },
  
  // Public Services
  hospital: { category: "public", name: "Hospital", icon: "🏥", width: 120, height: 100 },
  "fire-station": { category: "public", name: "Fire Station", icon: "🚒", width: 80, height: 60 },
  "police-station": { category: "public", name: "Police Station", icon: "🚔", width: 80, height: 60 },
  school: { category: "public", name: "School", icon: "🏫", width: 100, height: 80 },
  university: { category: "public", name: "University", icon: "🏛️", width: 140, height: 120 },
  
  // Nature
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 },
  "oak-tree": { category: "nature", name: "Oak Tree", icon: "🌳", width: 30, height: 30 },
  park: { category: "nature", name: "Park", icon: "🏞️", width: 80, height: 60 },
  "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
};

// Street/Infrastructure Types
const STREET_TYPES = {
  road: { category: "roads", name: "Road", icon: "🛣️", width: 20, height: 20 },
  water: { category: "nature", name: "Water", icon: "💧", width: 40, height: 40 }
};

// Enhanced state management hook
const useCityBuilderState = () => {
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingNameInput, setBuildingNameInput] = useState('');
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#90EE90");
  const [isEditingCityName, setIsEditingCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);
  const [showExportModal, setShowExportModal] = useState(false);
  const [resizing, setResizing] = useState(null);
  const canvasRef = useRef(null);

  // Building operations
  const addBuilding = (building) => {
    const newBuilding = {
      ...building,
      id: Date.now() + Math.random()
    };
    setBuildings(prev => [...prev, newBuilding]);
    console.log("Building added:", newBuilding);
  };

  const addStreet = (street) => {
    const newStreet = {
      ...street,
      id: Date.now() + Math.random()
    };
    setStreets(prev => [...prev, newStreet]);
    console.log("Street added:", newStreet);
  };

  const updateBuilding = (id, updates) => {
    setBuildings(prev => 
      prev.map(building => 
        building.id === id ? { ...building, ...updates } : building
      )
    );
  };

  const updateStreet = (id, updates) => {
    setStreets(prev => 
      prev.map(street => 
        street.id === id ? { ...street, ...updates } : street
      )
    );
  };

  const deleteBuilding = (id) => {
    setBuildings(prev => prev.filter(building => building.id !== id));
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
  };

  const deleteStreet = (id) => {
    setStreets(prev => prev.filter(street => street.id !== id));
    if (selectedStreet?.id === id) {
      setSelectedStreet(null);
    }
  };

  const selectBuilding = (building) => {
    setSelectedBuilding(building);
    setSelectedStreet(null);
    setEditingBuilding(null);
  };

  const selectStreet = (street) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
  };

  const clearSelection = () => {
    setSelectedBuilding(null);
    setSelectedStreet(null);
    setEditingBuilding(null);
  };

  const handleClearCanvas = () => {
    setBuildings([]);
    setStreets([]);
    clearSelection();
  };

  const getCityStats = () => ({
    totalBuildings: buildings.length,
    totalStreets: streets.length,
    residential: buildings.filter(b => b.category === 'residential').length,
    commercial: buildings.filter(b => b.category === 'commercial').length,
    industrial: buildings.filter(b => b.category === 'industrial').length,
    public: buildings.filter(b => b.category === 'public').length,
    nature: buildings.filter(b => b.category === 'nature').length
  });

  const handleDuplicateBuilding = (building) => {
    const duplicated = {
      ...building,
      id: Date.now() + Math.random(),
      x: building.x + 20,
      y: building.y + 20
    };
    setBuildings(prev => [...prev, duplicated]);
  };

  return {
    cityName, setCityName,
    buildings, setBuildings,
    streets, setStreets,
    selectedBuilding, setSelectedBuilding,
    selectedStreet, setSelectedStreet,
    editingBuilding, setEditingBuilding,
    buildingNameInput, setBuildingNameInput,
    gridEnabled, setGridEnabled,
    backgroundColor, setBackgroundColor,
    isEditingCityName, setIsEditingCityName,
    cityNameInput, setCityNameInput,
    showExportModal, setShowExportModal,
    resizing, setResizing,
    canvasRef,
    addBuilding,
    addStreet,
    updateBuilding,
    updateStreet,
    deleteBuilding,
    deleteStreet,
    selectBuilding,
    selectStreet,
    clearSelection,
    handleClearCanvas,
    getCityStats,
    handleDuplicateBuilding
  };
};

// Main CityBuilder Component - Updated with fixes
const CityBuilder = () => {
  console.log("🎯 CityBuilder READY - drag & resize ENABLED");
  const {
    cityName, setCityName,
    buildings, streets,
    selectedBuilding, selectedStreet,
    editingBuilding, setEditingBuilding,
    buildingNameInput, setBuildingNameInput,
    gridEnabled, setGridEnabled,
    backgroundColor, setBackgroundColor,
    isEditingCityName, setIsEditingCityName,
    cityNameInput, setCityNameInput,
    showExportModal, setShowExportModal,
    resizing, setResizing,
    canvasRef,
    addBuilding,
    addStreet,
    updateBuilding,
    updateStreet,
    deleteBuilding,
    deleteStreet,
    selectBuilding,
    selectStreet,
    clearSelection,
    handleClearCanvas,
    getCityStats,
    handleDuplicateBuilding
  } = useCityBuilderState();

  // Canvas drag and drop handlers
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
        name: dragData.itemData.name
      };
      addBuilding(newBuilding);
    } else if (dragData.isStreet) {
      const newStreet = {
        type: dragData.type,
        x: snappedX,
        y: snappedY,
        width: dragData.itemData.width,
        height: dragData.itemData.height,
        category: dragData.category,
        name: dragData.itemData.name
      };
      addStreet(newStreet);
    }
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Building interaction handlers
  const handleBuildingClick = (e, building) => {
    e.stopPropagation();
    if (selectedBuilding?.id === building.id && !editingBuilding) {
      handleBuildingNameEdit(building);
    } else {
      selectBuilding(building);
    }
  };

  const handleStreetClick = (e, street) => {
    e.stopPropagation();
    selectStreet(street);
  };

  // Building name editing functions
  const handleBuildingNameEdit = (building) => {
    setEditingBuilding(building);
    setBuildingNameInput(building.customName || building.name || '');
  };

  const handleBuildingNameSave = () => {
    if (editingBuilding && buildingNameInput.trim()) {
      updateBuilding(editingBuilding.id, {
        ...editingBuilding,
        customName: buildingNameInput.trim()
      });
      console.log("Building renamed to:", buildingNameInput);
    }
    setEditingBuilding(null);
    setBuildingNameInput('');
  };

  const handleBuildingNameClear = () => {
    if (editingBuilding) {
      updateBuilding(editingBuilding.id, {
        ...editingBuilding,
        customName: null
      });
      console.log("Building label cleared for:", editingBuilding.id);
    }
    setEditingBuilding(null);
    setBuildingNameInput('');
  };

  const handleBuildingNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBuildingNameSave();
    } else if (e.key === 'Escape') {
      setEditingBuilding(null);
      setBuildingNameInput('');
    }
  };

  // FIXED DRAG FUNCTIONALITY - WORKS WITH GRID
  const handleDragStart = (e, item) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.resize-handle')) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    console.log("🏃 DRAG START:", item.type, "from", item.x + "," + item.y);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startItemX = item.x;
    const startItemY = item.y;
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newX = startItemX + deltaX;
      let newY = startItemY + deltaY;
      
      // Grid snapping
      if (gridEnabled) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }
      
      // Boundary constraints
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      console.log("🏃 DRAGGING:", newX, newY);
      
      // Update position
      if (item.category) {
        updateBuilding(item.id, { x: newX, y: newY });
      } else {
        updateStreet(item.id, { x: newX, y: newY });
      }
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      console.log("🏁 DRAG END");
      
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'grabbing';
  };

  // City name editing functions
  const handleCityNameEdit = () => {
    setIsEditingCityName(true);
    setCityNameInput(cityName);
  };

  const handleCityNameSave = () => {
    if (cityNameInput.trim()) {
      setCityName(cityNameInput.trim());
    }
    setIsEditingCityName(false);
  };

  const handleCityNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCityNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingCityName(false);
      setCityNameInput(cityName);
    }
  };

  // SIMPLIFIED RESIZE FUNCTION - WORKS EVERYWHERE
  const handleResizeStart = (e, item, direction) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log("✂️ RESIZE START:", item.type, direction, item.width + "x" + item.height);
    
    const rect = e.target.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    
    let moved = false;
    
    function onMove(me) {
      me.preventDefault();
      me.stopPropagation();
      
      moved = true;
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      
      console.log("✂️ MOVING:", dx, dy);
      
      let w = item.width;
      let h = item.height;
      let x = item.x;
      let y = item.y;
      
      // Apply changes based on direction
      if (direction === 'se') {
        w = Math.max(20, item.width + dx);
        h = Math.max(20, item.height + dy);
      }
      
      if (direction === 'sw') {
        w = Math.max(20, item.width - dx);
        h = Math.max(20, item.height + dy);
        x = item.x + dx;
      }
      
      if (direction === 'ne') {
        w = Math.max(20, item.width + dx);
        h = Math.max(20, item.height - dy);
        y = item.y + dy;
      }
      
      if (direction === 'nw') {
        w = Math.max(20, item.width - dx);
        h = Math.max(20, item.height - dy);
        x = item.x + dx;
        y = item.y + dy;
      }
      
      // Grid snap
      if (gridEnabled) {
        w = Math.round(w / 20) * 20;
        h = Math.round(h / 20) * 20;
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
      }
      
      const update = { width: w, height: h };
      if (x !== item.x) update.x = Math.max(0, x);
      if (y !== item.y) update.y = Math.max(0, y);
      
      console.log("✂️ UPDATE:", update);
      
      if (item.category) {
        updateBuilding(item.id, update);
      } else {
        updateStreet(item.id, update);
      }
    }
    
    function onUp(ue) {
      ue.preventDefault();
      console.log("✂️ RESIZE COMPLETE - moved:", moved);
      
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = 'default';
    }
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = `${direction}-resize`;
  };

  return (
    <div className="vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom px-4 py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-city text-primary" style={{ fontSize: "1.5rem" }}></i>
              <h1 className="h3 fw-bold text-dark mb-0">CityBuilder Pro</h1>
            </div>
            <div className="d-none d-md-flex align-items-center gap-2 bg-light rounded px-3 py-1">
              {isEditingCityName ? (
                <input
                  type="text"
                  value={cityNameInput}
                  onChange={(e) => setCityNameInput(e.target.value)}
                  onBlur={handleCityNameSave}
                  onKeyDown={handleCityNameKeyPress}
                  className="form-control form-control-sm border-0 bg-transparent"
                  style={{ outline: "none", boxShadow: "none" }}
                  autoFocus
                />
              ) : (
                <span className="small text-muted">{cityName}</span>
              )}
              <button
                className="btn btn-sm btn-link text-muted p-0"
                onClick={handleCityNameEdit}
              >
                <i className="fas fa-edit" style={{ fontSize: "0.75rem" }}></i>
              </button>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowExportModal(true)}
            >
              <i className="fas fa-image"></i>
              <span className="d-none d-sm-inline">Export Image</span>
            </button>
          </div>
        </div>
      </header>

      <div className="d-flex" style={{ height: "calc(100vh - 76px)" }}>
        {/* Building Palette */}
        <div className="bg-white shadow border-end d-flex flex-column" style={{ width: "320px", maxHeight: "100vh" }}>
          <div className="p-3 border-bottom flex-fill overflow-auto">
            <h2 className="h5 fw-semibold text-dark mb-3">Building Palette</h2>
            
            {/* Building Categories */}
            {Object.entries({
              residential: { name: "Residential", color: "#10b981" },
              commercial: { name: "Commercial", color: "#3b82f6" },
              industrial: { name: "Industrial", color: "#f59e0b" },
              public: { name: "Public Services", color: "#ef4444" },
              nature: { name: "Nature", color: "#22c55e" }
            }).map(([categoryKey, category]) => (
              <div key={categoryKey} className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div 
                    className="rounded-circle me-2" 
                    style={{ width: "16px", height: "16px", backgroundColor: category.color }}
                  ></div>
                  <h3 className="h6 fw-medium text-dark mb-0">{category.name}</h3>
                </div>
                <div className="row g-2">
                  {Object.entries(BUILDING_TYPES)
                    .filter(([type, building]) => building.category === categoryKey)
                    .map(([type, building]) => (
                    <div key={type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: category.color,
                          borderOpacity: "0.3",
                          transition: "all 0.2s ease",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: type, 
                            category: categoryKey,
                            isBuilding: true,
                            itemData: building
                          };
                          e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                          e.dataTransfer.effectAllowed = "copy";
                          e.currentTarget.style.opacity = "0.5";
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem" }}>
                          {building.icon}
                        </div>
                        <p className="small fw-medium text-dark mb-0" style={{ fontSize: "0.65rem" }}>
                          {building.name}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: "0.55rem" }}>
                          {building.width}×{building.height}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Streets/Infrastructure Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <div 
                  className="rounded-circle me-2" 
                  style={{ width: "16px", height: "16px", backgroundColor: "#6b7280" }}
                ></div>
                <h3 className="h6 fw-medium text-dark mb-0">Infrastructure</h3>
              </div>
              <div className="row g-2">
                {Object.entries(STREET_TYPES).map(([type, street]) => (
                  <div key={type} className="col-6">
                    <div
                      className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                      style={{
                        borderColor: "#6b7280",
                        borderOpacity: "0.3",
                        transition: "all 0.2s ease",
                        cursor: "grab",
                        backgroundColor: "#f8f9fa"
                      }}
                      draggable
                      onDragStart={(e) => {
                        const dragData = { 
                          type: type, 
                          category: street.category,
                          isStreet: true,
                          itemData: street
                        };
                        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = "copy";
                        e.currentTarget.style.opacity = "0.5";
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      <div className="mb-1 d-block" style={{ fontSize: "1.5rem" }}>
                        {street.icon}
                      </div>
                      <p className="small fw-medium text-dark mb-0" style={{ fontSize: "0.65rem" }}>
                        {street.name}
                      </p>
                      <p className="text-muted mb-0" style={{ fontSize: "0.55rem" }}>
                        {street.width}×{street.height}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools section */}
            <div className="p-3 border-top">
              <div className="d-flex gap-2 mb-3">
                <button 
                  className="btn btn-secondary btn-sm flex-fill"
                  onClick={handleClearCanvas}
                >
                  <i className="fas fa-trash me-1"></i>Clear
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => setGridEnabled(!gridEnabled)}
                >
                  <i className="fas fa-th me-1"></i>Grid: {gridEnabled ? "On" : "Off"}
                </button>
              </div>
              
              {/* Background Color Picker with Custom Color */}
              <div className="mb-3">
                <label className="form-label small">Background Color:</label>
                <div className="d-flex gap-1 flex-wrap mb-2">
                  {['#90EE90', '#87CEEB', '#F0E68C', '#DDA0DD', '#98FB98'].map(color => (
                    <button
                      key={color}
                      className={`btn btn-sm ${backgroundColor === color ? 'border-dark border-2' : 'border'}`}
                      style={{ 
                        backgroundColor: color, 
                        width: '30px', 
                        height: '30px',
                        padding: '0'
                      }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="color"
                    className="form-control form-control-sm"
                    style={{ width: '50px', height: '30px', padding: '0' }}
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                  <small className="text-muted">Custom color</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Canvas Area */}
        <div 
          ref={canvasRef}
          className="flex-grow-1 position-relative overflow-hidden border"
          style={{ 
            minHeight: '400px', 
            backgroundColor: backgroundColor,
            cursor: 'default'
          }}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onClick={handleCanvasClick}
        >
          {/* Grid Background */}
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

          {/* Render Streets */}
          {streets.map((street) => (
            <div
              key={street.id}
              className={`position-absolute border-0 ${selectedStreet?.id === street.id ? 'border border-info border-3' : ''}`}
              style={{
                left: `${street.x}px`,
                top: `${street.y}px`,
                width: `${street.width}px`,
                height: `${street.height}px`,
                backgroundColor: street.type === 'water' ? '#007bff' : '#000000',
                cursor: selectedStreet?.id === street.id ? 'move' : 'pointer',
                transition: 'all 0.2s ease',
                zIndex: selectedStreet?.id === street.id ? 10 : 1
              }}
              onClick={(e) => handleStreetClick(e, street)}
              onMouseDown={(e) => {
                if (selectedStreet?.id === street.id && !e.target.closest('.resize-handle') && !e.target.closest('button')) {
                  handleDragStart(e, street);
                }
              }}
            >
              {/* Delete button for selected street */}
              {selectedStreet?.id === street.id && (
                <>
                  <button
                    className="position-absolute btn btn-sm btn-danger"
                    style={{
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      padding: '0',
                      fontSize: '0.7rem',
                      lineHeight: '1',
                      zIndex: 20
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStreet(street.id);
                    }}
                  >
                    ✕
                  </button>
                  
                  {/* Corner resize handles */}
                  <div
                    className="position-absolute bg-info rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      bottom: '-6px',
                      right: '-6px',
                      cursor: 'se-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, street, 'se')}
                  />
                  <div
                    className="position-absolute bg-info rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      top: '-6px',
                      left: '-6px',
                      cursor: 'nw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, street, 'nw')}
                  />
                  <div
                    className="position-absolute bg-info rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      top: '-6px',
                      right: '-6px',
                      cursor: 'ne-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, street, 'ne')}
                  />
                  <div
                    className="position-absolute bg-info rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      bottom: '-6px',
                      left: '-6px',
                      cursor: 'sw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, street, 'sw')}
                  />
                </>
              )}
            </div>
          ))}

          {/* Render Buildings */}
          {buildings.map((building) => (
            <div
              key={building.id}
              className={`position-absolute border-0 ${selectedBuilding?.id === building.id ? 'border border-primary border-3' : ''}`}
              style={{
                left: `${building.x}px`,
                top: `${building.y}px`,
                width: `${building.width}px`,
                height: `${building.height}px`,
                backgroundColor: building.type === 'grass-patch' ? '#32CD32' : 'transparent',
                cursor: selectedBuilding?.id === building.id ? 'move' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: building.width > 60 ? '2rem' : '1.5rem',
                transition: 'all 0.2s ease',
                zIndex: selectedBuilding?.id === building.id ? 10 : 1
              }}
              onClick={(e) => handleBuildingClick(e, building)}
              onMouseDown={(e) => {
                if (selectedBuilding?.id === building.id && !e.target.closest('.resize-handle') && !e.target.closest('button')) {
                  handleDragStart(e, building);
                }
              }}
            >
              {/* Building Icon/Content */}
              <div className="text-center w-100 h-100 d-flex align-items-center justify-content-center">
                {building.type === 'university' ? (
                  <span>🏛️</span>
                ) : building.type === 'grass-patch' ? (
                  <div 
                    className="w-100 h-100"
                    style={{
                      backgroundColor: '#32CD32',
                      borderRadius: '4px'
                    }}
                  />
                ) : building.type === 'park' ? (
                  <span>🏞️</span>
                ) : (
                  <span>{BUILDING_TYPES[building.type]?.icon || '🏢'}</span>
                )}
              </div>
              
              {/* Building Name Display */}
              {(building.customName || building.name) && !editingBuilding && (
                <div 
                  className="position-absolute bg-dark text-white px-2 py-1 rounded small"
                  style={{ 
                    bottom: `-${Math.max(20, building.height * 0.1)}px`, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: building.width > 120 ? '0.9rem' : building.width > 80 ? '0.8rem' : '0.7rem',
                    whiteSpace: 'nowrap',
                    maxWidth: `${Math.max(120, building.width * 0.8)}px`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {building.customName || building.name}
                </div>
              )}

              {/* Building Name Editor */}
              {editingBuilding?.id === building.id && (
                <div 
                  className="position-absolute"
                  style={{ 
                    bottom: `-${Math.max(40, building.height * 0.2)}px`, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    zIndex: 20
                  }}
                >
                  <div className="d-flex align-items-center gap-1">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{
                        width: `${Math.max(100, building.width * 0.6)}px`,
                        fontSize: building.width > 120 ? '0.85rem' : '0.75rem',
                        padding: '2px 6px'
                      }}
                      value={buildingNameInput}
                      onChange={(e) => setBuildingNameInput(e.target.value)}
                      onKeyDown={handleBuildingNameKeyPress}
                      onBlur={handleBuildingNameSave}
                      autoFocus
                      placeholder="Enter name..."
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 4px',
                        lineHeight: '1'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuildingNameClear();
                      }}
                      title="Clear label"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Instructions for Selected Building */}
              {selectedBuilding?.id === building.id && !editingBuilding && (
                <div 
                  className="position-absolute bg-primary text-white px-2 py-1 rounded small"
                  style={{ 
                    top: `-${Math.max(20, building.height * 0.1)}px`, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: building.width > 120 ? '0.75rem' : '0.6rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Click to rename • Drag corners to resize
                </div>
              )}

              {/* Delete and resize handles for selected building */}
              {selectedBuilding?.id === building.id && (
                <>
                  {/* Delete button */}
                  <button
                    className="position-absolute btn btn-sm btn-danger"
                    style={{
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      padding: '0',
                      fontSize: '0.7rem',
                      lineHeight: '1',
                      zIndex: 20
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBuilding(building.id);
                    }}
                  >
                    ✕
                  </button>
                  
                  {/* Corner resize handles */}
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      bottom: '-6px',
                      right: '-6px',
                      cursor: 'se-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, building, 'se')}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      top: '-6px',
                      left: '-6px',
                      cursor: 'nw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, building, 'nw')}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      top: '-6px',
                      right: '-6px',
                      cursor: 'ne-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, building, 'ne')}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '12px',
                      height: '12px',
                      bottom: '-6px',
                      left: '-6px',
                      cursor: 'sw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => handleResizeStart(e, building, 'sw')}
                  />
                </>
              )}
            </div>
          ))}

          {/* Canvas Instructions */}
          {buildings.length === 0 && streets.length === 0 && (
            <div className="position-absolute top-50 start-50 translate-middle text-center text-muted">
              <div className="display-1 mb-3">🏗️</div>
              <h5>Start Building Your City</h5>
              <p>Drag buildings and infrastructure from the left panel to place them here</p>
            </div>
          )}
        </div>
      </div>

      {/* Building Properties Panel */}
      {selectedBuilding && window.BuildingPropertiesPanel && React.createElement(window.BuildingPropertiesPanel, {
        selectedBuilding: selectedBuilding,
        onClose: () => clearSelection(),
        onUpdateBuilding: updateBuilding,
        onDeleteBuilding: deleteBuilding,
        onDuplicateBuilding: handleDuplicateBuilding,
        getCityStats: getCityStats,
        buildings: buildings,
        onSelectBuilding: selectBuilding
      })}

      {/* Street Properties Panel */}
      {selectedStreet && window.StreetPropertiesPanel && React.createElement(window.StreetPropertiesPanel, {
        selectedStreet: selectedStreet,
        onClose: () => clearSelection(),
        onUpdateStreet: updateStreet,
        onDeleteStreet: deleteStreet,
        streets: streets
      })}

      {/* Export Modal */}
      {showExportModal && window.ExportModal && React.createElement(window.ExportModal, {
        isOpen: showExportModal,
        onClose: () => setShowExportModal(false),
        cityName: cityName,
        buildings: buildings,
        streets: streets,
        backgroundColor: backgroundColor,
        getCityStats: getCityStats,
        canvasRef: canvasRef
      })}
    </div>
  );
};

// Export to global scope
window.CityBuilder = CityBuilder;