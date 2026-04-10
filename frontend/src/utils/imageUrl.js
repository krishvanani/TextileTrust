/**
 * Returns the correct image URL for display.
 * Handles both legacy local paths (/uploads/...) and new Cloudinary URLs (https://...).
 * 
 * @param {string} imagePath - The stored image path or URL
 * @param {string} apiBase - The API base URL (e.g., import.meta.env.VITE_API_URL)
 * @returns {string} The full image URL ready for use in <img src>
 */
export const getImageUrl = (imagePath, apiBase) => {
  if (!imagePath) return '';
  
  // Already a full URL (Cloudinary or other CDN)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Legacy local path - prepend API base
  return `${apiBase}${imagePath}`;
};
