// Working City Builder with Enhanced Features
// Features: Building placement, drag-and-drop, building naming with clear label button

// Building Types Data - Fixed format for browser compatibility
window.BUILDING_TYPES = {
  // Residential
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  condo: { category: "residential", name: "Condo", icon: "🏘️", width: 50, height: 70 },
  
  // Commercial
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  mall: { category: "commercial", name: "Mall", icon: "🏬", width: 120, height: 80 },
  restaurant: { category: "commercial", name: "Restaurant", icon: "🍽️", width: 60, height: 50 },
  
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
  park: { category: "nature", name: "Park", icon: "🌳", width: 80, height: 60 }
};

// Working state management for CityBuilder
const useCityBuilderHook = () => {
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingNameInput, setBuildingNameInput] = useState('');
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#90EE90");
  const [isEditingCityName, setIsEditingCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);

  // Building operations
  const addBuilding = (building) => {
    const newBuilding = {
      ...building,
      id: Date.now() + Math.random()
    };
    setBuildings(prev => [...prev, newBuilding]);
    console.log("Building added:", newBuilding);
  };

  const updateBuilding = (id, updates) => {
    setBuildings(prev => 
      prev.map(building => 
        building.id === id ? { ...building, ...updates } : building
      )
    );
  };

  const deleteBuilding = (id) => {
    setBuildings(prev => prev.filter(building => building.id !== id));
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
  };

  const selectBuilding = (building) => {
    setSelectedBuilding(building);
    setEditingBuilding(null);
  };

  const clearSelection = () => {
    setSelectedBuilding(null);
    setEditingBuilding(null);
  };

  const handleClearCanvas = () => {
    setBuildings([]);
    setSelectedBuilding(null);
    setEditingBuilding(null);
  };

  return {
    cityName, setCityName,
    buildings, setBuildings,
    selectedBuilding, setSelectedBuilding,
    editingBuilding, setEditingBuilding,
    buildingNameInput, setBuildingNameInput,
    gridEnabled, setGridEnabled,
    backgroundColor, setBackgroundColor,
    isEditingCityName, setIsEditingCityName,
    cityNameInput, setCityNameInput,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    selectBuilding,
    clearSelection,
    handleClearCanvas
  };
};

// Main CityBuilder Component
const CityBuilder = () => {
  const {
    cityName, setCityName,
    buildings,
    selectedBuilding,
    editingBuilding, setEditingBuilding,
    buildingNameInput, setBuildingNameInput,
    gridEnabled, setGridEnabled,
    backgroundColor, setBackgroundColor,
    isEditingCityName, setIsEditingCityName,
    cityNameInput, setCityNameInput,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    selectBuilding,
    clearSelection,
    handleClearCanvas
  } = useCityBuilderHook();

  // Canvas event handlers
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    if (dragData.isBuilding) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      
      // Grid snapping
      const snappedX = gridEnabled ? Math.round(x / 20) * 20 : x;
      const snappedY = gridEnabled ? Math.round(y / 20) * 20 : y;
      
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
    }
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasClick = (e) => {
    // Click on empty canvas to clear selection
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Building interaction handlers
  const handleBuildingClick = (e, building) => {
    e.stopPropagation();
    if (selectedBuilding?.id === building.id && !editingBuilding) {
      // Double click to edit name
      handleBuildingNameEdit(building);
    } else {
      selectBuilding(building);
    }
  };

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

  // City name handlers
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
        </div>
      </header>

      <div className="d-flex" style={{ height: "calc(100vh - 76px)" }}>
        {/* Building Palette */}
        <div className="bg-white shadow border-end d-flex flex-column" style={{ width: "300px", maxHeight: "100vh" }}>
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
                  {Object.entries(window.BUILDING_TYPES)
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
              
              {/* Background Color Picker */}
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

          {/* Render Buildings */}
          {buildings.map((building) => (
            <div
              key={building.id}
              className={`position-absolute border rounded ${selectedBuilding?.id === building.id ? 'border-primary border-3' : 'border-secondary'}`}
              style={{
                left: `${building.x}px`,
                top: `${building.y}px`,
                width: `${building.width}px`,
                height: `${building.height}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: building.width > 60 ? '2rem' : '1.5rem',
                transition: 'all 0.2s ease',
                zIndex: selectedBuilding?.id === building.id ? 10 : 1
              }}
              onClick={(e) => handleBuildingClick(e, building)}
            >
              {/* Building Icon */}
              <div className="text-center">
                {building.type === 'university' ? (
                  <span>🏛️</span>
                ) : (
                  <span>{window.BUILDING_TYPES[building.type]?.icon || '🏢'}</span>
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
                      className="btn btn-sm btn-outline-danger"
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 4px',
                        lineHeight: '1'
                      }}
                      onClick={handleBuildingNameClear}
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
                  Click to rename • Drag to move
                </div>
              )}
            </div>
          ))}

          {/* Canvas Instructions */}
          {buildings.length === 0 && (
            <div className="position-absolute top-50 start-50 translate-middle text-center text-muted">
              <div className="display-1 mb-3">🏗️</div>
              <h5>Start Building Your City</h5>
              <p>Drag buildings from the left panel to place them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export component to window for browser compatibility
window.CityBuilder = CityBuilder;