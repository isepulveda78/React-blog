// Working CityBuilder Component
const { useState, useEffect, useRef } = React;

const BUILDING_TYPES = {
  residential: {
    house: { name: "House", icon: "🏠", width: 60, height: 50, color: "#4ade80" },
    apartment: { name: "Apartment", icon: "🏢", width: 80, height: 100, color: "#4ade80" }
  },
  commercial: {
    shop: { name: "Shop", icon: "🏪", width: 70, height: 60, color: "#3b82f6" },
    restaurant: { name: "Restaurant", icon: "🍽️", width: 80, height: 70, color: "#3b82f6" }
  },
  industrial: {
    factory: { name: "Factory", icon: "🏭", width: 100, height: 80, color: "#f97316" },
    warehouse: { name: "Warehouse", icon: "📦", width: 90, height: 70, color: "#f97316" }
  },
  public: {
    school: { name: "School", icon: "🏫", width: 100, height: 80, color: "#ef4444" },
    hospital: { name: "Hospital", icon: "🏥", width: 110, height: 90, color: "#ef4444" }
  },
  nature: {
    park: { name: "Park", icon: "🌳", width: 80, height: 80, color: "#84cc16" },
    tree: { name: "Tree", icon: "🌳", width: 30, height: 30, color: "#84cc16" }
  }
};

const STREET_TYPES = {
  road: { name: "Road", icon: "🛣️", width: 20, height: 20, category: "infrastructure" },
  water: { name: "Water", icon: "💧", width: 40, height: 40, category: "infrastructure" }
};

