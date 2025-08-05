import { useState, useEffect } from 'react';
import { BUILDING_TYPES } from '../lib/building-data';

export default function BuildingPropertiesPanel({
  selectedBuilding,
  onClose,
  onUpdateBuilding,
  onDeleteBuilding,
  onDuplicateBuilding,
  getCityStats,
  buildings = [],
  onSelectBuilding
}) {
  const currentBuilding = selectedBuilding || buildings[buildings.length - 1];
  const [labelInput, setLabelInput] = useState(currentBuilding?.label || '');
  const [showOnCanvas, setShowOnCanvas] = useState(true);
  const [includeInPDF, setIncludeInPDF] = useState(true);
  const [customColor, setCustomColor] = useState(currentBuilding?.customColor || '');

  // Update input states when building changes
  useEffect(() => {
    setLabelInput(currentBuilding?.label || '');
    setCustomColor(currentBuilding?.customColor || '');
  }, [currentBuilding?.id, currentBuilding?.label, currentBuilding?.customColor]);

  const stats = getCityStats();

  console.log('Building Properties Panel render:', { buildings: buildings.length, currentBuilding: !!currentBuilding });

  // Don't show panel if no building is selected
  if (!selectedBuilding) {
    return null;
  }
  const buildingData = BUILDING_TYPES[currentBuilding?.type];

  const handleSaveLabel = () => {
    if (currentBuilding) {
      onUpdateBuilding(currentBuilding.id, { label: labelInput });
    }
  };

  const handleLabelChange = (e) => {
    setLabelInput(e.target.value);
  };

  const handleDuplicate = () => {
    if (currentBuilding) {
      onDuplicateBuilding(currentBuilding);
    }
  };

  const handleDelete = () => {
    if (currentBuilding && confirm('Are you sure you want to delete this building?')) {
      onDeleteBuilding(currentBuilding.id);
    }
  };

  const handleColorChange = (color) => {
    setCustomColor(color);
    if (currentBuilding) {
      onUpdateBuilding(currentBuilding.id, { customColor: color });
    }
  };

  const resetToDefaultColor = () => {
    setCustomColor('');
    if (currentBuilding) {
      onUpdateBuilding(currentBuilding.id, { customColor: '' });
    }
  };

  // Predefined color palette
  const colorPalette = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280', // Gray
    '#1f2937', // Dark Gray
    '#059669'  // Emerald
  ];

  return (
    <aside 
      className="bg-white shadow d-flex flex-column" 
      style={{ 
        position: 'fixed',
        top: '76px',
        right: '0',
        width: '320px', 
        height: 'calc(100vh - 76px)',
        zIndex: 1000,
        borderLeft: '3px solid #007bff'
      }}
    >
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h5 fw-semibold text-dark mb-0">Building Properties</h2>
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={() => {
              console.log('Close button clicked, onClose function:', onClose);
              if (onClose) {
                onClose();
              }
            }}
            title="Close panel"
          >
            <i className="fas fa-times" style={{ fontSize: '0.875rem' }}></i>
          </button>
        </div>

        {/* Building Selector */}
        {buildings.length > 1 && (
          <div className="mb-3">
            <label className="form-label small text-muted">Select Building:</label>
            <select 
              className="form-select form-select-sm"
              value={currentBuilding?.id || ''}
              onChange={(e) => {
                const building = buildings.find(b => b.id === e.target.value);
                if (building && onSelectBuilding) {
                  onSelectBuilding(building);
                }
              }}
            >
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.label || BUILDING_TYPES[building.type]?.name || 'Unnamed Building'}
                </option>
              ))}
            </select>
          </div>
        )}

        {!currentBuilding && (
          <div className="text-center text-muted py-4">
            <i className="fas fa-mouse-pointer mb-2" style={{ fontSize: '2rem' }}></i>
            <p className="small mb-0">Click on a building to edit its properties</p>
          </div>
        )}
      </div>

      {currentBuilding && (
        <>
          {/* Selected Building Info */}
          <div className="p-3 border-bottom">
            <div className="bg-light rounded p-3 mb-3">
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="rounded d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: currentBuilding.customColor || (currentBuilding.color === 'bg-residential' ? '#34d399' : currentBuilding.color === 'bg-commercial' ? '#fbbf24' : currentBuilding.color === 'bg-public' ? '#a78bfa' : '#22c55e')
                  }}
                >
                  <i className={`${currentBuilding.icon} text-white`}></i>
                </div>
                <div>
                  <h3 className="fw-medium text-dark mb-1">{buildingData?.name || 'Unknown Building'}</h3>
                  <p className="small text-muted mb-0 text-capitalize">{currentBuilding.category} Building</p>
                </div>
              </div>
              <div className="row g-2 small">
                <div className="col-6">
                  <span className="text-muted">Size:</span>
                  <span className="fw-medium text-dark ms-1">
                    {currentBuilding.width}×{currentBuilding.height}
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-muted">Position:</span>
                  <span className="fw-medium text-dark ms-1">
                    {Math.round(currentBuilding.x)}, {Math.round(currentBuilding.y)}
                  </span>
                </div>
              </div>
            </div>

            {/* Building Label */}
            <div className="mb-3">
              <label className="form-label small text-muted">Building Label</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Enter custom label..."
                  value={labelInput}
                  onChange={handleLabelChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLabel();
                    }
                  }}
                />
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleSaveLabel}
                >
                  Save
                </button>
              </div>
              <small className="text-muted">This label will appear below the building</small>
            </div>

            {/* Color Customization */}
            <div className="mb-3">
              <label className="form-label small text-muted">Building Color</label>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    className={`btn p-0 rounded border ${customColor === color ? 'border-dark border-2' : 'border-light'}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color
                    }}
                    onClick={() => handleColorChange(color)}
                    title={`Color ${index + 1}`}
                  />
                ))}
              </div>
              <div className="input-group input-group-sm mb-2">
                <span className="input-group-text">Custom</span>
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={customColor || '#3b82f6'}
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={resetToDefaultColor}
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Building Actions */}
          <div className="p-3 border-bottom">
            <h3 className="h6 fw-medium text-dark mb-3">Actions</h3>
            <div className="d-grid gap-2">
              <button
                className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                onClick={handleDelete}
              >
                <i className="fas fa-trash"></i>
                <span>Delete Building</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* City Statistics */}
      <div className="flex-fill p-3">
        <h3 className="h6 fw-medium text-dark mb-3">City Statistics</h3>
        <div className="small">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Total Buildings:</span>
            <span className="fw-medium text-dark">{stats.total}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Labeled Buildings:</span>
            <span className="fw-medium text-dark">{stats.labeled}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Residential:</span>
            <span className="fw-medium text-success">{stats.residential}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Commercial:</span>
            <span className="fw-medium text-warning">{stats.commercial}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Public Services:</span>
            <span className="fw-medium text-primary">{stats.public}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Nature:</span>
            <span className="fw-medium text-success">{stats.nature}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}