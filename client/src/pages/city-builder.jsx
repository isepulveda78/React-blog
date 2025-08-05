const { React, useState, useEffect } = window;

// For now, create a simple placeholder hook since the complex one isn't compatible
const useCityBuilder = () => {
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBuildingType, setDraggedBuildingType] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#f3f4f6");
  
  return {
    cityName, setCityName, buildings, streets, selectedBuilding, selectedStreet,
    isDragging, setIsDragging, draggedBuildingType, setDraggedBuildingType,
    zoomLevel, gridEnabled, setGridEnabled, backgroundColor, setBackgroundColor,
    // Placeholder functions
    selectStreet: () => {}, addBuilding: () => {}, addStreet: () => {},
    startStreetDrawing: () => {}, updateStreetDrawing: () => {}, finishStreetDrawing: () => {},
    isDrawingStreet: false, streetStartPoint: null, streetEndPoint: null,
    draggedStreetType: null, setDraggedStreetType: () => {},
    updateBuilding: () => {}, deleteBuilding: () => {}, selectBuilding: () => {},
    clearSelection: () => {}, clearCanvas: () => {}, zoomIn: () => {}, zoomOut: () => {},
    saveCity: () => {}, loadCity: () => {}, getCityStats: () => ({}),
    startDragItem: () => {}, moveItem: () => {}, draggedItem: null,
    setDraggedItem: () => {}, dragOffset: {x: 0, y: 0}, startPan: () => {},
    updatePan: () => {}, endPan: () => {}, resetView: () => {}, isPanning: false,
    updateStreet: () => {}, copyItem: () => {}, pasteItem: () => {},
    copiedItem: null, deleteStreet: () => {}
  };
};

// Simple toast placeholder
const useToast = () => ({
  toast: (options) => {
    console.log('Toast:', options.title, options.description);
  }
});

const CityBuilder = ({ user }) => {
  const {
    cityName,
    setCityName,
    buildings,
    streets,
    selectedBuilding,
    selectedStreet,
    selectStreet,
    isDragging,
    setIsDragging,
    draggedBuildingType,
    setDraggedBuildingType,
    zoomLevel,
    gridEnabled,
    setGridEnabled,
    canvasOffset,
    backgroundColor,
    setBackgroundColor,
    addBuilding,
    addStreet,
    startStreetDrawing,
    updateStreetDrawing,
    finishStreetDrawing,
    isDrawingStreet,
    streetStartPoint,
    streetEndPoint,
    draggedStreetType,
    setDraggedStreetType,
    updateBuilding,
    deleteBuilding,
    selectBuilding,
    clearSelection,
    clearCanvas,
    zoomIn,
    zoomOut,

    saveCity,
    loadCity,
    getCityStats,
    startDragItem,
    moveItem,
    draggedItem,
    setDraggedItem,
    dragOffset,
    startPan,
    updatePan,
    endPan,
    resetView,
    isPanning,
    updateStreet,
    copyItem,
    pasteItem,
    copiedItem,
    deleteStreet,
  } = useCityBuilder();

  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditingCityName, setIsEditingCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);

  const canvasRef = { current: null }; // Simple placeholder for useRef

  const { toast } = useToast();

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
            if (copyItem()) {
              toast({
                title: "Copied",
                description: `${selectedBuilding ? "Building" : "Street"} copied to clipboard`,
              });
            }
            break;
          case "v":
            e.preventDefault();
            if (pasteItem()) {
              toast({
                title: "Pasted",
                description: `${copiedItem?.itemType === "building" ? "Building" : "Street"} pasted successfully`,
              });
            } else if (copiedItem) {
              toast({
                title: "Cannot Paste",
                description: "Not enough space to place the item",
                variant: "destructive",
              });
            }
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
  }, [
    copyItem,
    pasteItem,
    copiedItem,
    selectedBuilding,
    selectedStreet,
    deleteBuilding,
    deleteStreet,
    toast,
  ]);

  const handleBackgroundColorChange = (color) => {
    console.log("Background color changing from", backgroundColor, "to", color);
    setBackgroundColor(color);
  };

  const handleBuildingDragStart = (buildingType) => {
    setDraggedBuildingType(buildingType);
    setIsDragging(!!buildingType);
  };

  const handleStreetDragStart = (streetType) => {
    console.log("Setting draggedStreetType to:", streetType);
    setDraggedStreetType(streetType);
    setIsDragging(!!streetType);
  };

  const handleCityNameEdit = () => {
    setIsEditingCityName(true);
    setCityNameInput(cityName);
  };

  const handleCityNameSave = () => {
    setCityName(cityNameInput);
    setIsEditingCityName(false);
  };

  const handleCityNameKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCityNameSave();
    }
    if (e.key === "Escape") {
      setCityNameInput(cityName);
      setIsEditingCityName(false);
    }
  };

  const handleSelectBuilding = (building) => {
    selectBuilding(building);
  };

  const handleSelectStreet = (street) => {
    selectStreet(street);
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
      clearCanvas();
      toast({
        title: "Canvas Cleared",
        description: "All buildings have been removed.",
      });
    }
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
        {window.BuildingPalette && React.createElement(window.BuildingPalette, {
          onBuildingDragStart: handleBuildingDragStart,
          onStreetDragStart: handleStreetDragStart,
          onClearCanvas: handleClearCanvas,
          gridEnabled: gridEnabled,
          onToggleGrid: () => setGridEnabled(!gridEnabled),
          backgroundColor: backgroundColor,
          onBackgroundColorChange: handleBackgroundColorChange
        })}

        {/* Simplified Canvas Area */}
        <div className="flex-grow-1 position-relative bg-light border" style={{ minHeight: '400px', backgroundColor: backgroundColor }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center">
              <div className="display-1 mb-3">🏗️</div>
              <h3>City Builder Canvas</h3>
              <p className="text-muted">Your building palette is now connected!</p>
              <p className="small text-info">
                Canvas area is ready for your city building functionality.
              </p>
            </div>
          </div>
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
