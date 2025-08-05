// STABLE CityBuilder - No Auto Reload Issues
console.log("STABLE CITYBUILDER: Starting");
console.log("BUILDING_TYPES:", BUILDING_TYPES);
console.log("STREET_TYPES:", STREET_TYPES);

// Building and Street Types
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
  industrial: {
    factory: { name: "Factory", icon: "🏭", width: 100, height: 80, color: "#f97316" },
    warehouse: { name: "Warehouse", icon: "📦", width: 90, height: 70, color: "#f97316" },
    powerplant: { name: "Power Plant", icon: "⚡", width: 120, height: 100, color: "#f97316" }
  },
  public: {
    school: { name: "School", icon: "🏫", width: 100, height: 80, color: "#ef4444" },
    hospital: { name: "Hospital", icon: "🏥", width: 110, height: 90, color: "#ef4444" },
    police: { name: "Police", icon: "👮", width: 70, height: 60, color: "#ef4444" }
  },
  nature: {
    park: { name: "Park", icon: "🌳", width: 80, height: 80, color: "#84cc16" },
    "oak-tree": { name: "Oak Tree", icon: "🌳", width: 30, height: 30, color: "#84cc16" },
    "grass-patch": { name: "Grass Patch", icon: "🌱", width: 40, height: 40, color: "#84cc16" }
  }
};

const STREET_TYPES = {
  road: { name: "Road", icon: "🛣️", width: 20, height: 20, category: "infrastructure" },
  water: { name: "Water", icon: "💧", width: 40, height: 40, category: "infrastructure" }
};

