import html2canvas from 'html2canvas';

const calculateContentBounds = (canvasElement) => {
  // Find all buildings and streets to determine content area
  const buildings = canvasElement.querySelectorAll('.building-placed');
  const streets = canvasElement.querySelectorAll('[style*="position: absolute"]');

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  [...buildings, ...streets].forEach(element => {
    const style = element.style;
    const left = parseInt(style.left) || 0;
    const top = parseInt(style.top) || 0;
    const width = parseInt(style.width) || 80;
    const height = parseInt(style.height) || 80;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  // Add padding around content
  const padding = 100;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(2000, maxX - minX + 2 * padding),
    height: Math.min(2000, maxY - minY + 2 * padding)
  };
};

export const exportCityAsImage = async (cityName, canvasRef) => {
  try {
    if (!canvasRef?.current) {
      throw new Error('Canvas reference not found');
    }

    // Get the canvas element
    const canvasElement = canvasRef.current;

    // Calculate the content bounds to crop to actual city area
    const bounds = calculateContentBounds(canvasElement);

    // Configure html2canvas options for high quality
    const options = {
      backgroundColor: '#f3f4f6', // Set background color
      scale: 8, // Much higher resolution for larger elements
      useCORS: true,
      allowTaint: true,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      ignoreElements: (element) => {
        // Skip elements that shouldn't be in the export
        return element.classList.contains('no-export') || 
               element.classList.contains('resize-handle') ||
               element.classList.contains('btn') ||
               element.classList.contains('palette') ||
               element.classList.contains('properties-panel') ||
               element.classList.contains('border-primary'); // Remove selection borders
      }
    };

    // Capture the canvas as image
    const canvas = await html2canvas(canvasElement, options);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        resolve(true);
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.error('Error exporting city as image:', error);
    throw error;
  }
};

export const exportCityAsHighResImage = async (cityName, canvasRef, scale = 12) => {
  try {
    if (!canvasRef?.current) {
      throw new Error('Canvas reference not found');
    }

    const canvasElement = canvasRef.current;

    // Calculate the content bounds to crop to actual city area
    const bounds = calculateContentBounds(canvasElement);

    // High resolution export options
    const options = {
      backgroundColor: '#f3f4f6',
      scale: scale, // Even higher resolution
      useCORS: true,
      allowTaint: true,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      ignoreElements: (element) => {
        return element.classList.contains('no-export') || 
               element.classList.contains('resize-handle') ||
               element.classList.contains('btn') ||
               element.classList.contains('palette') ||
               element.classList.contains('properties-panel') ||
               element.classList.contains('border-primary'); // Remove selection borders
      }
    };

    const canvas = await html2canvas(canvasElement, options);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_hires.jpg`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/jpeg', 0.98);
    });

  } catch (error) {
    console.error('Error exporting high-res city image:', error);
    throw error;
  }
};