import { useState, useEffect, useRef } from "react";
import { useCityBuilder } from "../hooks/use-city-builder";
import { useToast } from "@/hooks/use-toast.jsx";
import BuildingPalette from "../components/building-palette";
import CityCanvas from "../components/city-canvas";
import BuildingPropertiesPanel from "../components/building-properties";
import StreetPropertiesPanel from "../components/street-properties";

import ExportModal from "../components/modals/export-modal";
import { BUILDING_TYPES } from "../lib/building-data";

export default function CityBuilder() {
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

  const canvasRef = useRef(null);

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
    const buildingData = BUILDING_TYPES[building.type];
    if (buildingData) {
      // Offset the duplicate slightly
      const newBuilding = addBuilding(
        building.type,
        building.x + 20,
        building.y + 20,
      );
      if (newBuilding) {
        updateBuilding(newBuilding.id, { label: building.label });
        selectBuilding(newBuilding);
        toast({
          title: "Building Duplicated",
          description: "A copy of the building has been created.",
        });
      } else {
        toast({
          title: "Cannot Duplicate",
          description: "Not enough space to place the duplicate building.",
          variant: "destructive",
        });
      }
    }
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
        <BuildingPalette
          onBuildingDragStart={handleBuildingDragStart}
          onStreetDragStart={handleStreetDragStart}
          onClearCanvas={handleClearCanvas}
          gridEnabled={gridEnabled}
          onToggleGrid={() => setGridEnabled(!gridEnabled)}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={handleBackgroundColorChange}
        />

        {/* City Canvas */}
        <CityCanvas
          ref={canvasRef}
          buildings={buildings}
          streets={streets}
          selectedBuilding={selectedBuilding}
          selectedStreet={selectedStreet}
          onSelectBuilding={handleSelectBuilding}
          onStreetClick={handleSelectStreet}
          onResizeStart={handleResizeStart}
          onAddBuilding={addBuilding}
          onAddStreet={addStreet}
          startStreetDrawing={startStreetDrawing}
          updateStreetDrawing={updateStreetDrawing}
          finishStreetDrawing={finishStreetDrawing}
          isDrawingStreet={isDrawingStreet}
          streetStartPoint={streetStartPoint}
          streetEndPoint={streetEndPoint}
          draggedStreetType={draggedStreetType}
          isDragging={isDragging}
          draggedBuildingType={draggedBuildingType}
          setIsDragging={setIsDragging}
          zoomLevel={zoomLevel}
          gridEnabled={gridEnabled}
          backgroundColor={backgroundColor}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          getCityStats={getCityStats}
          startDragItem={startDragItem}
          moveItem={moveItem}
          draggedItem={draggedItem}
          setDraggedItem={setDraggedItem}
          dragOffset={dragOffset}
          canvasOffset={canvasOffset}
          startPan={startPan}
          updatePan={updatePan}
          endPan={endPan}
          isPanning={isPanning}
          resetView={resetView}
        />
      </div>

      {/* Building Properties Panel - Only show when a building is selected */}
      {selectedBuilding && (
        <BuildingPropertiesPanel
          selectedBuilding={selectedBuilding}
          onClose={() => {
            console.log("Calling clearSelection");
            clearSelection();
          }}
          onUpdateBuilding={updateBuilding}
          onDeleteBuilding={deleteBuilding}
          onDuplicateBuilding={handleDuplicateBuilding}
          getCityStats={getCityStats}
          buildings={buildings}
          onSelectBuilding={selectBuilding}
        />
      )}

      {/* Street Properties Panel - Only show when a street is selected */}
      {selectedStreet && (
        <StreetPropertiesPanel
          selectedStreet={selectedStreet}
          onClose={() => {
            console.log("Calling clearSelection for street");
            clearSelection();
          }}
          onUpdateStreet={updateStreet}
          onDeleteStreet={deleteStreet}
          streets={streets}
        />
      )}

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        cityName={cityName}
        buildings={buildings}
        streets={streets}
        backgroundColor={backgroundColor}
        getCityStats={getCityStats}
        canvasRef={canvasRef}
      />
    </div>
  );
}
