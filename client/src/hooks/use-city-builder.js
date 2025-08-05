const { React } = window;
const { useState, useCallback, useRef } = React;

// Mock data constants
const GRID_SIZE = 20;
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
  university: { category: "public", name: "University", icon: "🏫", width: 140, height: 120 },
  "hair-salon": { category: "public", name: "Hair Salon", icon: "💇", width: 50, height: 50 },
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 },
  park: { category: "nature", name: "Park", icon: "🌿", width: 60, height: 60 },
  "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
};
const STREET_TYPES = {
  road: { category: "roads", name: "Road", icon: "🛣️", width: 20, height: 20 }
};

const useCityBuilder = () => {
  const [cityName, setCityName] = useState("My Amazing City");
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null); // Store copied building or street
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBuildingType, setDraggedBuildingType] = useState(null);
  const [draggedStreetType, setDraggedStreetType] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawingStreet, setIsDrawingStreet] = useState(false);
  const [streetStartPoint, setStreetStartPoint] = useState(null);
  const [streetEndPoint, setStreetEndPoint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [backgroundColor, setBackgroundColor] = useState("#f3f4f6"); // Default gray-100
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPoint, setPanStartPoint] = useState(null);
  const [initialCanvasOffset, setInitialCanvasOffset] = useState({
    x: 0,
    y: 0,
  });
  const canvasRef = useRef(null);

  const snapToGrid = useCallback(
    (x, y) => {
      if (!gridEnabled) return { x, y };
      return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      };
    },
    [gridEnabled],
  );

  const checkCollision = useCallback(
    (newBuilding, existingBuildings = buildings) => {
      return existingBuildings.some((building) => {
        if (building.id === newBuilding.id) return false;

        // Allow trees to be placed on top of grass patches
        if (
          newBuilding.type === "oak-tree" &&
          building.type === "grass-patch"
        ) {
          return false;
        }

        // Allow grass patches to be placed under existing trees (when resizing grass)
        if (
          newBuilding.type === "grass-patch" &&
          building.type === "oak-tree"
        ) {
          return false;
        }

        // Allow any building to be placed on top of grass patches (grass acts as ground cover)
        if (building.type === "grass-patch") {
          return false;
        }

        // Allow labels to be placed anywhere (they can float on top of anything)
        if (newBuilding.isLabelOnly) {
          return false;
        }

        // Allow other items to be placed under labels (labels don't block placement)
        if (building.isLabelOnly) {
          return false;
        }

        return !(
          newBuilding.x >= building.x + building.width ||
          newBuilding.x + newBuilding.width <= building.x ||
          newBuilding.y >= building.y + building.height ||
          newBuilding.y + newBuilding.height <= building.y
        );
      });
    },
    [buildings],
  );

  const addBuilding = useCallback(
    (buildingType, x, y) => {
      const buildingData = BUILDING_TYPES[buildingType];
      if (!buildingData) return;

      const snappedPos = snapToGrid(x, y);

      // Handle label tool specially - create a label-only item
      if (buildingData.isLabel) {
        const newLabel = {
          id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: buildingType,
          category: buildingData.category,
          x: snappedPos.x,
          y: snappedPos.y,
          width: buildingData.width,
          height: buildingData.height,
          label: "Click to edit label",
          icon: buildingData.icon,
          color: "transparent",
          isLabelOnly: true,
        };

        setBuildings((prev) => [...prev, newLabel]);
        return newLabel;
      }

      const newBuilding = {
        id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: buildingType,
        category: buildingData.category,
        x: snappedPos.x,
        y: snappedPos.y,
        width: buildingData.width,
        height: buildingData.height,
        label: "",
        icon: buildingData.icon,
        color: buildingData.color,
      };

      if (!checkCollision(newBuilding)) {
        setBuildings((prev) => [...prev, newBuilding]);
        console.log(
          "Building added successfully:",
          newBuilding,
          "Total buildings:",
          buildings.length + 1,
        );
        return newBuilding;
      }
      console.log(
        "Building placement blocked by collision:",
        newBuilding,
        "Existing buildings:",
        buildings,
      );
      return null;
    },
    [snapToGrid, checkCollision],
  );

  const addStreet = useCallback(
    (streetType, x, y, width = null, height = null) => {
      const streetData = STREET_TYPES[streetType];
      if (!streetData) return;

      const snappedPos = snapToGrid(x, y);
      const newStreet = {
        id: `street-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: streetType,
        x: snappedPos.x,
        y: snappedPos.y,
        width: width || streetData.width,
        height: height || streetData.height,
        direction: streetData.direction,
        color: streetData.color,
      };

      setStreets((prev) => [...prev, newStreet]);
      return newStreet;
    },
    [snapToGrid],
  );

  const startStreetDrawing = useCallback(
    (streetType, x, y) => {
      const snappedPos = snapToGrid(x, y);
      console.log("Starting street drawing:", { streetType, snappedPos });
      console.log(
        "Current draggedStreetType before setting:",
        draggedStreetType,
      );
      setIsDrawingStreet(true);
      // Always use the street type from the parameter (from drag data)
      setDraggedStreetType(streetType);
      setStreetStartPoint(snappedPos);
      setStreetEndPoint(snappedPos);
    },
    [snapToGrid, draggedStreetType],
  );

  const updateStreetDrawing = useCallback(
    (x, y) => {
      if (!isDrawingStreet || !streetStartPoint) return;
      const snappedPos = snapToGrid(x, y);
      setStreetEndPoint(snappedPos);
    },
    [isDrawingStreet, streetStartPoint, snapToGrid],
  );

  const finishStreetDrawing = useCallback(() => {
    console.log("Finishing street drawing...", {
      isDrawingStreet,
      streetStartPoint,
      streetEndPoint,
      draggedStreetType,
    });

    // Use the current draggedStreetType from state, not from closure
    const currentStreetType = draggedStreetType;
    console.log("Current street type from state:", currentStreetType);

    if (
      !isDrawingStreet ||
      !streetStartPoint ||
      !streetEndPoint ||
      !currentStreetType
    ) {
      console.log("Invalid state for street creation, resetting...");
      setIsDrawingStreet(false);
      setStreetStartPoint(null);
      setStreetEndPoint(null);
      setDraggedStreetType(null);
      setIsDragging(false);
      return;
    }

    // Calculate street dimensions based on start and end points
    const deltaX = Math.abs(streetEndPoint.x - streetStartPoint.x);
    const deltaY = Math.abs(streetEndPoint.y - streetStartPoint.y);

    console.log("Street deltas:", { deltaX, deltaY });

    // Check if this is a grass patch (square) or regular street
    const streetData = STREET_TYPES[currentStreetType];
    let streetX, streetY, streetWidth, streetHeight;

    if (streetData && streetData.direction === "square") {
      // Square grass patch - use the larger dimension to create a square
      const maxDimension = Math.max(deltaX, deltaY, GRID_SIZE * 2); // Minimum 2x grid size
      streetX = Math.min(streetStartPoint.x, streetEndPoint.x);
      streetY = Math.min(streetStartPoint.y, streetEndPoint.y);
      streetWidth = maxDimension;
      streetHeight = maxDimension;
    } else {
      // Regular horizontal/vertical street logic
      const isHorizontal = deltaX >= deltaY;

      if (isHorizontal) {
        // Horizontal street
        streetX = Math.min(streetStartPoint.x, streetEndPoint.x);
        streetY = streetStartPoint.y;
        streetWidth = Math.max(deltaX, GRID_SIZE); // Ensure minimum width
        streetHeight = GRID_SIZE;
      } else {
        // Vertical street
        streetX = streetStartPoint.x;
        streetY = Math.min(streetStartPoint.y, streetEndPoint.y);
        streetWidth = GRID_SIZE;
        streetHeight = Math.max(deltaY, GRID_SIZE); // Ensure minimum height
      }
    }

    console.log("Calculated street dimensions:", {
      streetX,
      streetY,
      streetWidth,
      streetHeight,
      streetType: currentStreetType,
      isSquare: streetData && streetData.direction === "square",
    });

    // Create street with calculated dimensions
    const newStreet = addStreet(
      currentStreetType,
      streetX,
      streetY,
      streetWidth,
      streetHeight,
    );
    console.log("Created street:", newStreet);

    // Reset drawing state
    setIsDrawingStreet(false);
    setStreetStartPoint(null);
    setStreetEndPoint(null);
    setDraggedStreetType(null);
    setIsDragging(false); // Also reset dragging state
  }, [
    isDrawingStreet,
    streetStartPoint,
    streetEndPoint,
    draggedStreetType,
    addStreet,
    setIsDragging,
  ]);

  const updateBuilding = useCallback(
    (id, updates) => {
      setBuildings((prev) =>
        prev.map((building) =>
          building.id === id ? { ...building, ...updates } : building,
        ),
      );

      if (selectedBuilding && selectedBuilding.id === id) {
        setSelectedBuilding((prev) => ({ ...prev, ...updates }));
      }
    },
    [selectedBuilding],
  );

  const updateStreet = useCallback(
    (id, updates) => {
      setStreets((prev) =>
        prev.map((street) =>
          street.id === id ? { ...street, ...updates } : street,
        ),
      );

      if (selectedStreet && selectedStreet.id === id) {
        setSelectedStreet((prev) => ({ ...prev, ...updates }));
      }
    },
    [selectedStreet],
  );

  const deleteStreet = useCallback(
    (id) => {
      setStreets((prev) => prev.filter((street) => street.id !== id));
      if (selectedStreet && selectedStreet.id === id) {
        setSelectedStreet(null);
      }
    },
    [selectedStreet],
  );

  const deleteBuilding = useCallback(
    (id) => {
      setBuildings((prev) => prev.filter((building) => building.id !== id));
      if (selectedBuilding && selectedBuilding.id === id) {
        setSelectedBuilding(null);
      }
    },
    [selectedBuilding],
  );

  const selectBuilding = useCallback((building) => {
    setSelectedBuilding(building);
    setSelectedStreet(null);
  }, []);

  const selectStreet = useCallback((street) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBuilding(null);
    setSelectedStreet(null);
  }, []);

  const startDragItem = useCallback((item, itemType, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    setDraggedItem({ ...item, itemType });
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);

    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
  }, []);

  const moveItem = useCallback(
    (id, itemType, newX, newY) => {
      const snappedPos = snapToGrid(newX, newY);

      if (itemType === "building") {
        const buildingToMove = buildings.find((b) => b.id === id);
        if (buildingToMove) {
          const updatedBuilding = {
            ...buildingToMove,
            x: snappedPos.x,
            y: snappedPos.y,
          };
          if (!checkCollision(updatedBuilding)) {
            updateBuilding(id, { x: snappedPos.x, y: snappedPos.y });
            return true;
          }
        }
      } else if (itemType === "street") {
        updateStreet(id, { x: snappedPos.x, y: snappedPos.y });
        return true;
      }
      return false;
    },
    [snapToGrid, buildings, checkCollision, updateBuilding, updateStreet],
  );

  const clearCanvas = useCallback(() => {
    setBuildings([]);
    setStreets([]);
    setSelectedBuilding(null);
    setSelectedStreet(null);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(200, prev + 25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(25, prev - 25));
  }, []);

  const saveCity = useCallback(() => {
    const cityData = {
      name: cityName,
      buildings,
      streets,
      backgroundColor,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("cityBuilderData", JSON.stringify(cityData));
    return cityData;
  }, [cityName, buildings, streets, backgroundColor]);

  const loadCity = useCallback(() => {
    try {
      const savedData = localStorage.getItem("cityBuilderData");
      if (savedData) {
        const cityData = JSON.parse(savedData);
        setCityName(cityData.name || "My Amazing City");
        setBuildings(cityData.buildings || []);
        setStreets(cityData.streets || []);
        setBackgroundColor(cityData.backgroundColor || "#f3f4f6");
        setSelectedBuilding(null);
        setSelectedStreet(null);
        return cityData;
      }
    } catch (error) {
      console.error("Failed to load city data:", error);
    }
    return null;
  }, []);

  const getCityStats = useCallback(() => {
    const stats = {
      total: buildings.length,
      residential: buildings.filter((b) => b.category === "residential").length,
      commercial: buildings.filter((b) => b.category === "commercial").length,
      public: buildings.filter((b) => b.category === "public").length,
      labeled: buildings.filter((b) => b.label && b.label.trim()).length,
      unlabeled: buildings.filter((b) => !b.label || !b.label.trim()).length,
    };
    return stats;
  }, [buildings]);

  // Copy functionality
  const copyItem = useCallback(() => {
    if (selectedBuilding) {
      setCopiedItem({ ...selectedBuilding, itemType: "building" });
      return true;
    } else if (selectedStreet) {
      setCopiedItem({ ...selectedStreet, itemType: "street" });
      return true;
    }
    return false;
  }, [selectedBuilding, selectedStreet]);

  // Paste functionality
  const pasteItem = useCallback(
    (offsetX = 20, offsetY = 20) => {
      if (!copiedItem) return false;

      if (copiedItem.itemType === "building") {
        const newBuilding = addBuilding(
          copiedItem.type,
          copiedItem.x + offsetX,
          copiedItem.y + offsetY,
        );
        if (newBuilding) {
          // Copy over custom properties
          const updates = {};
          if (copiedItem.label) updates.label = copiedItem.label;
          if (copiedItem.customColor)
            updates.customColor = copiedItem.customColor;
          if (copiedItem.isLabelOnly !== undefined)
            updates.isLabelOnly = copiedItem.isLabelOnly;

          if (Object.keys(updates).length > 0) {
            updateBuilding(newBuilding.id, updates);
          }
          selectBuilding(newBuilding);
          return true;
        }
      } else if (copiedItem.itemType === "street") {
        const newStreet = addStreet(
          copiedItem.type,
          copiedItem.x + offsetX,
          copiedItem.y + offsetY,
          copiedItem.width,
          copiedItem.height,
        );
        if (newStreet) {
          selectStreet(newStreet);
          return true;
        }
      }
      return false;
    },
    [
      copiedItem,
      addBuilding,
      addStreet,
      updateBuilding,
      selectBuilding,
      selectStreet,
    ],
  );

  return {
    // State
    cityName,
    setCityName,
    buildings,
    streets,
    selectedBuilding,
    selectedStreet,
    isDragging,
    setIsDragging,
    draggedBuildingType,
    setDraggedBuildingType,
    draggedStreetType,
    setDraggedStreetType,
    isDrawingStreet,
    streetStartPoint,
    streetEndPoint,
    zoomLevel,
    gridEnabled,
    setGridEnabled,
    canvasOffset,
    setCanvasOffset,
    canvasRef,
    backgroundColor,
    setBackgroundColor,

    // Actions
    addBuilding,
    addStreet,
    startStreetDrawing,
    updateStreetDrawing,
    finishStreetDrawing,
    updateBuilding,
    updateStreet,
    deleteBuilding,
    deleteStreet,
    selectBuilding,
    selectStreet,
    clearSelection,
    clearCanvas,
    zoomIn,
    zoomOut,

    saveCity,
    loadCity,
    startDragItem,
    moveItem,

    // Drag State
    draggedItem,
    setDraggedItem,
    dragOffset,
    setDragOffset,

    // Pan functionality
    startPan: useCallback(
      (x, y) => {
        console.log("Starting pan at:", x, y);
        setIsPanning(true);
        setPanStartPoint({ x, y });
        setInitialCanvasOffset({ ...canvasOffset });
      },
      [canvasOffset],
    ),

    updatePan: useCallback(
      (x, y) => {
        if (!isPanning || !panStartPoint) return;

        const deltaX = x - panStartPoint.x;
        const deltaY = y - panStartPoint.y;

        setCanvasOffset({
          x: initialCanvasOffset.x + deltaX,
          y: initialCanvasOffset.y + deltaY,
        });
      },
      [isPanning, panStartPoint, initialCanvasOffset],
    ),

    endPan: useCallback(() => {
      console.log("Ending pan");
      setIsPanning(false);
      setPanStartPoint(null);
    }, []),

    resetView: useCallback(() => {
      setCanvasOffset({ x: 0, y: 0 });
      setZoomLevel(100);
    }, []),

    // Pan state
    isPanning,

    // Utilities
    snapToGrid,
    checkCollision,
    getCityStats,
    copyItem,
    pasteItem,
    copiedItem,
  };
};

window.useCityBuilder = useCityBuilder;
