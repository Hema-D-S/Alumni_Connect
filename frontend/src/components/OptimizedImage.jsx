import React, { useState, useRef, useEffect } from "react";
import { getDefaultProfilePic } from "../utils/imageUtils";
import { getBaseUrl } from "../config/environment";

const OptimizedImage = ({
  src,
  alt = "Image",
  className = "",
  fallbackSrc = null,
  lazy = true,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(lazy ? null : src);
  const [isLoading, setIsLoading] = useState(lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  const finalFallbackSrc = fallbackSrc || getDefaultProfilePic();

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
    
    if (!hasError) {
      setHasError(true);
      setImageSrc(finalFallbackSrc);
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
          }}
        >
          Loading...
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            transition: "opacity 0.3s ease",
            opacity: isLoading ? 0.5 : 1,
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
