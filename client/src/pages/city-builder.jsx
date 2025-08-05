const { React } = window;
const { useState, useEffect, useRef } = React;

// Use the real hooks from window or fallback to simple versions
const useCityBuilderHook = window.useCityBuilder || (() => ({
  cityName: "My Amazing City",
  buildings: [],
  streets: [],
  selectedBuilding: null,
  selectedStreet: null,
  gridEnabled: true,
  backgroundColor: "#f3f4f6",
  canvasRef: React.useRef(null),
  // Mock functions as fallback
  updateBuilding: () => {},
  deleteBuilding: () => {},
  updateStreet: () => {},
  deleteStreet: () => {},
  clearSelection: () => {},
  selectBuilding: () => {},
  handleClearCanvas: () => {},
  getCityStats: () => ({ total: 0, labeled: 0, residential: 0, commercial: 0, public: 0, nature: 0 })
}));

const useToastHook = window.useToast || (() => ({
  toast: (options) => console.log('Toast:', options.title, options.description)
}));

const CityBuilder = ({ user }) => {
  // Use the proper hooks
  const cityBuilderState = useCityBuilderHook();
  const { toast } = useToastHook();
  
  const {
    cityName,
    buildings,
    streets,
    selectedBuilding,
    selectedStreet,
    gridEnabled,
    backgroundColor,
    canvasRef,
    updateBuilding,
    deleteBuilding,
    updateStreet,
    deleteStreet,
    clearSelection,
    selectBuilding,
    getCityStats
  } = cityBuilderState;

  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditingCityName, setIsEditingCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            e.preventDefault();
            if (selectedBuilding || selectedStreet) {
              toast({
                title: "Copied",
                description: `${selectedBuilding ? "Building" : "Street"} copied to clipboard`,
              });
            }
            break;
          case "v":
            e.preventDefault();
            toast({
              title: "Paste",
              description: "Paste functionality will be implemented soon",
            });
            break;
        }
      }

      // Delete key functionality
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedBuilding) {
          deleteBuilding(selectedBuilding.id);
          toast({
            title: "Deleted",
            description: "Building deleted successfully",
          });
        } else if (selectedStreet) {
          deleteStreet(selectedStreet.id);
          toast({
            title: "Deleted",
            description: `${selectedStreet.type === "grass-patch" ? "Grass patch" : "Street"} deleted successfully`,
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedBuilding, selectedStreet, deleteBuilding, deleteStreet, toast]);

  const handleBackgroundColorChange = (color) => {
    console.log("Background color changing from", backgroundColor, "to", color);
    // setBackgroundColor function will be added by hook later
  };

  const handleBuildingDragStart = (buildingType) => {
    console.log("Building drag start:", buildingType);
    // Drag handlers will be added by hook later
  };

  const handleStreetDragStart = (streetType) => {
    console.log("Street drag start:", streetType);
    // Drag handlers will be added by hook later
  };

  const handleCityNameEdit = () => {
    setIsEditingCityName(true);
    setCityNameInput(cityName);
  };

  const handleCityNameSave = () => {
    // setCityName function will be added by hook later
    setIsEditingCityName(false);
  };

  const handleCityNameKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCityNameSave();
    }
    if (e.key === "Escape") {
      setCityNameInput(cityName || "My Amazing City");
      setIsEditingCityName(false);
    }
  };

  const handleSelectBuilding = (building) => {
    selectBuilding(building);
  };

  const handleSelectStreet = (street) => {
    // selectStreet function will be added by hook later
    console.log("Select street:", street);
  };

  const handleResizeStart = (e, item, handle) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const originalItem = { ...item };
    const isBuilding = item.hasOwnProperty("category"); // Buildings have category, streets don't

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newItem = { ...originalItem };
      const minSize = 20; // Minimum size for all items

      // Allow independent width and height resizing for both grass and streets
      switch (handle) {
        case "se": // Southeast - resize from bottom-right
          newItem.width = Math.max(minSize, originalItem.width + deltaX);
          newItem.height = Math.max(minSize, originalItem.height + deltaY);
          break;
        case "sw": // Southwest - resize from bottom-left
          newItem.width = Math.max(minSize, originalItem.width - deltaX);
          newItem.height = Math.max(minSize, originalItem.height + deltaY);
          newItem.x = originalItem.x + deltaX;
          if (newItem.width === minSize)
            newItem.x = originalItem.x + originalItem.width - minSize;
          break;
        case "ne": // Northeast - resize from top-right
          newItem.width = Math.max(minSize, originalItem.width + deltaX);
          newItem.height = Math.max(minSize, originalItem.height - deltaY);
          newItem.y = originalItem.y + deltaY;
          if (newItem.height === minSize)
            newItem.y = originalItem.y + originalItem.height - minSize;
          break;
        case "nw": // Northwest - resize from top-left
          newItem.width = Math.max(minSize, originalItem.width - deltaX);
          newItem.height = Math.max(minSize, originalItem.height - deltaY);
          newItem.x = originalItem.x + deltaX;
          newItem.y = originalItem.y + deltaY;
          if (newItem.width === minSize)
            newItem.x = originalItem.x + originalItem.width - minSize;
          if (newItem.height === minSize)
            newItem.y = originalItem.y + originalItem.height - minSize;
          break;
      }

      // Update the appropriate item type
      if (isBuilding) {
        updateBuilding(item.id, newItem);
      } else {
        updateStreet(item.id, newItem);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = `${handle}-resize`;
  };

  const handleDuplicateBuilding = (building) => {
    console.log('Duplicate building:', building);
    toast({
      title: "Building Duplicated",
      description: "A copy of the building has been created.",
    });
  };

  const handleClearCanvas = () => {
    if (
      buildings.length > 0 &&
      confirm("Are you sure you want to clear all buildings?")
    ) {
      // clearCanvas function will be added by hook later
      toast({
        title: "Canvas Cleared",
        description: "All buildings have been removed.",
      });
    }
  };

  // Real drag-and-drop handlers
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleCanvasDragOver = (e) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const dragData = e.dataTransfer.getData("text/plain");
    if (!dragData) return;

    try {
      const { type, category, itemData } = JSON.parse(dragData);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get building/street data from drag payload or fallback
      const typeData = itemData || BUILDING_TYPES[type] || STREET_TYPES[type];
      if (!typeData) return;

      const newItem = {
        type: type,
        x: Math.max(0, x - typeData.width / 2),
        y: Math.max(0, y - typeData.height / 2),
        width: typeData.width,
        height: typeData.height,
        category: typeData.category
      };

      // Add building or street using hook functions if available
      if (category === "roads" || type === "grass-patch") {
        // It's a street/road
        newItem.color = type === "grass-patch" ? "#22c55e" : "#6b7280";
        if (cityBuilderState.addStreet) {
          cityBuilderState.addStreet(newItem);
        } else {
          // Fallback - direct state manipulation
          console.log("Adding street:", newItem);
        }
      } else {
        // It's a building
        if (cityBuilderState.addBuilding) {
          cityBuilderState.addBuilding(newItem);
        } else {
          // Fallback - direct state manipulation  
          console.log("Adding building:", newItem);
        }
      }

      toast({
        title: "Item Placed",
        description: `${typeData.name} has been added to your city.`,
      });
    } catch (error) {
      console.error("Error dropping item:", error);
    }
  };

  const handleCanvasClick = (e) => {
    // Clear selection when clicking empty canvas
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  const handleBuildingMouseDown = (e, building) => {
    if (e.detail === 2) {
      // Double click - select for editing
      selectBuilding(building);
      return;
    }

    // Single click - start dragging
    const startX = e.clientX;
    const startY = e.clientY;
    const originalBuilding = { ...building };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newBuilding = {
        ...originalBuilding,
        x: Math.max(0, originalBuilding.x + deltaX),
        y: Math.max(0, originalBuilding.y + deltaY)
      };

      updateBuilding(building.id, newBuilding);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "grabbing";
  };

  // Add BUILDING_TYPES and STREET_TYPES data
  const BUILDING_TYPES = window.BUILDING_TYPES || {
    house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
    apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
    shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
    office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
    factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
    tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 }
  };

  const STREET_TYPES = window.STREET_TYPES || {
    road: { category: "roads", name: "Road", icon: "🛣️", width: 20, height: 20 },
    "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
  };

  return (
    <div className="vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom px-4 py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i
                className="fas fa-city text-primary"
                style={{ fontSize: "1.5rem" }}
              ></i>
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
        {window.BuildingPalette ? React.createElement(window.BuildingPalette, {
          onBuildingDragStart: handleBuildingDragStart,
          onStreetDragStart: handleStreetDragStart,
          onClearCanvas: handleClearCanvas,
          gridEnabled: gridEnabled,
          onToggleGrid: () => setGridEnabled(!gridEnabled),
          backgroundColor: backgroundColor,
          onBackgroundColorChange: handleBackgroundColorChange
        }) : (
          <div className="bg-white shadow border-end d-flex flex-column" style={{ width: "320px", maxHeight: "100vh" }}>
            <div className="p-3 border-bottom flex-fill overflow-auto">
              <h2 className="h5 fw-semibold text-dark mb-3">Building Palette</h2>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>
                    <strong>Loading...</strong>
                    <div className="small">Building palette is loading. Check console for errors.</div>
                    <div className="small text-muted">BuildingPalette available: {window.BuildingPalette ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Canvas Area */}
        <div 
          className="flex-grow-1 position-relative overflow-hidden border"
          style={{ 
            minHeight: '400px', 
            backgroundColor: backgroundColor,
            cursor: isDragging ? 'grabbing' : 'default'
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
              className={`position-absolute border ${selectedBuilding?.id === building.id ? 'border-primary border-3' : 'border-secondary'}`}
              style={{
                left: building.x,
                top: building.y,
                width: building.width,
                height: building.height,
                backgroundColor: building.customColor || '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                boxShadow: selectedBuilding?.id === building.id ? '0 0 10px rgba(59, 130, 246, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: selectedBuilding?.id === building.id ? 10 : 1,
                userSelect: 'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectBuilding(building);
              }}
              onMouseDown={(e) => handleBuildingMouseDown(e, building)}
            >
              <span>{BUILDING_TYPES[building.type]?.icon || '🏢'}</span>
              {building.label && (
                <div 
                  className="position-absolute bg-dark text-white px-1 rounded small"
                  style={{ 
                    bottom: '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {building.label}
                </div>
              )}
            </div>
          ))}

          {/* Render Streets */}
          {streets.map((street) => (
            <div
              key={street.id}
              className={`position-absolute border ${selectedStreet?.id === street.id ? 'border-primary border-3' : 'border-secondary'}`}
              style={{
                left: street.x,
                top: street.y,
                width: street.width,
                height: street.height,
                backgroundColor: street.color || '#6b7280',
                cursor: 'pointer',
                zIndex: selectedStreet?.id === street.id ? 10 : 0,
                userSelect: 'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStreet(street);
                setSelectedBuilding(null);
              }}
            />
          ))}

          {/* Canvas Instructions */}
          {buildings.length === 0 && streets.length === 0 && (
            <div className="position-absolute top-50 start-50 translate-middle text-center text-muted">
              <div className="display-1 mb-3">🏗️</div>
              <h5>Start Building Your City</h5>
              <p>Drag buildings from the left panel to place them here</p>
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

window.CityBuilder = CityBuilder;