const WorkingCityBuilder = () => {
  const [buildings, setBuildings] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#90EE90');
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelInput, setLabelInput] = useState('');
  const canvasRef = useRef(null);
  
  // Handle Delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStreet) {
          setStreets(prev => prev.filter(s => s.id !== selectedStreet.id));
          setSelectedStreet(null);
        } else if (selectedBuilding) {
          setBuildings(prev => prev.filter(b => b.id !== selectedBuilding.id));
          setSelectedBuilding(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStreet, selectedBuilding]);
  
  // Handle canvas drop
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    if (gridEnabled) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }
    
    const newItem = {
      id: Date.now() + Math.random(),
      type: dragData.type,
      x: x,
      y: y,
      width: dragData.itemData.width,
      height: dragData.itemData.height,
      name: dragData.itemData.name,
      customLabel: '',
      category: dragData.category
    };
    
    if (dragData.isBuilding) {
      setBuildings(prev => [...prev, newItem]);
    } else if (dragData.isStreet) {
      setStreets(prev => [...prev, newItem]);
    }
  };
  
  return React.createElement('div', { 
    className: 'd-flex', 
    style: { width: '100vw', height: '100vh' } 
  },
    // Sidebar
    React.createElement('div', {
      className: 'border-end',
      style: { 
        width: '280px', 
        minWidth: '280px',
        height: '100vh',
        overflowY: 'auto', 
        backgroundColor: '#f8f9fa',
        border: '2px solid #007bff'
      }
    },
      React.createElement('div', { style: { padding: '20px' } },
        React.createElement('h2', { style: { color: 'black', marginBottom: '20px' } }, '🏗️ CityBuilder'),
        
        // Building Categories
        ...Object.entries(BUILDING_TYPES).map(([categoryKey, category]) =>
          React.createElement('div', { key: categoryKey, style: { marginBottom: '20px' } },
            React.createElement('h3', { 
              style: { 
                color: 'black', 
                marginBottom: '10px', 
                textTransform: 'uppercase',
                fontSize: '14px',
                fontWeight: '600'
              }
            }, categoryKey),
            React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
              ...Object.entries(category).map(([type, building]) =>
                React.createElement('div', {
                  key: type,
                  style: {
                    width: '110px',
                    height: '70px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    padding: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  },
                  draggable: true,
                  onDragStart: (e) => {
                    const dragData = { 
                      type: type, 
                      category: categoryKey,
                      isBuilding: true,
                      itemData: building
                    };
                    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                  }
                },
                  React.createElement('div', { style: { fontSize: '24px', marginBottom: '2px' } }, building.icon),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '11px', 
                      color: '#000000', 
                      textAlign: 'center', 
                      lineHeight: '1.2',
                      fontWeight: '600',
                      marginTop: '3px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      padding: '1px 3px',
                      borderRadius: '3px'
                    }
                  }, building.name)
                )
              )
            )
          )
        ),
        
        // Infrastructure
        React.createElement('div', { style: { marginBottom: '20px' } },
          React.createElement('h3', { style: { color: 'black', marginBottom: '10px' } }, 'INFRASTRUCTURE'),
          React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            ...Object.entries(STREET_TYPES).map(([type, street]) =>
              React.createElement('div', {
                key: type,
                style: {
                  width: '110px',
                  height: '70px',
                  backgroundColor: 'white',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  padding: '4px'
                },
                draggable: true,
                onDragStart: (e) => {
                  const dragData = { 
                    type: type, 
                    category: street.category,
                    isBuilding: false,
                    isStreet: true,
                    itemData: street
                  };
                  e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                }
              },
                React.createElement('div', { style: { fontSize: '24px', marginBottom: '2px' } }, street.icon),
                React.createElement('div', { 
                  style: { 
                    fontSize: '11px', 
                    color: '#000000', 
                    textAlign: 'center', 
                    lineHeight: '1.2',
                    fontWeight: '600',
                    marginTop: '3px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '1px 3px',
                    borderRadius: '3px'
                  }
                }, street.name)
              )
            )
          )
        ),
        
        // Background Color Selector
        React.createElement('div', { style: { padding: '20px', borderTop: '1px solid #ccc' } },
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('h4', { 
              style: { fontSize: '12px', fontWeight: 'bold', color: 'black', marginBottom: '8px' }
            }, 'BACKGROUND COLOR'),
            
            // Preset Colors
            React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' } },
              ...[
                { name: 'Grass', color: '#90EE90' },
                { name: 'Desert', color: '#F4A460' },
                { name: 'Ocean', color: '#87CEEB' },
                { name: 'Snow', color: '#FFFAFA' },
                { name: 'Dark', color: '#2F4F4F' }
              ].map((bg) =>
                React.createElement('div', {
                  key: bg.name,
                  style: {
                    width: '45px',
                    height: '35px',
                    backgroundColor: bg.color,
                    border: backgroundColor === bg.color ? '3px solid #007bff' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    color: bg.color === '#FFFAFA' ? 'black' : 'white',
                    textShadow: bg.color === '#FFFAFA' ? 'none' : '0 1px 1px rgba(0,0,0,0.5)'
                  },
                  onClick: () => setBackgroundColor(bg.color),
                  title: bg.name
                }, bg.name.slice(0,4))
              )
            ),
            
            // Custom Color Picker
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              React.createElement('label', { 
                style: { fontSize: '10px', color: 'black', fontWeight: 'bold' }
              }, 'Custom:'),
              React.createElement('input', {
                type: 'color',
                value: backgroundColor,
                onChange: (e) => setBackgroundColor(e.target.value),
                style: {
                  width: '40px',
                  height: '30px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                },
                title: 'Choose custom background color'
              }),
              React.createElement('div', {
                style: {
                  fontSize: '9px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid #ddd'
                }
              }, backgroundColor)
            )
          ),
          
          // Tools
          React.createElement('button', {
            style: {
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            },
            onClick: () => {
              setBuildings([]);
              setStreets([]);
              setSelectedBuilding(null);
              setSelectedStreet(null);
            }
          }, 'Clear All'),
          
          React.createElement('button', {
            style: {
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              backgroundColor: gridEnabled ? '#28a745' : '#f8f9fa',
              color: gridEnabled ? 'white' : 'black',
              border: gridEnabled ? 'none' : '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            },
            onClick: () => setGridEnabled(!gridEnabled)
          }, `Grid: ${gridEnabled ? 'On' : 'Off'}`),
          
          React.createElement('div', {
            style: {
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '12px',
              color: '#0c5460'
            }
          }, 
            React.createElement('strong', {}, 'Controls:'),
            React.createElement('br'),
            '• Click to select items',
            React.createElement('br'),
            '• Drag items to move',
            React.createElement('br'),
            '• Double-click to add label',
            React.createElement('br'),
            '• Press Delete to remove selected'
          )
        )
      )
    ),
    
    // Canvas
    React.createElement('div', {
      ref: canvasRef,
      className: 'position-relative overflow-hidden',
      style: { 
        width: 'calc(100vw - 280px)',
        height: '100vh',
        backgroundColor: backgroundColor,
        cursor: 'default'
      },
      onDrop: handleCanvasDrop,
      onDragOver: (e) => e.preventDefault(),
      onClick: () => {
        setSelectedBuilding(null);
        setSelectedStreet(null);
      }
    },
      // Grid
      gridEnabled && React.createElement('div', {
        className: 'position-absolute w-100 h-100',
        style: {
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          pointerEvents: 'none'
        }
      }),
      
      // Streets
      ...streets.map((street) =>
        React.createElement('div', {
          key: street.id,
          className: `position-absolute ${selectedStreet?.id === street.id ? 'border border-info border-3' : ''}`,
          style: {
            left: `${street.x}px`,
            top: `${street.y}px`,
            width: `${street.width}px`,
            height: `${street.height}px`,
            backgroundColor: street.type === 'water' ? '#007bff' : '#000000',
            cursor: 'pointer'
          },
          onClick: (e) => {
            e.stopPropagation();
            setSelectedStreet(street);
            setSelectedBuilding(null);
          }
        })
      ),
      
      // Buildings
      ...buildings.map((building) =>
        React.createElement('div', { key: building.id },
          React.createElement('div', {
            className: `position-absolute d-flex align-items-center justify-content-center ${selectedBuilding?.id === building.id ? 'border border-info border-3' : ''}`,
            style: {
              left: `${building.x}px`,
              top: `${building.y}px`,
              width: `${building.width}px`,
              height: `${building.height}px`,
              backgroundColor: BUILDING_TYPES[building.category]?.[building.type]?.color || '#gray',
              cursor: 'pointer',
              fontSize: '2rem'
            },
            onClick: (e) => {
              e.stopPropagation();
              setSelectedBuilding(building);
              setSelectedStreet(null);
            },
            onDoubleClick: (e) => {
              e.stopPropagation();
              setEditingLabel(building.id);
              setLabelInput(building.customLabel || building.name);
            }
          },
            BUILDING_TYPES[building.category]?.[building.type]?.icon,
            
            // Custom Label Display
            (building.customLabel || selectedBuilding?.id === building.id) && editingLabel !== building.id && 
            React.createElement('div', {
              style: {
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#000',
                border: '1px solid #ccc',
                whiteSpace: 'nowrap',
                minWidth: '60px',
                textAlign: 'center'
              }
            }, building.customLabel || building.name),
            
            // Label Input for Editing
            editingLabel === building.id && React.createElement('input', {
              autoFocus: true,
              type: 'text',
              value: labelInput,
              onChange: (e) => setLabelInput(e.target.value),
              onBlur: () => {
                setBuildings(prev => prev.map(b => 
                  b.id === building.id ? { ...b, customLabel: labelInput } : b
                ));
                setEditingLabel(null);
                setLabelInput('');
              },
              onKeyDown: (e) => {
                if (e.key === 'Enter') {
                  setBuildings(prev => prev.map(b => 
                    b.id === building.id ? { ...b, customLabel: labelInput } : b
                  ));
                  setEditingLabel(null);
                  setLabelInput('');
                } else if (e.key === 'Escape') {
                  setEditingLabel(null);
                  setLabelInput('');
                }
              },
              style: {
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#000',
                border: '2px solid #007bff',
                minWidth: '80px',
                textAlign: 'center'
              },
              onClick: (e) => e.stopPropagation()
            })
          )
        )
      )
    )
  );
};

// Export for global use
window.WorkingCityBuilder = WorkingCityBuilder;
console.log("WORKING: CityBuilder exported to window:", !!window.WorkingCityBuilder);