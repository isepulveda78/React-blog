const { React } = window;

// Mock building data for now
const BUILDING_CATEGORIES = {
  residential: { name: "Residential", icon: "🏠", color: "#10b981" },
  commercial: { name: "Commercial", icon: "🏢", color: "#3b82f6" },
  industrial: { name: "Industrial", icon: "🏭", color: "#f59e0b" },
  nature: { name: "Nature", icon: "🌳", color: "#22c55e" }
};

const BUILDING_TYPES = {
  house: { category: "residential", name: "House", icon: "🏠", width: 40, height: 40 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 60, height: 80 },
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 }
};

const STREET_CATEGORIES = {
  roads: { name: "Roads", icon: "🛣️", color: "#6b7280" }
};

const STREET_TYPES = {
  road: { category: "roads", name: "Road", icon: "🛣️", width: 20, height: 20 }
};

const BuildingPalette = ({
  onBuildingDragStart,
  onStreetDragStart,
  onClearCanvas,
  gridEnabled,
  onToggleGrid,
  backgroundColor,
  onBackgroundColorChange,
}) {
  const handleDragStart = (e, buildingType) => {
    console.log("Drag started for building:", buildingType);
    const buildingData = BUILDING_TYPES[buildingType];
    const dragData = { 
      type: buildingType, 
      category: buildingData.category,
      isBuilding: true,
      itemData: buildingData
    };
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "copy";
    e.currentTarget.style.opacity = "0.5";
    onBuildingDragStart && onBuildingDragStart(buildingType);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  const handleStreetDragStart = (e, streetType) => {
    console.log("Drag started for street:", streetType);
    const streetData = STREET_TYPES[streetType];
    const dragData = { 
      type: streetType, 
      category: streetData.category,
      isStreet: true,
      itemData: streetData
    };
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "copy";
    e.currentTarget.style.opacity = "0.5";
    onStreetDragStart && onStreetDragStart(streetType);
  };

  const handleStreetDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <aside
      className="bg-white shadow border-end d-flex flex-column"
      style={{ width: "320px", maxHeight: "100vh" }}
    >
      <div className="p-3 border-bottom flex-fill overflow-auto">
        <h2 className="h5 fw-semibold text-dark mb-3">Building Palette</h2>

        {Object.entries(BUILDING_CATEGORIES).map(([categoryId, category]) => (
          <div key={categoryId} className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <div
                className="rounded-circle me-2"
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor:
                    category.color === "residential"
                      ? "#34d399"
                      : category.color === "commercial"
                        ? "#fbbf24"
                        : category.color === "public"
                          ? "#a78bfa"
                          : category.color === "tools"
                            ? "#6b7280"
                            : "#22c55e",
                }}
              ></div>
              <h3 className="h6 fw-medium text-dark mb-0">{category.name}</h3>
            </div>
            <div className="row g-2">
              {category.buildings.map((buildingId) => {
                const building = BUILDING_TYPES[buildingId];
                if (!building) {
                  console.error(`Building type not found: ${buildingId}`);
                  return null;
                }
                return (
                  <div key={buildingId} className="col-6">
                    <div
                      className="building-item border border-2 border-dashed rounded-3 p-2 cursor-grab text-center"
                      style={{
                        borderColor:
                          category.color === "residential"
                            ? "#34d399"
                            : category.color === "commercial"
                              ? "#fbbf24"
                              : category.color === "public"
                                ? "#a78bfa"
                                : category.color === "tools"
                                  ? "#6b7280"
                                  : "#22c55e",
                        borderOpacity: "0.3",
                        transition: "all 0.2s ease",
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, buildingId)}
                      onDragEnd={handleDragEnd}
                    >
                      <i
                        className={`${building.icon} mb-1 d-block`}
                        style={{
                          fontSize: "1.5rem",
                          color:
                            category.color === "residential"
                              ? "#34d399"
                              : category.color === "commercial"
                                ? "#fbbf24"
                                : category.color === "public"
                                  ? "#a78bfa"
                                  : category.color === "tools"
                                    ? "#6b7280"
                                    : "#22c55e",
                        }}
                      ></i>
                      <p
                        className="small fw-medium text-dark mb-0"
                        style={{ fontSize: "0.65rem", lineHeight: "1.1" }}
                      >
                        {building.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Street Categories */}
        {Object.entries(STREET_CATEGORIES).map(([categoryId, category]) => (
          <div key={categoryId} className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <div
                className={`rounded-circle me-2 ${category.color === "success" ? "bg-success" : "bg-secondary"}`}
                style={{ width: "16px", height: "16px" }}
              ></div>
              <h3 className="h6 fw-medium text-dark mb-0">{category.name}</h3>
            </div>
            <div className="row g-2">
              {category.items.map((streetId) => {
                const street = STREET_TYPES[streetId];
                if (!street) {
                  console.error(`Street type not found: ${streetId}`);
                  return null;
                }
                return (
                  <div key={streetId} className="col-6">
                    <div
                      className={`building-item border border-2 border-dashed rounded-3 p-2 cursor-grab text-center ${
                        category.color === "success"
                          ? "border-success"
                          : "border-secondary"
                      }`}
                      style={{
                        borderColor:
                          category.color === "success" ? "#22c55e" : "#6c757d",
                        borderOpacity: "0.3",
                        transition: "all 0.2s ease",
                      }}
                      draggable
                      onDragStart={(e) => handleStreetDragStart(e, streetId)}
                      onDragEnd={handleStreetDragEnd}
                    >
                      <i
                        className={`${street.icon} mb-1 d-block`}
                        style={{
                          fontSize: "1.5rem",
                          color:
                            category.color === "success"
                              ? "#22c55e"
                              : "#6c757d",
                        }}
                      ></i>
                      <p
                        className="small fw-medium text-dark mb-0"
                        style={{ fontSize: "0.65rem", lineHeight: "1.1" }}
                      >
                        {street.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas Tools */}
      <div className="p-3 border-top flex-shrink-0">
        <h3 className="h6 fw-medium text-dark mb-3">Canvas Tools</h3>
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
            <i className="fas fa-mouse-pointer"></i>
            <span>Select</span>
          </button>
          <button
            className="btn btn-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            onClick={onClearCanvas}
          >
            <i className="fas fa-trash"></i>
            <span>Clear</span>
          </button>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="small text-muted mb-0">Grid:</label>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={onToggleGrid}
          >
            <i className="fas fa-th"></i>
            <span>{gridEnabled ? "On" : "Off"}</span>
          </button>
        </div>

        {/* Background Color Selector */}
        <div className="mt-3 pt-3 border-top">
          <h4 className="small fw-medium text-dark mb-2">Canvas Background</h4>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted" style={{ minWidth: "48px" }}>
                Color:
              </label>
              <input
                type="color"
                value={backgroundColor || "#f3f4f6"}
                onChange={(e) => {
                  console.log("Color changed to:", e.target.value);
                  onBackgroundColorChange(e.target.value);
                }}
                className="form-control form-control-sm border rounded"
                style={{ width: "32px", height: "32px", cursor: "pointer" }}
                title="Choose background color"
              />
              <small className="text-muted font-monospace">
                {backgroundColor}
              </small>
            </div>
            <div className="row g-1">
              {[
                "#f3f4f6", // Light gray
                "#ffffff", // White
                "#dbeafe", // Light blue
                "#dcfce7", // Light green
                "#fef3c7", // Light yellow
                "#fce7f3", // Light pink
                "#f3e8ff", // Light purple
                "#fed7d7", // Light red
              ].map((color) => (
                <div key={color} className="col-3">
                  <button
                    className={`btn btn-sm w-100 border border-2 ${backgroundColor === color ? "border-dark" : "border-light"}`}
                    style={{
                      backgroundColor: color,
                      height: "24px",
                      transition: "border-color 0.2s ease",
                    }}
                    onClick={() => {
                      console.log("Preset color clicked:", color);
                      onBackgroundColorChange(color);
                    }}
                    title={`Set background to ${color}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

window.BuildingPalette = BuildingPalette;
