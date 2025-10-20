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
  return `${BASE_URL}/${profilePic}`;
};

/**
 * Get avatar URL - alias for getProfilePicUrl
 * @param {string} profilePic - User's profile picture path/URL
 * @returns {string} - Complete image URL
 */
export const getAvatarUrl = (profilePic) => {
  return getProfilePicUrl(profilePic);
};
