const { React } = window;
const { useState } = React;

// Simple toast placeholder
const useToast = () => ({
  toast: (options) => {
    console.log('Toast:', options.title, options.description);
  }
});

const ExportModal = ({
  isOpen,
  onClose,
  cityName,
  buildings,
  streets,
  backgroundColor,
  getCityStats,
  canvasRef,
}) {
  const [imageQuality, setImageQuality] = useState("standard");
  const [includeLabels, setIncludeLabels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const stats = getCityStats();

  if (!isOpen) return null;

  const handleGenerateImage = async () => {
    setIsGenerating(true);

    try {
      if (imageQuality === "high") {
        await exportCityAsHighResImage(cityName, canvasRef, 12);
      } else {
        await exportCityAsImage(cityName, canvasRef);
      }

      toast({
        title: "Image Generated Successfully",
        description: `Your city layout has been exported as a PNG image.`,
      });

      onClose();
    } catch (error) {
      console.error("Failed to generate image:", error);
      console.error("Error details:", error.message, error.stack);
      toast({
        title: "Export Failed",
        description: `There was an error generating your image: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div
        className="bg-white rounded shadow"
        style={{ maxWidth: "500px", width: "90%" }}
      >
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="h5 fw-semibold text-dark mb-0">
              Export City as Image
            </h3>
            <button
              className="btn btn-sm btn-link text-muted p-0"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-3">
              <label className="form-label fw-medium text-dark">
                Image Quality
              </label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    type="radio"
                    name="imageQuality"
                    value="standard"
                    className="form-check-input"
                    checked={imageQuality === "standard"}
                    onChange={(e) => setImageQuality(e.target.value)}
                    id="standard"
                  />
                  <label className="form-check-label" htmlFor="standard">
                    Standard (8x resolution)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="radio"
                    name="imageQuality"
                    value="high"
                    className="form-check-input"
                    checked={imageQuality === "high"}
                    onChange={(e) => setImageQuality(e.target.value)}
                    id="high"
                  />
                  <label className="form-check-label" htmlFor="high">
                    High Quality (12x resolution)
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium text-dark">
                Export Options
              </label>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={includeLabels}
                    onChange={(e) => setIncludeLabels(e.target.checked)}
                    id="includeLabels"
                  />
                  <label className="form-check-label" htmlFor="includeLabels">
                    Include building labels in image
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-primary bg-opacity-10 rounded p-3">
              <div className="d-flex align-items-start">
                <i
                  className="fas fa-info-circle text-primary me-2"
                  style={{ marginTop: "2px" }}
                ></i>
                <div className="small text-primary">
                  <p className="fw-medium mb-1">Export Preview</p>
                  <p className="mb-0">
                    Your city will be exported as a JPEG image with{" "}
                    <span className="fw-medium">{stats.total} buildings</span>{" "}
                    and{" "}
                    <span className="fw-medium">{stats.labeled} labels</span>.
                    The image will show exactly what you see on the grid at much
                    higher resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button
              className="btn btn-secondary flex-fill"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-fill d-flex align-items-center justify-content-center"
              onClick={handleGenerateImage}
              disabled={isGenerating}
              style={{ opacity: isGenerating ? 0.6 : 1 }}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-download me-2"></i>
                  Generate Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ExportModal = ExportModal;
