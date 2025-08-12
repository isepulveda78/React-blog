import React from 'react';
import { useCityBuilder } from '../hooks/use-city-builder.js';
import BuildingPalette from '../components/building-palette.jsx';
import CityCanvas from '../components/city-canvas.jsx';
import BuildingPropertiesPanel from '../components/building-properties.jsx';

const CityBuilder = () => {
  const cityBuilderHook = useCityBuilder();
  
  const {
    // City state
    cityName,
    setCityName,
    buildings,
    streets,
    selectedBuilding,
    selectedStreet,
    
    // Canvas controls
    gridEnabled,
    backgroundColor,
    zoomLevel,
    canvasOffset,
    isDragging,
    draggedBuildingType,
    draggedStreetType,
    draggedItem,
    dragOffset,
    isDrawingStreet,
    streetStartPoint,
    streetEndPoint,
    isPanning,
    
    // Building operations
    addBuilding,
    updateBuilding,
    deleteBuilding,
    selectBuilding,
    duplicateBuilding,
    
    // Street operations
    addStreet,
    updateStreet,
    deleteStreet,
    selectStreet,
    
    // Canvas operations
    clearCanvas,
    toggleGrid,
    setBackgroundColor,
    getCityStats,
    startDragItem,
    moveItem,
    setDraggedItem,
    startStreetDrawing,
    updateStreetDrawing,
    finishStreetDrawing,
    
    // Zoom and pan
    zoomIn,
    zoomOut,
    startPan,
    updatePan,
    endPan,
    resetView,
    
    // Drag handling
    setIsDragging,
    onResizeStart,
    
    // Export
    exportToPNG
  } = cityBuilderHook;

  const handleBuildingDragStart = (e, buildingType) => {
    console.log('Building drag start:', buildingType);
    e.dataTransfer.setData('buildingType', buildingType);
    e.dataTransfer.setData('text/plain', buildingType);
    setIsDragging(true);
  };

  const handleStreetDragStart = (e, streetType) => {
    console.log('Street drag start:', streetType);
    e.dataTransfer.setData('streetType', streetType);
    setIsDragging(true);
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
          <BuildingPalette
            onBuildingDragStart={handleBuildingDragStart}
            onStreetDragStart={handleStreetDragStart}
            onClearCanvas={clearCanvas}
            gridEnabled={gridEnabled}
            onToggleGrid={toggleGrid}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
          />
        </div>

        {/* Canvas Area */}
        <div className="flex-grow-1 position-relative">
          <CityCanvas
            buildings={buildings}
            streets={streets}
            selectedBuilding={selectedBuilding}
            selectedStreet={selectedStreet}
            onSelectBuilding={selectBuilding}
            onStreetClick={selectStreet}
            onResizeStart={onResizeStart}
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

        {/* Properties Panel */}
        {selectedBuilding && (
          <div className="bg-white border-start" style={{ width: "320px", minWidth: "320px" }}>
            <BuildingPropertiesPanel
              selectedBuilding={selectedBuilding}
              onClose={() => selectBuilding(null)}
              onUpdateBuilding={updateBuilding}
              onDeleteBuilding={deleteBuilding}
              onDuplicateBuilding={duplicateBuilding}
              getCityStats={getCityStats}
              buildings={buildings}
              onSelectBuilding={selectBuilding}
            />
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