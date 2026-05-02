import React from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  ...props
}) => {
  // Logic to handle WebP fallback if the original is not WebP
  // encodeURIComponent is used for individual parts, but for the whole path
  // we just ensure extensions are handled case-insensitively
  const encodedSrc = encodeURI(src);
  /* 
  const isWebP = src.toLowerCase().endsWith(".webp");
  const webpSrc = isWebP
    ? encodedSrc
    : encodedSrc.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  */

  return (
    <picture>
      {/* Temporarily disabled source until WebP files are generated to prevent HTML fallback issues */}
      {/* {!isWebP && <source srcSet={webpSrc} type="image/webp" />} */}
      <img
        src={encodedSrc}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        {...props}
      />
    </picture>
  );
};
