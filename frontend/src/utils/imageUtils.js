// Image utility functions
import { getBaseUrl } from "../config/environment";

/**
 * Get the default profile picture URL
 * Uses a specific uploaded image as the default instead of a placeholder
 */
export const getDefaultProfilePic = () => {
  const BASE_URL = getBaseUrl();
  return `${BASE_URL}/uploads/1756143513016.png`;
};

/**
 * Get profile picture URL with fallback to default
 * @param {string} profilePic - User's profile picture path/URL
 * @returns {string} - Complete image URL
 */
export const getProfilePicUrl = (profilePic) => {
  if (!profilePic) return getDefaultProfilePic();
  if (profilePic.startsWith("http")) return profilePic;

  const BASE_URL = getBaseUrl();
  // Add error handling for malformed paths
  try {
    if (profilePic.includes('uploads/')) {
      return `${BASE_URL}/${profilePic}`;
    } else {
      return `${BASE_URL}/uploads/${profilePic}`;
    }
  } catch (error) {
    console.warn('Error processing profile pic URL:', error);
    return getDefaultProfilePic();
  }
};

/**
 * Preload image for better performance
 * @param {string} src - Image source URL
 * @returns {Promise<string>} - Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Get avatar URL - alias for getProfilePicUrl
 * @param {string} profilePic - User's profile picture path/URL
 * @returns {string} - Complete image URL
 */
export const getAvatarUrl = (profilePic) => {
  return getProfilePicUrl(profilePic);
};
