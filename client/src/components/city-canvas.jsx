import React, { useRef, useEffect, forwardRef } from 'react';

const GRID_SIZE = 20;

const CityCanvas = forwardRef(function CityCanvas({
  buildings,
  streets,
  selectedBuilding,
  selectedStreet,
  onSelectBuilding,
  onStreetClick,
  onResizeStart,
  onAddBuilding,
  onAddStreet,
  startStreetDrawing,
  updateStreetDrawing,
  finishStreetDrawing,
  isDrawingStreet,
  streetStartPoint,
  streetEndPoint,
  draggedStreetType,
  isDragging,
  draggedBuildingType,
  setIsDragging,
  zoomLevel,
  gridEnabled,
  backgroundColor,
  onZoomIn,
  onZoomOut,

  getCityStats,
  startDragItem,
  moveItem,
  draggedItem,
  setDraggedItem,
  dragOffset,
  canvasOffset,
  startPan,
  updatePan,
  endPan,
  isPanning,
  resetView
}, ref) {
  const canvasRef = ref || useRef(null);
  const dragPreviewRef = useRef(null);
  const stats = getCityStats();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const streetType = e.dataTransfer.getData('streetType');
    const buildingType = e.dataTransfer.getData('buildingType') || (!streetType ? e.dataTransfer.getData('text/plain') : null);

    console.log('Drop event triggered:', { buildingType, streetType });
    console.log('All data transfer types:', e.dataTransfer.types);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - (canvasOffset?.x || 0)) * (100 / zoomLevel);
    const y = (e.clientY - rect.top - (canvasOffset?.y || 0)) * (100 / zoomLevel);

    console.log('Drop coordinates calculated:', { x, y, rect, canvasOffset, zoomLevel });

    if (streetType) {
      // Handle streets and grass first
      console.log('Starting street drawing from drop:', { streetType, x, y });
      startStreetDrawing(streetType, x, y);
      // Don't reset isDragging here for streets - let the drawing finish first
      return;
    } else if (buildingType) {
      // Only handle as building if it's not a street type
      console.log('Trying to add building:', { buildingType, x, y });
      const building = onAddBuilding(buildingType, x, y);
      if (building) {
        console.log('Building added successfully:', building);
        onSelectBuilding(building);
      } else {
        console.log('Failed to add building - likely collision or invalid position');
      }
    }

    setIsDragging(false);
  };

  const handleCanvasMouseDown = (e) => {
    if (isDrawingStreet || isDragging || draggedItem) {
      return; // Don't start panning if we're in another mode
    }

    // Only start panning if clicking on empty canvas space (not on buildings/streets)
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startPan(x, y);
      e.preventDefault();
    }
  };

  const handleCanvasClick = (e) => {
    console.log('Canvas clicked, isDrawingStreet:', isDrawingStreet);

    if (isDrawingStreet) {
      // Finish street drawing on click
      console.log('Finishing street drawing from canvas click');
      finishStreetDrawing();
      return;
    }

    // Only clear selection if clicking empty space and not panning
    if (e.target === canvasRef.current && !isPanning) {
      onSelectBuilding(null);
    }
  };

  const handleBuildingClick = (e, building) => {
    e.stopPropagation();
    onSelectBuilding(building);
  };

  const handleStreetClick = (e, street) => {
    e.stopPropagation();
    if (onStreetClick) {
      onStreetClick(street);
    }
  };



  const handleBuildingMouseDown = (e, building) => {
    e.preventDefault();
    e.stopPropagation();
    if (startDragItem) {
      startDragItem(building, 'building', e);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleStreetMouseDown = (e, street) => {
    e.preventDefault();
    e.stopPropagation();
    if (startDragItem) {
      startDragItem(street, 'street', e);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && canvasRef.current) {
      // Update pan position
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePan(x, y);
    } else if (isDrawingStreet && canvasRef.current) {
      // Update street end point while drawing
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - (canvasOffset?.x || 0)) * (100 / zoomLevel);
      const y = (e.clientY - rect.top - (canvasOffset?.y || 0)) * (100 / zoomLevel);
      updateStreetDrawing(x, y);
    } else if (draggedItem && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (100 / zoomLevel) - dragOffset.x;
      const y = (e.clientY - rect.top) * (100 / zoomLevel) - dragOffset.y;

      // Update drag preview position with smooth transform
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.transform = `translate(${x}px, ${y}px)`;
        dragPreviewRef.current.style.opacity = '0.8';
      }
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      endPan();
    } else if (draggedItem && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (100 / zoomLevel) - dragOffset.x;
      const y = (e.clientY - rect.top) * (100 / zoomLevel) - dragOffset.y;

      moveItem(draggedItem.id, draggedItem.itemType, x, y);
      setDraggedItem(null);
      setIsDragging(false);

      // Reset cursor and text selection
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  };

  const gridStyle = gridEnabled ? {
    backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    backgroundPosition: '0 0'
  } : {};

  return (
    <main className="flex-fill d-flex flex-column">
      {/* Canvas Toolbar */}
      <div className="bg-white border-bottom px-3 py-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Zoom:</span>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={onZoomOut}
            >
              <i className="fas fa-minus" style={{ fontSize: '0.75rem' }}></i>
            </button>
            <span className="small fw-medium text-dark text-center" style={{ minWidth: '48px' }}>
              {zoomLevel}%
            </span>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={onZoomIn}
            >
              <i className="fas fa-plus" style={{ fontSize: '0.75rem' }}></i>
            </button>
          </div>

        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={resetView}
            title="Reset view to center"
          >
            <i className="fas fa-home" style={{ fontSize: '0.75rem' }}></i>
            <span className="d-none d-md-inline">Reset View</span>
          </button>
          <div className="vr mx-2"></div>
          <span className="small text-muted">Buildings:</span>
          <span className="small fw-medium text-dark">{stats.total}</span>
          <div className="vr mx-2"></div>
          <span className="small text-muted">Labeled:</span>
          <span className="small fw-medium text-dark">{stats.labeled}</span>
          <div className="vr mx-2"></div>
          <span className="small text-muted">
            <i className="fas fa-hand-rock me-1"></i>
            Drag to pan
          </span>
        </div>
      </div>

      {/* City Canvas Area */}
      <div className="flex-fill position-relative overflow-hidden" style={{ backgroundColor, ...gridStyle }}>
        <div
          ref={canvasRef}
          className="w-100 h-100 position-relative"
          style={{
            transform: `translate(${canvasOffset?.x || 0}px, ${canvasOffset?.y || 0}px) scale(${zoomLevel / 100})`,
            transformOrigin: 'top left',
            cursor: isPanning ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
            minWidth: '2000px',
            minHeight: '2000px'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Placed Streets and Grass */}
          {streets && streets.map(street => (
            <div key={street.id} className="position-relative">
              <div
                className={`position-absolute ${
                  selectedStreet && selectedStreet.id === street.id 
                    ? 'border border-primary border-2' 
                    : ''
                }`}
                style={{
                  left: street.x,
                  top: street.y,
                  width: street.width,
                  height: street.height,
                  backgroundColor: street.color,
                  borderRadius: '2px',
                  zIndex: selectedStreet && selectedStreet.id === street.id ? 15 : 3,
                  cursor: 'grab',
                  transition: 'all 0.1s ease'
                }}
                onClick={(e) => handleStreetClick(e, street)}
                onMouseDown={(e) => handleStreetMouseDown(e, street)}
                onMouseEnter={(e) => {
                  if (!draggedItem) {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!draggedItem) {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              />

              {/* Resize handles for selected streets and grass */}
              {selectedStreet && selectedStreet.id === street.id && (
                <>
                  {/* Southeast corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: street.x + street.width - 4,
                      top: street.y + street.height - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'se-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, street, 'se')}
                  />

                  {/* Southwest corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: street.x - 4,
                      top: street.y + street.height - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'sw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, street, 'sw')}
                  />

                  {/* Northeast corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: street.x + street.width - 4,
                      top: street.y - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'ne-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, street, 'ne')}
                  />

                  {/* Northwest corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: street.x - 4,
                      top: street.y - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'nw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, street, 'nw')}
                  />
                </>
              )}
            </div>
          ))}

          {/* Placed Buildings */}
          {buildings.map(building => (
            <div
              key={building.id}
              className={`position-absolute building-placed ${
                selectedBuilding && selectedBuilding.id === building.id 
                  ? 'border border-primary border-3' 
                  : ''
              }`}
              style={{
                left: building.x,
                top: building.y,
                width: building.width,
                height: building.height,
                cursor: 'grab',
                transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                zIndex: selectedBuilding && selectedBuilding.id === building.id ? 20 : (building.type === 'grass-patch' ? 1 : 8)
              }}
              onClick={(e) => handleBuildingClick(e, building)}
              onMouseDown={(e) => handleBuildingMouseDown(e, building)}
            >
              <div 
                className={`w-100 h-100 rounded shadow d-flex align-items-center justify-content-center border border-2 ${
                  building.isLabelOnly ? 'border-dashed' : 'border-transparent'
                }`}
                style={{
                  backgroundColor: building.isLabelOnly ? 
                    (building.customColor ? `${building.customColor}20` : 'rgba(107, 114, 128, 0.1)') : 
                    building.customColor || (building.color === 'bg-residential' ? '#34d399' : building.color === 'bg-commercial' ? '#fbbf24' : building.color === 'bg-public' ? '#a78bfa' : '#22c55e'),
                  borderColor: building.isLabelOnly && building.customColor ? building.customColor : undefined,
                  transition: 'box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!draggedItem) {
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!draggedItem) {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {/* Only show icon for non-grass buildings */}
                {building.type !== 'grass-patch' && (
                  <i className={`${building.icon} ${building.isLabelOnly ? (building.customColor ? '' : 'text-secondary') : 'text-white'}`} 
                     style={{ 
                       fontSize: '1.5rem',
                       color: building.isLabelOnly && building.customColor ? building.customColor : undefined
                     }}></i>
                )}
              </div>

              {/* Building Label */}
              {building.label && building.label.trim() && (
                <div 
                  className="position-absolute bg-white px-2 py-1 rounded shadow-sm border small fw-medium text-dark text-nowrap"
                  style={{
                    bottom: '-32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  }}
                >
                  {building.label}
                </div>
              )}

              {/* Unlabeled Building Indicator - only for non-grass buildings */}
              {building.type !== 'grass-patch' && (!building.label || !building.label.trim()) && (
                <div 
                  className="position-absolute bg-warning rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    zIndex: 10
                  }}
                >
                  <i className="fas fa-exclamation text-white" style={{ fontSize: '0.75rem' }}></i>
                </div>
              )}

              {/* Resize handles for grass patches when selected */}
              {building.type === 'grass-patch' && selectedBuilding && selectedBuilding.id === building.id && (
                <>
                  {/* Southeast corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: building.width - 4,
                      top: building.height - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'se-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, building, 'se')}
                  />

                  {/* Southwest corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: -4,
                      top: building.height - 4,
                      width: '8px',
                      height: '8px',
                      cursor: 'sw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, building, 'sw')}
                  />

                  {/* Northeast corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: building.width - 4,
                      top: -4,
                      width: '8px',
                      height: '8px',
                      cursor: 'ne-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, building, 'ne')}
                  />

                  {/* Northwest corner resize handle */}
                  <div
                    className="position-absolute bg-primary border border-white rounded-circle"
                    style={{
                      left: -4,
                      top: -4,
                      width: '8px',
                      height: '8px',
                      cursor: 'nw-resize',
                      zIndex: 20
                    }}
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, building, 'nw')}
                  />
                </>
              )}
            </div>
          ))}

          {/* Street Drawing Preview */}
          {isDrawingStreet && streetStartPoint && streetEndPoint && (
            <div>
              {(() => {
                const deltaX = Math.abs(streetEndPoint.x - streetStartPoint.x);
                const deltaY = Math.abs(streetEndPoint.y - streetStartPoint.y);
                const isHorizontal = deltaX >= deltaY;

                let streetX, streetY, streetWidth, streetHeight;

                if (isHorizontal) {
                  streetX = Math.min(streetStartPoint.x, streetEndPoint.x);
                  streetY = streetStartPoint.y;
                  streetWidth = deltaX + GRID_SIZE;
                  streetHeight = GRID_SIZE;
                } else {
                  streetX = streetStartPoint.x;
                  streetY = Math.min(streetStartPoint.y, streetEndPoint.y);
                  streetWidth = GRID_SIZE;
                  streetHeight = deltaY + GRID_SIZE;
                }

                return (
                  <div
                    className="position-absolute border border-2 border-dashed"
                    style={{
                      left: streetX,
                      top: streetY,
                      width: streetWidth,
                      height: streetHeight,
                      backgroundColor: 'rgba(108, 117, 125, 0.5)',
                      borderColor: '#6c757d',
                      zIndex: 5,
                      pointerEvents: 'none'
                    }}
                  />
                );
              })()}
            </div>
          )}

          {/* Drop Zone Indicator */}
          {isDragging && !isDrawingStreet && (
            <div 
              className="position-absolute border border-2 border-dashed border-primary rounded"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(var(--bs-primary-rgb), 0.1)',
                pointerEvents: 'none'
              }}
            >
              <div className="position-absolute top-50 start-50 translate-middle">
                <div className="bg-white px-3 py-2 rounded shadow">
                  <span className="text-primary fw-medium">
                    {draggedStreetType ? 'Click and drag to draw street' : 'Drop building here'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drag Preview */}
          {draggedItem && (
            <div
              ref={dragPreviewRef}
              className="position-absolute pointer-events-none"
              style={{
                width: draggedItem.width,
                height: draggedItem.height,
                zIndex: 1000,
                opacity: 0.7,
                transform: 'translate(0px, 0px)',
                transition: 'none',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
            >
              {draggedItem.itemType === 'building' ? (
                <div 
                  className="w-100 h-100 rounded border border-2 border-primary d-flex align-items-center justify-content-center"
                  style={{ 
                    backgroundColor: draggedItem.customColor || (draggedItem.color === 'bg-residential' ? '#34d399' : draggedItem.color === 'bg-commercial' ? '#fbbf24' : draggedItem.color === 'bg-public' ? '#a78bfa' : '#22c55e'),
                    filter: 'brightness(1.2)',
                    animation: 'pulse 1s infinite'
                  }}
                >
                  <i className={`${draggedItem.icon} text-white`} style={{ fontSize: '1.5rem' }}></i>
                </div>
              ) : (
                <div
                  className="w-100 h-100 border border-2 border-primary rounded"
                  style={{
                    backgroundColor: draggedItem.color,
                    filter: 'brightness(1.2)',
                    animation: 'pulse 1s infinite'
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
});

export default CityCanvas;
