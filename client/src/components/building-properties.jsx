import React, { useState, useEffect } from 'react';

const BUILDING_TYPES = {
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 }
};

const BuildingPropertiesPanel = (props) => {
  const {
    selectedBuilding,
    onClose,
    onUpdateBuilding,
    onDeleteBuilding,
    getCityStats,
    buildings = []
  } = props;

  const [labelInput, setLabelInput] = useState(selectedBuilding?.label || '');
  const [customColor, setCustomColor] = useState(selectedBuilding?.customColor || '');

  useEffect(() => {
    setLabelInput(selectedBuilding?.label || '');
    setCustomColor(selectedBuilding?.customColor || '');
  }, [selectedBuilding?.id, selectedBuilding?.label, selectedBuilding?.customColor]);

  if (!selectedBuilding) {
    return null;
  }

  const buildingData = BUILDING_TYPES[selectedBuilding?.type];
  const stats = getCityStats();

  const handleSaveLabel = () => {
    if (selectedBuilding) {
      onUpdateBuilding(selectedBuilding.id, { label: labelInput });
    }
  };

  const handleDelete = () => {
    if (selectedBuilding && confirm('Are you sure you want to delete this building?')) {
      onDeleteBuilding(selectedBuilding.id);
    }
  };

  const handleColorChange = (color) => {
    setCustomColor(color);
    if (selectedBuilding) {
      onUpdateBuilding(selectedBuilding.id, { customColor: color });
    }
  };

  return (
    <aside className="bg-white border-start h-100 d-flex flex-column" style={{ width: "320px", minWidth: "320px" }}>
      <div className="p-3 border-bottom bg-light">
        <div className="d-flex align-items-center justify-content-between">
          <h2 className="h5 fw-bold text-dark mb-0">Building Properties</h2>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="flex-fill overflow-auto">
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center mb-3">
            <div 
              className="rounded d-flex align-items-center justify-content-center me-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: customColor || "#f8f9fa",
                border: "2px solid #dee2e6",
                fontSize: "1.5rem"
              }}
            >
              {buildingData?.icon || '🏢'}
            </div>
            <div>
              <h3 className="fw-medium text-dark mb-1">{buildingData?.name || 'Unknown Building'}</h3>
              <p className="small text-muted mb-0 text-capitalize">{selectedBuilding.category} Building</p>
            </div>
          </div>
          <div className="row g-2 small">
            <div className="col-6">
              <span className="text-muted">Size:</span>
              <span className="fw-medium text-dark ms-1">
                {selectedBuilding.width}×{selectedBuilding.height}
              </span>
            </div>
            <div className="col-6">
              <span className="text-muted">Position:</span>
              <span className="fw-medium text-dark ms-1">
                {Math.round(selectedBuilding.x)}, {Math.round(selectedBuilding.y)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 border-bottom">
          <label className="form-label small text-muted">Building Label</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Enter custom label..."
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
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
        </div>

        <div className="p-3 border-bottom">
          <label className="form-label small text-muted">Building Color</label>
          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text">Custom</span>
            <input
              type="color"
              className="form-control form-control-color"
              value={customColor || '#3b82f6'}
              onChange={(e) => handleColorChange(e.target.value)}
            />
          </div>
        </div>

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

        <div className="p-3">
          <h3 className="h6 fw-medium text-dark mb-3">City Statistics</h3>
          <div className="small">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Buildings:</span>
              <span className="fw-medium text-dark">{stats.totalBuildings}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Residential:</span>
              <span className="fw-medium text-success">{stats.residential}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Commercial:</span>
              <span className="fw-medium text-warning">{stats.commercial}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Nature:</span>
              <span className="fw-medium text-success">{stats.nature}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default BuildingPropertiesPanel;