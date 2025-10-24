import React, { useState, useRef, useEffect } from "react";
import { getDefaultProfilePic } from "../utils/imageUtils";
import { getBaseUrl } from "../config/environment";

const OptimizedImage = ({
  src,
  alt = "Image",
  className = "",
  fallbackSrc = null,
  lazy = true,
  type = "default", // "profile", "post", "default"
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(lazy ? null : src);
  const [isLoading, setIsLoading] = useState(lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  const finalFallbackSrc = fallbackSrc || getDefaultProfilePic();

  // Get appropriate styling classes based on image type
  const getImageClasses = () => {
    const baseClasses = "optimized-image";
    const typeClasses = {
      profile: "optimized-image-profile",
      post: "optimized-image-post dashboard-post-image",
      default: "",
    };
    return `${baseClasses} ${typeClasses[type] || ""} ${className}`.trim();
  };

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          setIsLoading(false);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, lazy]);

  const handleError = () => {
    console.error(`❌ Failed to load image: ${imageSrc || src}`);
    console.error(`Base URL: ${getBaseUrl()}`);
    console.error(`Full image URL: ${imageSrc || src}`);
    console.error(`Image type: ${type}`);

    // Test if the base URL is accessible
    fetch(getBaseUrl())
      .then((response) => {
        console.log(
          `🌐 Base URL test result: ${response.status} ${response.statusText}`
        );
      })
      .catch((error) => {
        console.error(`🌐 Base URL not accessible:`, error);
      });

    if (!hasError) {
      setHasError(true);
      // Only use fallback for profile images, not post images
      if (type === "profile") {
        setImageSrc(finalFallbackSrc);
      } else {
        // For post images, don't show fallback - just hide the image
        setImageSrc(null);
      }
    }
  };

  const handleLoad = () => {
    console.log(`✅ Successfully loaded image: ${imageSrc || src}`);
    setIsLoading(false);
  };

  return (
    <div ref={imgRef} className={`optimized-image-container ${className}`}>
      {isLoading && lazy ? (
        <div
          className="image-placeholder"
          style={{
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#666",
            borderRadius: type === "post" ? "12px" : "8px",
            minHeight: type === "post" ? "200px" : "40px",
          }}
        >
          Loading...
        </div>
      ) : hasError && type !== "profile" ? (
        // For post images that failed to load, show error message instead of fallback
        <div
          className="image-error"
          style={{
            backgroundColor: "#f8f9fa",
            border: "2px dashed #dee2e6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: "#6c757d",
            borderRadius: type === "post" ? "12px" : "8px",
            minHeight: type === "post" ? "200px" : "40px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          {type === "post"
            ? "📷 Image could not be loaded"
            : "❌ Image not found"}
        </div>
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={getImageClasses()}
          style={{
            transition: "opacity 0.3s ease",
            opacity: isLoading ? 0.5 : 1,
          }}
          {...props}
        />
      ) : null}
    </div>
  );
};

export default OptimizedImage;
