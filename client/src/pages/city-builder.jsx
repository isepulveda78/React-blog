const { React } = window;
const { useState, useEffect, useRef } = React;

// Building types configuration
const BUILDING_TYPES = {
  // Residential
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  
  // Commercial
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  "hair-salon": { category: "commercial", name: "Hair Salon", icon: "💇", width: 50, height: 50 },
  
  // Industrial
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  
  // Public Services
  hospital: { category: "public", name: "Hospital", icon: "🏥", width: 120, height: 100 },
  "fire-station": { category: "public", name: "Fire Station", icon: "🚒", width: 80, height: 60 },
  "police-station": { category: "public", name: "Police Station", icon: "🚔", width: 80, height: 60 },
  school: { category: "public", name: "School", icon: "🏫", width: 100, height: 80 },
  university: { category: "public", name: "University", icon: "🎓", width: 140, height: 120 },
  
  // Nature
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 },
  "oak-tree": { category: "nature", name: "Oak Tree", icon: "🌳", width: 30, height: 30 },
  "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
};

// Working state management for CityBuilder
const useCityBuilderHook = () => {
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#f3f4f6");
  const canvasRef = useRef(null);

  const selectBuilding = (building) => {
    console.log("Selecting building:", building);
    setSelectedBuilding(building);
    setSelectedStreet(null);
  };

  const updateBuilding = (id, updates) => {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBuilding = (id) => {
    setBuildings(prev => prev.filter(b => b.id !== id));
    setSelectedBuilding(null);
  };

  const updateStreet = (id, updates) => {
    setStreets(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStreet = (id) => {
    setStreets(prev => prev.filter(s => s.id !== id));
    setSelectedStreet(null);
  };

  const clearSelection = () => {
    setSelectedBuilding(null);
    setSelectedStreet(null);
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
    nature: buildings.filter(b => b.category === 'nature').length
  });

  return {
    cityName,
    setCityName,
    buildings,
    setBuildings,
    streets,
    setStreets,
    selectedBuilding,
    setSelectedBuilding,
    selectedStreet,
    setSelectedStreet,
    gridEnabled,
    setGridEnabled,
    backgroundColor,
    setBackgroundColor,
    canvasRef,
    selectBuilding,
    updateBuilding,
    deleteBuilding,
    updateStreet,
    deleteStreet,
    clearSelection,
    handleClearCanvas,
    getCityStats
  };
};

const useToastHook = window.useToast || (() => ({
  toast: (options) => console.log('Toast:', options.title, options.description)
}));

const CityBuilder = ({ user }) => {
  // Use the proper hooks
  const cityBuilderState = useCityBuilderHook();
  const { toast } = useToastHook();
  
  const {
    cityName,
    setCityName,
    buildings,
    setBuildings,
    streets,
    setStreets,
    selectedBuilding,
    setSelectedBuilding,
    selectedStreet,
    setSelectedStreet,
    gridEnabled,
    setGridEnabled,
    backgroundColor,
    setBackgroundColor,
    canvasRef,
    updateBuilding,
    deleteBuilding,
    updateStreet,
    deleteStreet,
    clearSelection,
    selectBuilding,
    handleClearCanvas,
    getCityStats
  } = cityBuilderState;

  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditingCityName, setIsEditingCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingNameInput, setBuildingNameInput] = useState('');

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

  const handleBuildingNameKeyPress = (e) => {
    if (e.key === "Enter") {
      handleBuildingNameSave();
    }
    if (e.key === "Escape") {
      setEditingBuilding(null);
      setBuildingNameInput('');
    }
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
    const isBuilding = item.hasOwnProperty("category") && item.category !== "roads";

    // Add visual feedback
    document.body.style.userSelect = 'none';
    document.body.style.cursor = `${handle}-resize`;

    let animationFrame;

    const handleMouseMove = (moveEvent) => {
      // Use requestAnimationFrame for smoother updates
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newItem = { ...originalItem };
        const minSize = 20; // Minimum size for all items

        // Handle all resize directions including edge resizing
        switch (handle) {
          case "se": // Southeast - resize from bottom-right
            newItem.width = Math.max(minSize, originalItem.width + deltaX);
            newItem.height = Math.max(minSize, originalItem.height + deltaY);
            break;
          case "sw": // Southwest - resize from bottom-left
            newItem.width = Math.max(minSize, originalItem.width - deltaX);
            newItem.height = Math.max(minSize, originalItem.height + deltaY);
            newItem.x = originalItem.x + (originalItem.width - newItem.width);
            break;
          case "ne": // Northeast - resize from top-right
            newItem.width = Math.max(minSize, originalItem.width + deltaX);
            newItem.height = Math.max(minSize, originalItem.height - deltaY);
            newItem.y = originalItem.y + (originalItem.height - newItem.height);
            break;
          case "nw": // Northwest - resize from top-left
            newItem.width = Math.max(minSize, originalItem.width - deltaX);
            newItem.height = Math.max(minSize, originalItem.height - deltaY);
            newItem.x = originalItem.x + (originalItem.width - newItem.width);
            newItem.y = originalItem.y + (originalItem.height - newItem.height);
            break;
          // Edge resize handles - smoother calculations
          case "n": // North - resize height from top
            newItem.height = Math.max(minSize, originalItem.height - deltaY);
            newItem.y = originalItem.y + (originalItem.height - newItem.height);
            break;
          case "s": // South - resize height from bottom
            newItem.height = Math.max(minSize, originalItem.height + deltaY);
            break;
          case "e": // East - resize width from right
            newItem.width = Math.max(minSize, originalItem.width + deltaX);
            break;
          case "w": // West - resize width from left
            newItem.width = Math.max(minSize, originalItem.width - deltaX);
            newItem.x = originalItem.x + (originalItem.width - newItem.width);
            break;
        }

        // Apply grid snapping only when enabled, but less aggressively during drag
        if (gridEnabled) {
          // Only snap to grid every 10px during drag for smoother experience
          const snapSize = 10;
          newItem.width = Math.max(minSize, Math.round(newItem.width / snapSize) * snapSize);
          newItem.height = Math.max(minSize, Math.round(newItem.height / snapSize) * snapSize);
          newItem.x = Math.round(newItem.x / snapSize) * snapSize;
          newItem.y = Math.round(newItem.y / snapSize) * snapSize;
        }

        // Update the appropriate item type
        if (isBuilding) {
          updateBuilding(item.id, newItem);
        } else {
          updateStreet(item.id, newItem);
        }
      });
    };

    const handleMouseUp = () => {
      // Cancel any pending animation frame
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = 'auto';

      // Final snap to grid if enabled
      if (gridEnabled) {
        const finalItem = { ...originalItem };
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        // Recalculate final position with proper grid snapping
        switch (handle) {
          case "se":
            finalItem.width = Math.max(20, Math.round((originalItem.width + deltaX) / 20) * 20);
            finalItem.height = Math.max(20, Math.round((originalItem.height + deltaY) / 20) * 20);
            break;
          case "sw":
            finalItem.width = Math.max(20, Math.round((originalItem.width - deltaX) / 20) * 20);
            finalItem.height = Math.max(20, Math.round((originalItem.height + deltaY) / 20) * 20);
            finalItem.x = Math.round((originalItem.x + originalItem.width - finalItem.width) / 20) * 20;
            break;
          case "ne":
            finalItem.width = Math.max(20, Math.round((originalItem.width + deltaX) / 20) * 20);
            finalItem.height = Math.max(20, Math.round((originalItem.height - deltaY) / 20) * 20);
            finalItem.y = Math.round((originalItem.y + originalItem.height - finalItem.height) / 20) * 20;
            break;
          case "nw":
            finalItem.width = Math.max(20, Math.round((originalItem.width - deltaX) / 20) * 20);
            finalItem.height = Math.max(20, Math.round((originalItem.height - deltaY) / 20) * 20);
            finalItem.x = Math.round((originalItem.x + originalItem.width - finalItem.width) / 20) * 20;
            finalItem.y = Math.round((originalItem.y + originalItem.height - finalItem.height) / 20) * 20;
            break;
          case "n":
            finalItem.height = Math.max(20, Math.round((originalItem.height - deltaY) / 20) * 20);
            finalItem.y = Math.round((originalItem.y + originalItem.height - finalItem.height) / 20) * 20;
            break;
          case "s":
            finalItem.height = Math.max(20, Math.round((originalItem.height + deltaY) / 20) * 20);
            break;
          case "e":
            finalItem.width = Math.max(20, Math.round((originalItem.width + deltaX) / 20) * 20);
            break;
          case "w":
            finalItem.width = Math.max(20, Math.round((originalItem.width - deltaX) / 20) * 20);
            finalItem.x = Math.round((originalItem.x + originalItem.width - finalItem.width) / 20) * 20;
            break;
        }

        // Apply final update
        if (isBuilding) {
          updateBuilding(item.id, finalItem);
        } else {
          updateStreet(item.id, finalItem);
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleStreetDrag = (e, street) => {
    // Only allow dragging if not clicking on resize handles
    if (e.target.classList.contains('position-absolute') || e.target.closest('.resize-handle')) {
      return; // Don't drag if clicking on a resize handle
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const originalStreet = { ...street };
    let isDragging = false;
    let hasMoved = false;

    document.body.style.userSelect = 'none';

    let animationFrame;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Only start dragging if mouse has moved more than 5 pixels
      if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        console.log("Started dragging street:", street.id);
      }

      if (isDragging) {
        hasMoved = true;
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }

        animationFrame = requestAnimationFrame(() => {
          let newStreet = {
            ...originalStreet,
            x: originalStreet.x + deltaX,
            y: originalStreet.y + deltaY
          };

          // Apply grid snapping during drag for smoother experience
          if (gridEnabled) {
            const snapSize = 10; // Lighter snapping during drag
            newStreet.x = Math.round(newStreet.x / snapSize) * snapSize;
            newStreet.y = Math.round(newStreet.y / snapSize) * snapSize;
          }

          updateStreet(street.id, newStreet);
        });
      }
    };

    const handleMouseUp = (event) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = 'auto';

      if (isDragging && hasMoved) {
        // Final snap to grid if enabled
        if (gridEnabled) {
          const deltaX = event.clientX - startX;
          const deltaY = event.clientY - startY;

          const finalStreet = {
            ...originalStreet,
            x: Math.round((originalStreet.x + deltaX) / 20) * 20,
            y: Math.round((originalStreet.y + deltaY) / 20) * 20
          };

          updateStreet(street.id, finalStreet);
          console.log("Street dragged to:", finalStreet.x, finalStreet.y);
        }
        
        // Prevent click event from firing after drag
        setTimeout(() => {
          document.body.style.pointerEvents = 'auto';
        }, 10);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleStreetMouseDown = (e, street) => {
    if (e.target !== e.currentTarget) return; // Only handle direct clicks on the street, not resize handles
    
    e.stopPropagation();
    // Don't prevent default to allow click events to fire

    // First select the street
    console.log("Selecting street on mousedown:", street.id);
    setSelectedStreet(street);
    setSelectedBuilding(null);

    const startX = e.clientX;
    const startY = e.clientY;
    const startStreetX = street.x;
    const startStreetY = street.y;
    let hasMoved = false;
    let dragThreshold = 5; // Only start dragging after moving 5 pixels

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > dragThreshold) {
        hasMoved = true;
        
        let newX = startStreetX + deltaX;
        let newY = startStreetY + deltaY;

        // Apply grid snapping if enabled
        if (gridEnabled) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }

        updateStreet(street.id, { 
          ...street, 
          x: Math.max(0, newX), 
          y: Math.max(0, newY) 
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      
      // If we didn't move much, this was just a selection click
      if (!hasMoved) {
        console.log("Street selected (no drag):", street.id);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    // Only change cursor if we're actually dragging
    setTimeout(() => {
      if (hasMoved) {
        document.body.style.cursor = "grabbing";
      }
    }, 50);
  };

  const handleDuplicateBuilding = (building) => {
    console.log('Duplicate building:', building);
    toast({
      title: "Building Duplicated",
      description: "A copy of the building has been created.",
    });
  };

  const handleClearCanvasClick = () => {
    if (
      (buildings.length > 0 || streets.length > 0) &&
      confirm("Are you sure you want to clear all buildings and streets?")
    ) {
      handleClearCanvas();
      toast({
        title: "Canvas Cleared",
        description: "All buildings and streets have been removed.",
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
    console.log("Drop event triggered on canvas");

    const dragData = e.dataTransfer.getData("text/plain");
    if (!dragData) {
      console.log("No drag data found");
      return;
    }

    try {
      const parsedData = JSON.parse(dragData);
      console.log("Parsed drag data:", parsedData);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log("Drop position:", x, y);

      const { type, category, itemData, isBuilding, isStreet } = parsedData;
      
      if (isBuilding) {
        const newBuilding = {
          id: Date.now() + Math.random(),
          type: type,
          category: category,
          x: gridEnabled ? Math.round(x / 20) * 20 : Math.max(0, x - itemData.width / 2),
          y: gridEnabled ? Math.round(y / 20) * 20 : Math.max(0, y - itemData.height / 2),
          width: itemData.width,
          height: itemData.height,
          name: itemData.name
        };
        console.log("Adding building:", newBuilding);
        setBuildings(prev => {
          const updated = [...prev, newBuilding];
          console.log("Updated buildings array:", updated);
          return updated;
        });
      } else if (isStreet) {
        const newStreet = {
          id: Date.now() + Math.random(),
          type: type,
          category: category,
          x: gridEnabled ? Math.round(x / 20) * 20 : Math.max(0, x - itemData.width / 2),
          y: gridEnabled ? Math.round(y / 20) * 20 : Math.max(0, y - itemData.height / 2),
          width: itemData.width,
          height: itemData.height,
          name: itemData.name,
          color: type === 'road' ? '#2d3748' : '#6b7280'
        };
        console.log("Adding street:", newStreet);
        setStreets(prev => {
          const updated = [...prev, newStreet];
          console.log("Updated streets array:", updated);
          return updated;
        });
      }
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
              
              {/* Fallback Building Categories */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle me-2" style={{ width: "16px", height: "16px", backgroundColor: "#10b981" }}></div>
                  <h3 className="h6 fw-medium text-dark mb-0">Residential</h3>
                </div>
                <div className="row g-2">
                  {[
                    { type: "house", name: "House", icon: "🏠", width: 40, height: 40 },
                    { type: "apartment", name: "Apartment", icon: "🏢", width: 60, height: 80 }
                  ].map((building) => (
                    <div key={building.type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: "#10b981",
                          borderOpacity: "0.3",
                          transition: "all 0.2s ease",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: building.type, 
                            category: "residential",
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
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem", color: "#10b981" }}>
                          {building.icon}
                        </div>
                        <p className="small fw-medium text-dark mb-0" style={{ fontSize: "0.65rem", lineHeight: "1.1" }}>
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

              {/* Commercial */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle me-2" style={{ width: "16px", height: "16px", backgroundColor: "#3b82f6" }}></div>
                  <h3 className="h6 fw-medium text-dark mb-0">Commercial</h3>
                </div>
                <div className="row g-2">
                  {[
                    { type: "shop", name: "Shop", icon: "🏪", width: 50, height: 50 },
                    { type: "office", name: "Office", icon: "🏢", width: 80, height: 100 },
                    { type: "hair-salon", name: "Hair Salon", icon: "💇", width: 50, height: 50 }
                  ].map((building) => (
                    <div key={building.type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: "#3b82f6",
                          borderOpacity: "0.3",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: building.type, 
                            category: "commercial",
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
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem", color: "#3b82f6" }}>
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

              {/* Public Services */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle me-2" style={{ width: "16px", height: "16px", backgroundColor: "#dc2626" }}></div>
                  <h3 className="h6 fw-medium text-dark mb-0">Public Services</h3>
                </div>
                <div className="row g-2">
                  {[
                    { type: "hospital", name: "Hospital", icon: "🏥", width: 120, height: 100 },
                    { type: "fire-station", name: "Fire Station", icon: "🚒", width: 80, height: 60 },
                    { type: "police-station", name: "Police Station", icon: "🚔", width: 80, height: 60 },
                    { type: "school", name: "School", icon: "🏫", width: 100, height: 80 },
                    { type: "university", name: "University", icon: "🎓", width: 140, height: 120 }
                  ].map((building) => (
                    <div key={building.type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: "#dc2626",
                          borderOpacity: "0.3",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: building.type, 
                            category: "public",
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
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem", color: "#dc2626" }}>
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

              {/* Industrial */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle me-2" style={{ width: "16px", height: "16px", backgroundColor: "#f59e0b" }}></div>
                  <h3 className="h6 fw-medium text-dark mb-0">Industrial</h3>
                </div>
                <div className="row g-2">
                  {[
                    { type: "factory", name: "Factory", icon: "🏭", width: 100, height: 80 },
                    { type: "warehouse", name: "Warehouse", icon: "🏢", width: 120, height: 60 }
                  ].map((building) => (
                    <div key={building.type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: "#f59e0b",
                          borderOpacity: "0.3",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: building.type, 
                            category: "industrial",
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
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem", color: "#f59e0b" }}>
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

              {/* Nature */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle me-2" style={{ width: "16px", height: "16px", backgroundColor: "#22c55e" }}></div>
                  <h3 className="h6 fw-medium text-dark mb-0">Nature & Roads</h3>
                </div>
                <div className="row g-2">
                  {[
                    { type: "tree", name: "Tree", icon: "🌳", width: 30, height: 30 },
                    { type: "park", name: "Park", icon: "🌿", width: 60, height: 60 },
                    { type: "road", name: "Road", icon: "🛣️", width: 20, height: 20 },
                    { type: "water", name: "Water", icon: "💧", width: 40, height: 40 }
                  ].map((building) => (
                    <div key={building.type} className="col-6">
                      <div
                        className="building-item border border-2 border-dashed rounded-3 p-2 text-center"
                        style={{
                          borderColor: "#22c55e",
                          borderOpacity: "0.3",
                          cursor: "grab",
                          backgroundColor: "#f8f9fa"
                        }}
                        draggable
                        onDragStart={(e) => {
                          const dragData = { 
                            type: building.type, 
                            category: (building.type === "road" || building.type === "water") ? "roads" : "nature",
                            isBuilding: building.type !== "road" && building.type !== "water",
                            isStreet: building.type === "road" || building.type === "water",
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
                        <div className="mb-1 d-block" style={{ fontSize: "1.5rem", color: "#22c55e" }}>
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

              {/* Debug info */}
              <div className="alert alert-info small">
                <div>BuildingPalette status: {window.BuildingPalette ? 'Loaded' : 'Not loaded'}</div>
                <div>Using fallback palette for now</div>
              </div>
            </div>
            
            {/* Tools section */}
            <div className="p-3 border-top">
              <div className="d-flex gap-2 mb-3">
                <button 
                  className="btn btn-secondary btn-sm flex-fill"
                  onClick={handleClearCanvasClick}
                >
                  <i className="fas fa-trash me-1"></i>Clear
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => {
                    const newGridState = !gridEnabled;
                    setGridEnabled(newGridState);
                    console.log("Grid toggled:", newGridState);
                  }}
                >
                  <i className="fas fa-th me-1"></i>Grid: {gridEnabled ? "On" : "Off"}
                </button>
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
                // Start editing name immediately after selection
                setTimeout(() => {
                  handleBuildingNameEdit(building);
                }, 100);
              }}
              onMouseDown={(e) => handleBuildingMouseDown(e, building)}
            >
              <span>{BUILDING_TYPES[building.type]?.icon || '🏢'}</span>
              
              {/* Building Name Display */}
              {(building.customName || building.name) && !editingBuilding && (
                <div 
                  className="position-absolute bg-dark text-white px-2 py-1 rounded small"
                  style={{ 
                    bottom: '-25px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap',
                    maxWidth: '120px',
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
                    bottom: '-35px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    zIndex: 20
                  }}
                >
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{
                      width: '120px',
                      fontSize: '0.75rem',
                      padding: '2px 6px'
                    }}
                    value={buildingNameInput}
                    onChange={(e) => setBuildingNameInput(e.target.value)}
                    onKeyDown={handleBuildingNameKeyPress}
                    onBlur={handleBuildingNameSave}
                    autoFocus
                    placeholder="Enter name..."
                  />
                </div>
              )}

              {/* Edit Instructions for Selected Building */}
              {selectedBuilding?.id === building.id && !editingBuilding && (
                <div 
                  className="position-absolute bg-primary text-white px-2 py-1 rounded small"
                  style={{ 
                    top: '-25px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.6rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Click to rename • Drag corners to resize
                </div>
              )}

              {/* Resize handles for selected building */}
              {selectedBuilding?.id === building.id && (
                <>
                  {/* Corner resize handles */}
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      top: '-4px',
                      left: '-4px',
                      cursor: 'nw-resize',
                      zIndex: 15,
                      backgroundColor: '#007bff'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'nw');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      top: '-4px',
                      right: '-4px',
                      cursor: 'ne-resize',
                      zIndex: 15,
                      backgroundColor: '#007bff'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'ne');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      bottom: '-4px',
                      left: '-4px',
                      cursor: 'sw-resize',
                      zIndex: 15,
                      backgroundColor: '#007bff'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'sw');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      bottom: '-4px',
                      right: '-4px',
                      cursor: 'se-resize',
                      zIndex: 15,
                      backgroundColor: '#007bff'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'se');
                    }}
                  />

                  {/* Edge resize handles */}
                  <div
                    className="position-absolute bg-secondary resize-handle"
                    style={{
                      width: '6px',
                      height: '12px',
                      top: '50%',
                      left: '-3px',
                      transform: 'translateY(-50%)',
                      cursor: 'w-resize',
                      zIndex: 15,
                      backgroundColor: '#28a745'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'w');
                    }}
                  />
                  <div
                    className="position-absolute bg-secondary resize-handle"
                    style={{
                      width: '6px',
                      height: '12px',
                      top: '50%',
                      right: '-3px',
                      transform: 'translateY(-50%)',
                      cursor: 'e-resize',
                      zIndex: 15,
                      backgroundColor: '#28a745'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'e');
                    }}
                  />
                  <div
                    className="position-absolute bg-secondary resize-handle"
                    style={{
                      width: '12px',
                      height: '6px',
                      top: '-3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 'n-resize',
                      zIndex: 15,
                      backgroundColor: '#dc3545'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 'n');
                    }}
                  />
                  <div
                    className="position-absolute bg-secondary resize-handle"
                    style={{
                      width: '12px',
                      height: '6px',
                      bottom: '-3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 's-resize',
                      zIndex: 15,
                      backgroundColor: '#dc3545'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, building, 's');
                    }}
                  />
                </>
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
                backgroundColor: street.type === 'road' ? 'transparent' : (street.color || '#6b7280'),
                cursor: selectedStreet?.id === street.id ? 'move' : 'grab',
                zIndex: selectedStreet?.id === street.id ? 10 : 0,
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log("Street clicked:", street);
                console.log("Current selectedStreet:", selectedStreet?.id);
                setSelectedStreet(street);
                setSelectedBuilding(null);
                console.log("Should show handles for street:", street.id);
              }}
              onMouseDown={(e) => {
                console.log("Street mousedown:", street);
                handleStreetDrag(e, street);
              }}
            >
              {/* Render different street types */}
              {street.type === 'road' && (
                <div 
                  className="w-100 h-100"
                  style={{
                    backgroundColor: '#2d3748',
                    border: selectedStreet?.id === street.id ? '2px solid #3b82f6' : '1px solid #4a5568',
                    transition: selectedStreet?.id === street.id ? 'none' : 'all 0.2s ease'
                  }}
                />
              )}
              {street.type === 'water' && (
                <div 
                  className="w-100 h-100"
                  style={{
                    backgroundColor: '#1e40af',
                    border: selectedStreet?.id === street.id ? '2px solid #3b82f6' : '1px solid #2563eb',
                    transition: selectedStreet?.id === street.id ? 'none' : 'all 0.2s ease',
                    backgroundImage: 'linear-gradient(45deg, #1e40af 25%, #2563eb 25%, #2563eb 50%, #1e40af 50%, #1e40af 75%, #2563eb 75%, #2563eb)',
                    backgroundSize: '8px 8px'
                  }}
                />
              )}
              {street.type === 'grass-patch' && '🌿'}
              
              {/* Debug selected street */}
              {selectedStreet?.id === street.id && console.log("Selected street rendering handles for:", street.id)}
              
              {/* Resize handles for selected street */}
              {selectedStreet?.id === street.id && (
                <>
                  {/* Corner resize handles */}
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      top: '-4px',
                      left: '-4px',
                      cursor: 'nw-resize',
                      zIndex: 15
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, street, 'nw');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      top: '-4px',
                      right: '-4px',
                      cursor: 'ne-resize',
                      zIndex: 15
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, street, 'ne');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      bottom: '-4px',
                      left: '-4px',
                      cursor: 'sw-resize',
                      zIndex: 15
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, street, 'sw');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary rounded-circle resize-handle"
                    style={{
                      width: '8px',
                      height: '8px',
                      bottom: '-4px',
                      right: '-4px',
                      cursor: 'se-resize',
                      zIndex: 15
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, street, 'se');
                    }}
                  />
                  
                  {/* Edge resize handles for stretching roads */}
                  <div
                    className="position-absolute bg-primary resize-handle"
                    style={{
                      width: '6px',
                      height: '12px',
                      top: '50%',
                      left: '-3px',
                      transform: 'translateY(-50%)',
                      cursor: 'w-resize',
                      zIndex: 15,
                      backgroundColor: '#28a745'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      console.log("West handle clicked for street:", street.id);
                      handleResizeStart(e, street, 'w');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary resize-handle"
                    style={{
                      width: '6px',
                      height: '12px',
                      top: '50%',
                      right: '-3px',
                      transform: 'translateY(-50%)',
                      cursor: 'e-resize',
                      zIndex: 15,
                      backgroundColor: '#28a745'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      console.log("East handle clicked for street:", street.id);
                      handleResizeStart(e, street, 'e');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary resize-handle"
                    style={{
                      width: '12px',
                      height: '6px',
                      top: '-3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 'n-resize',
                      zIndex: 15,
                      backgroundColor: '#dc3545'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      console.log("North handle clicked for street:", street.id);
                      handleResizeStart(e, street, 'n');
                    }}
                  />
                  <div
                    className="position-absolute bg-primary resize-handle"
                    style={{
                      width: '12px',
                      height: '6px',
                      bottom: '-3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 's-resize',
                      zIndex: 15,
                      backgroundColor: '#dc3545'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      console.log("South handle clicked for street:", street.id);
                      handleResizeStart(e, street, 's');
                    }}
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
