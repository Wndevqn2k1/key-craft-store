import React from 'react';

// Image optimization utilities for better performance

export const getOptimizedImageUrl = (
  url: string | null,
  width?: number,
  quality: number = 80
): string => {
  if (!url) return '/placeholder.svg';
  
  // If it's a Supabase storage URL, add transformation params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    params.append('quality', quality.toString());
    params.append('format', 'webp'); // Use WebP for better compression
    return `${url}?${params.toString()}`;
  }
  
  return url;
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(src => preloadImage(src)));
};

// Custom hook for lazy loading images with Intersection Observer
export const useLazyImage = (ref: React.RefObject<HTMLImageElement>) => {
  React.useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref]);
};

// Generate responsive image srcset
export const generateSrcSet = (baseUrl: string, widths: number[]): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(baseUrl, width)} ${width}w`)
    .join(', ');
};

// Get optimal image format based on browser support
export const getOptimalFormat = (): 'webp' | 'jpeg' => {
  if (typeof window === 'undefined') return 'jpeg';
  
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  return 'jpeg';
};

// Calculate image dimensions maintaining aspect ratio
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};
