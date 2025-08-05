import { useState, useEffect } from 'react';
import { STREET_TYPES } from '../lib/building-data';

export default function StreetPropertiesPanel({
  selectedStreet,
  onClose,
  onUpdateStreet,
  onDeleteStreet,
  streets = []
}) {
  const [customColor, setCustomColor] = useState(selectedStreet?.color || '');

  // Update color state when street changes
  useEffect(() => {
    setCustomColor(selectedStreet?.color || '');
  }, [selectedStreet?.id, selectedStreet?.color]);

  // Don't show panel if no street is selected
  if (!selectedStreet) {
    return null;
  }

  const streetData = STREET_TYPES[selectedStreet?.type];
  const isGrass = selectedStreet?.type === 'grass-patch';

  const handleColorChange = (color) => {
    setCustomColor(color);
    if (selectedStreet) {
      onUpdateStreet(selectedStreet.id, { color: color });
    }
  };

  const resetToDefaultColor = () => {
    const defaultColor = isGrass ? '#22c55e' : '#6b7280';
    setCustomColor(defaultColor);
    if (selectedStreet) {
      onUpdateStreet(selectedStreet.id, { color: defaultColor });
    }
  };

  const handleDelete = () => {
    if (selectedStreet && confirm(`Are you sure you want to delete this ${isGrass ? 'grass patch' : 'road'}?`)) {
      onDeleteStreet(selectedStreet.id);
    }
  };

  // Predefined color palette for roads and grass
  const roadColors = [
    '#6b7280', // Default gray
    '#374151', // Dark gray
    '#1f2937', // Very dark gray
    '#f3f4f6', // Light gray
    '#d1d5db', // Medium gray
    '#9ca3af', // Light gray
  ];

  const grassColors = [
    '#22c55e', // Default green
    '#16a34a', // Dark green
    '#15803d', // Darker green
    '#84cc16', // Lime green
    '#65a30d', // Olive green
    '#059669', // Emerald green
    '#047857', // Dark emerald
    '#10b981', // Teal green
    '#0d9488', // Dark teal
  ];

  const colorPalette = isGrass ? grassColors : roadColors;

  return (
    <div className="position-fixed bg-white shadow border" style={{
      top: '76px',
      right: '20px',
      width: '320px',
      maxHeight: 'calc(100vh - 96px)',
      zIndex: 1000,
      borderRadius: '8px'
    }}>
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <i className={`${streetData?.icon || 'fas fa-road'} text-secondary`}></i>
          <h3 className="h5 fw-semibold text-dark mb-0">
            {isGrass ? 'Grass Properties' : 'Road Properties'}
          </h3>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            console.log('Close button clicked, onClose function:', onClose);
            if (onClose) onClose();
          }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="p-3">
        {/* Street Info */}
        <div className="mb-3">
          <h4 className="h6 fw-medium text-dark mb-2">Details</h4>
          <div className="small text-muted">
            <div>Type: {streetData?.name || selectedStreet.type}</div>
            <div>Size: {selectedStreet.width} × {selectedStreet.height} px</div>
            <div>Position: ({selectedStreet.x}, {selectedStreet.y})</div>
          </div>
        </div>

        {/* Color Customization */}
        <div className="mb-3">
          <h4 className="h6 fw-medium text-dark mb-2">Color</h4>

          {/* Color Palette */}
          <div className="mb-3">
            <div className="row g-2">
              {colorPalette.map(color => (
                <div key={color} className="col-3">
                  <button
                    className={`w-100 border-2 rounded ${customColor === color ? 'border-primary' : 'border-secondary'}`}
                    style={{
                      backgroundColor: color,
                      height: '40px',
                      opacity: customColor === color ? 1 : 0.8
                    }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="mb-3">
            <label className="form-label small text-muted">Custom Color</label>
            <div className="d-flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="form-control form-control-color flex-fill"
                style={{ width: '60px', height: '38px' }}
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="form-control form-control-sm flex-fill"
                placeholder="#22c55e"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Reset to Default */}
          <button
            className="btn btn-sm btn-outline-secondary w-100"
            onClick={resetToDefaultColor}
          >
            Reset to Default Color
          </button>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 pt-2 border-top">
          <button
            className="btn btn-danger btn-sm flex-fill"
            onClick={handleDelete}
          >
            <i className="fas fa-trash me-1"></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}