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
    if (profilePic.includes("uploads/")) {
      return `${BASE_URL}/${profilePic}`;
    } else {
      return `${BASE_URL}/uploads/${profilePic}`;
    }
  } catch (error) {
    console.warn("Error processing profile pic URL:", error);
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

/**
 * Test if an image URL is accessible
 * @param {string} imageUrl - The image URL to test
 * @returns {Promise<boolean>} - Promise that resolves to true if accessible
 */
export const testImageAccessibility = async (imageUrl) => {
  try {
    console.log(`🧪 Testing image accessibility: ${imageUrl}`);
    const response = await fetch(imageUrl, { method: "HEAD" });
    const isAccessible = response.ok;

    console.log(`📊 Image test result:`, {
      url: imageUrl,
      status: response.status,
      statusText: response.statusText,
      accessible: isAccessible,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    if (!isAccessible) {
      console.error(
        `❌ Image not accessible - Status: ${response.status}, StatusText: ${response.statusText}`
      );
    } else {
      console.log(`✅ Image accessible: ${imageUrl}`);
    }

    return isAccessible;
  } catch (error) {
    console.error(
      `❌ Error testing image accessibility for ${imageUrl}:`,
      error
    );
    return false;
  }
};

/**
 * Test backend uploads directory accessibility
 */
export const testUploadsDirectory = async () => {
  const BASE_URL = getBaseUrl();
  const testUrl = `${BASE_URL}/test-uploads`;

  try {
    console.log(`🧪 Testing uploads directory: ${testUrl}`);
    const response = await fetch(testUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Uploads directory accessible:`, data);
      return true;
    } else {
      console.error(
        `❌ Uploads directory test failed: ${response.status} ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ Uploads directory test error:`, error);
    return false;
  }
};

/**
 * Debug function to test backend image serving
 */
export const debugImageUrls = async () => {
  const BASE_URL = getBaseUrl();
  console.log("🔍 Image Debug Information:");
  console.log("Base URL:", BASE_URL);
  console.log("Default profile pic URL:", getDefaultProfilePic());

  // Test uploads directory first
  await testUploadsDirectory();

  // Test a few common image URLs
  const testUrls = [
    `${BASE_URL}/uploads/1756143513016.png`,
    `${BASE_URL}/api/test`,
    `${BASE_URL}/uploads/test.jpg`,
  ];

  for (const url of testUrls) {
    await testImageAccessibility(url);
  }
};
