// Building types and categories for the city builder
const BUILDING_CATEGORIES = {
  residential: { name: "Residential", icon: "🏠", color: "#10b981" },
  commercial: { name: "Commercial", icon: "🏪", color: "#3b82f6" },
  industrial: { name: "Industrial", icon: "🏭", color: "#f59e0b" },
  public: { name: "Public", icon: "🏛️", color: "#8b5cf6" },
  nature: { name: "Nature", icon: "🌳", color: "#22c55e" }
};

const BUILDING_TYPES = {
  house: { category: "residential", name: "House", icon: "🏠", width: 60, height: 60 },
  apartment: { category: "residential", name: "Apartment", icon: "🏢", width: 80, height: 120 },
  villa: { category: "residential", name: "Villa", icon: "🏡", width: 100, height: 80 },
  shop: { category: "commercial", name: "Shop", icon: "🏪", width: 50, height: 50 },
  office: { category: "commercial", name: "Office", icon: "🏢", width: 80, height: 100 },
  factory: { category: "industrial", name: "Factory", icon: "🏭", width: 100, height: 80 },
  warehouse: { category: "industrial", name: "Warehouse", icon: "🏢", width: 120, height: 60 },
  hospital: { category: "public", name: "Hospital", icon: "🏥", width: 90, height: 80 },
  "fire-station": { category: "public", name: "Fire Station", icon: "🚒", width: 70, height: 60 },
  "police-station": { category: "public", name: "Police Station", icon: "🚓", width: 70, height: 60 },
  school: { category: "public", name: "School", icon: "🏫", width: 100, height: 70 },
  "college-campus": { category: "public", name: "University", icon: "🏛️", width: 140, height: 120 },
  "hair-salon": { category: "public", name: "Hair Salon", icon: "💇", width: 50, height: 50 },
  grass: { category: "nature", name: "Grass", icon: "🟩", width: 100, height: 100 },
  tree: { category: "nature", name: "Tree", icon: "🌳", width: 30, height: 30 },
  park: { category: "nature", name: "Park", icon: "🌿", width: 60, height: 60 },
  "grass-patch": { category: "nature", name: "Grass Patch", icon: "🌿", width: 40, height: 40 }
};

// Grid size constant
const GRID_SIZE = 20;

// Export to window for global access
window.BUILDING_CATEGORIES = BUILDING_CATEGORIES;
window.BUILDING_TYPES = BUILDING_TYPES;
window.GRID_SIZE = GRID_SIZE;