// Stable CityBuilder Component
const StableCityBuilder = () => {
  console.log("STABLE: Component loaded");
  
  const [buildings, setBuildings] = React.useState([]);
  const [streets, setStreets] = React.useState([]);
  const [selectedBuilding, setSelectedBuilding] = React.useState(null);
  const [selectedStreet, setSelectedStreet] = React.useState(null);
  const [gridEnabled, setGridEnabled] = React.useState(true);
  const [backgroundColor, setBackgroundColor] = React.useState('#90EE90');
  const canvasRef = React.useRef(null);
  
  // Handle Delete key for removing selected items
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStreet) {
          setStreets(prev => prev.filter(s => s.id !== selectedStreet.id));
          setSelectedStreet(null);
          console.log("STABLE: Street deleted with Delete key");
        } else if (selectedBuilding) {
          setBuildings(prev => prev.filter(b => b.id !== selectedBuilding.id));
          setSelectedBuilding(null);
          console.log("STABLE: Building deleted with Delete key");
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStreet, selectedBuilding]);
  
  // Simple drag function
  const handleDragStart = (e, item) => {
    if (e.target.classList.contains('resize-handle') || e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    console.log("STABLE DRAG:", item.type);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    function onMove(me) {
      const newX = Math.max(0, item.x + (me.clientX - startX));
      const newY = Math.max(0, item.y + (me.clientY - startY));
      
      // Check if it's a building (has specific building categories) or street/infrastructure
      const isBuilding = item.category && ['residential', 'commercial', 'industrial', 'public', 'nature'].includes(item.category);
      
      if (isBuilding) {
        setBuildings(prev => prev.map(b => b.id === item.id ? { ...b, x: newX, y: newY } : b));
      } else {
        setStreets(prev => prev.map(s => s.id === item.id ? { ...s, x: newX, y: newY } : s));
      }
    }
    
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  
  // Complete resize function with all 4 corners
  const handleResizeStart = (e, item, direction) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("STABLE RESIZE:", item.type, direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    function onMove(me) {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      
      let newWidth = item.width;
      let newHeight = item.height;
      let newX = item.x;
      let newY = item.y;
      
      // Handle all 4 resize directions
      if (direction === 'se') {
        newWidth = Math.max(20, item.width + dx);
        newHeight = Math.max(20, item.height + dy);
      } else if (direction === 'sw') {
        newWidth = Math.max(20, item.width - dx);
        newHeight = Math.max(20, item.height + dy);
        newX = item.x + (item.width - newWidth);
      } else if (direction === 'ne') {
        newWidth = Math.max(20, item.width + dx);
        newHeight = Math.max(20, item.height - dy);  
        newY = item.y + (item.height - newHeight);
      } else if (direction === 'nw') {
        newWidth = Math.max(20, item.width - dx);
        newHeight = Math.max(20, item.height - dy);
        newX = item.x + (item.width - newWidth);
        newY = item.y + (item.height - newHeight);
      }
      
      if (gridEnabled) {
        newWidth = Math.round(newWidth / 20) * 20;
        newHeight = Math.round(newHeight / 20) * 20;
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }
      
      const update = { width: newWidth, height: newHeight, x: Math.max(0, newX), y: Math.max(0, newY) };
      
      // Check if it's a building (has specific building categories) or street/infrastructure
      const isBuilding = item.category && ['residential', 'commercial', 'industrial', 'public', 'nature'].includes(item.category);
      
      if (isBuilding) {
        setBuildings(prev => prev.map(b => b.id === item.id ? { ...b, ...update } : b));
      } else {
        setStreets(prev => prev.map(s => s.id === item.id ? { ...s, ...update } : s));
      }
    }
    
    function onUp() {
      console.log("STABLE RESIZE: Complete");
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  
  // Handle canvas drop
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    if (gridEnabled) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }
    
    const newItem = {
      id: Date.now() + Math.random(),
      type: dragData.type,
      x: x,
      y: y,
      width: dragData.itemData.width,
      height: dragData.itemData.height,
      name: dragData.itemData.name,
      category: dragData.category
    };
    
    if (dragData.isBuilding) {
      setBuildings(prev => [...prev, newItem]);
      console.log("Building added:", newItem);
    } else if (dragData.isStreet) {
      setStreets(prev => [...prev, newItem]);
      console.log("Street added:", newItem);
    }
  };
  
  return (
    <div className="d-flex" style={{ width: "100vw", height: "100vh" }}>
      {/* Sidebar */}
      <div 
        className="border-end"
        style={{ 
          width: "280px", 
          minWidth: "280px",
          height: "100vh",
          overflowY: "auto", 
          zIndex: 10,
          display: "block",
          position: "relative",
          backgroundColor: "#f8f9fa",
          border: "2px solid #007bff"
        }}
      >
        <div className="p-3">
          <h2 className="h5 fw-bold text-dark mb-3">🏗️ CityBuilder</h2>
          
          {/* Building Categories */}
          {Object.entries(BUILDING_TYPES).map(([categoryKey, category]) => {
            console.log("Rendering category:", categoryKey, category);
            return (
            <div key={categoryKey} className="mb-4">
              <h3 className="h6 fw-medium text-dark mb-2 text-capitalize">{categoryKey}</h3>
              <div className="row g-2">
                {Object.entries(category).map(([type, building]) => {
                  console.log("Rendering building:", type, building);
                  return (
                  <div key={type} className="col-6">
                    <div
                      className="border border-2 border-dashed rounded-3 p-2 text-center"
                      style={{ 
                        cursor: "grab", 
                        backgroundColor: "#ffffff", 
                        border: "2px solid #28a745 !important",
                        minHeight: "60px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
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
                      }}
                    >
                      <div className="mb-1" style={{ fontSize: "1.5rem" }}>{building.icon}</div>
                      <p className="small fw-medium text-dark mb-0" style={{ fontSize: "0.65rem" }}>
                        {building.name}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            );
          })}
          
          {/* Infrastructure */}
          <div className="mb-4">
            <h3 className="h6 fw-medium text-dark mb-2">Infrastructure</h3>
            <div className="row g-2">
              {Object.entries(STREET_TYPES).map(([type, street]) => (
                <div key={type} className="col-6">
                  <div
                    className="border border-2 border-dashed rounded-3 p-2 text-center"
                    style={{ 
                      cursor: "grab", 
                      backgroundColor: "#ffffff",
                      border: "2px solid #dc3545 !important",
                      minHeight: "60px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    draggable
                    onDragStart={(e) => {
                      const dragData = { 
                        type: type, 
                        category: street.category,
                        isBuilding: false,
                        isStreet: true,
                        itemData: street
                      };
                      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                    }}
                  >
                    <div className="mb-1" style={{ fontSize: "1.5rem" }}>{street.icon}</div>
                    <p className="small fw-medium text-dark mb-0" style={{ fontSize: "0.65rem" }}>
                      {street.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tools */}
          <div className="p-3 border-top">
            <button 
              className="btn btn-secondary btn-sm w-100 mb-2"
              onClick={() => {
                setBuildings([]);
                setStreets([]);
                setSelectedBuilding(null);
                setSelectedStreet(null);
              }}
            >
              Clear All
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm w-100 mb-2"
              onClick={() => setGridEnabled(!gridEnabled)}
            >
              Grid: {gridEnabled ? "On" : "Off"}
            </button>
            <div className="alert alert-info small p-2 mb-0">
              <strong>Controls:</strong><br/>
              • Click to select items<br/>
              • Drag items to move<br/>
              • Drag blue corners to resize<br/>
              • Press <kbd>Delete</kbd> to remove selected
            </div>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="position-relative overflow-hidden"
        style={{ 
          width: 'calc(100vw - 280px)',
          height: '100vh',
          backgroundColor: backgroundColor,
          cursor: 'default'
        }}
        onDrop={handleCanvasDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          setSelectedBuilding(null);
          setSelectedStreet(null);
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
            className={`position-absolute ${selectedStreet?.id === street.id ? 'border border-info border-3' : ''}`}
            style={{
              left: `${street.x}px`,
              top: `${street.y}px`,
              width: `${street.width}px`,
              height: `${street.height}px`,
              backgroundColor: street.type === 'water' ? '#007bff' : '#000000',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStreet(street);
              setSelectedBuilding(null);
            }}
            onMouseDown={(e) => {
              if (selectedStreet?.id === street.id && !e.target.classList.contains('resize-handle')) {
                handleDragStart(e, street);
              }
            }}
          >
            {/* Resize handles for selected street - NO DELETE BUTTON */}
            {selectedStreet?.id === street.id && (
              <>
                {/* SE resize handle */}
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
                
                {/* SW resize handle */}
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
                
                {/* NE resize handle */}
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
                
                {/* NW resize handle */}
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
              </>
            )}
          </div>
        ))}
        
        {/* Buildings */}
        {buildings.map((building) => (
          <div
            key={building.id}
            className={`position-absolute d-flex align-items-center justify-content-center ${selectedBuilding?.id === building.id ? 'border border-info border-3' : ''}`}
            style={{
              left: `${building.x}px`,
              top: `${building.y}px`,
              width: `${building.width}px`,
              height: `${building.height}px`,
              backgroundColor: BUILDING_TYPES[building.category]?.[building.type]?.color || '#gray',
              cursor: 'pointer',
              fontSize: '2rem'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBuilding(building);
              setSelectedStreet(null);
            }}
            onMouseDown={(e) => {
              if (selectedBuilding?.id === building.id && !e.target.classList.contains('resize-handle')) {
                handleDragStart(e, building);
              }
            }}
          >
            {BUILDING_TYPES[building.category]?.[building.type]?.icon}
            
            {/* Resize handles for selected building - NO DELETE BUTTON */}
            {selectedBuilding?.id === building.id && (
              <>
                {/* SE resize handle */}
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
                  onMouseDown={(e) => handleResizeStart(e, building, 'se')}
                />
                
                {/* SW resize handle */}
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
                  onMouseDown={(e) => handleResizeStart(e, building, 'sw')}
                />
                
                {/* NE resize handle */}
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
                  onMouseDown={(e) => handleResizeStart(e, building, 'ne')}
                />
                
                {/* NW resize handle */}
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
                  onMouseDown={(e) => handleResizeStart(e, building, 'nw')}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Export for global use
window.StableCityBuilder = StableCityBuilder;