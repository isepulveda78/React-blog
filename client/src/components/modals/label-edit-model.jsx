const { React, useState, useEffect } = window;
const { BUILDING_TYPES } = window;

const LabelEditModal = ({
  isOpen,
  onClose,
  building,
  onSaveLabel
}) => {
  const [labelInput, setLabelInput] = useState('');

  useEffect(() => {
    if (building) {
      setLabelInput(building.label || '');
    }
  }, [building]);

  if (!isOpen || !building) return null;

  const buildingData = BUILDING_TYPES[building.type];

  const handleSave = () => {
    onSaveLabel(building.id, labelInput);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Building Label</h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 ${building.color} rounded-lg flex items-center justify-center mr-3`}>
                <i className={`${building.icon} text-white`}></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{buildingData.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{building.category}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Building Name</label>
            <input
              type="text"
              placeholder="Enter a name for this building..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">This label will be displayed on the canvas and in PDF exports</p>
          </div>

          <div className="flex space-x-3">
            <button
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
              onClick={handleSave}
            >
              Save Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export to window for global access
window.LabelEditModal = LabelEditModal;
