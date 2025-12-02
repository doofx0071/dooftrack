/**
 * Image Optimization Utilities
 * 
 * Helpers for building optimized image URLs and managing responsive images.
 * Works with the /api/cover proxy for MangaDex cover images.
 */

export interface ImageOptions {
  /** Desired width in pixels */
  width?: number;
  /** Image quality (1-100) */
  quality?: number;
  /** Use WebP format if supported (auto-detected via Accept header) */
  preferWebP?: boolean;
}

/**
 * Build an optimized cover image URL with size and quality hints
 * 
 * @param coverUrl - Original MangaDex cover URL or path
 * @param options - Optimization options (width, quality)
 * @returns Optimized URL through /api/cover proxy
 * 
 * @example
 * ```ts
 * // Basic usage
 * const url = buildOptimizedCoverUrl('/covers/abc/def.jpg');
 * 
 * // With size hint
 * const thumbnail = buildOptimizedCoverUrl('/covers/abc/def.jpg', { width: 256 });
 * 
 * // With size and quality
 * const compressed = buildOptimizedCoverUrl('/covers/abc/def.jpg', { 
 *   width: 512, 
 *   quality: 80 
 * });
 * ```
 */
export function buildOptimizedCoverUrl(
  coverUrl: string,
  options: ImageOptions = {}
): string {
  if (!coverUrl) return '';

  // Extract path from full MangaDex URLs if needed
  let path = coverUrl;
  if (coverUrl.includes('uploads.mangadex.org')) {
    const match = coverUrl.match(/covers\/(.+)/);
    path = match ? match[1] : coverUrl;
  } else if (coverUrl.startsWith('/covers/')) {
    path = coverUrl.replace('/covers/', '');
  } else if (coverUrl.startsWith('/api/cover/')) {
    // URL already includes /api/cover/, extract just the path
    path = coverUrl.replace('/api/cover/', '');
  }

  // Build query params for optimization hints
  const params = new URLSearchParams();
  if (options.width) {
    params.set('w', options.width.toString());
  }
  if (options.quality) {
    params.set('q', Math.max(1, Math.min(100, options.quality)).toString());
  }

  const queryString = params.toString();
  const baseUrl = `/api/cover/${path}`;
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate srcset attribute for responsive images
 * 
 * @param coverUrl - Original MangaDex cover URL or path
 * @param sizes - Array of widths for srcset (e.g., [256, 512, 1024])
 * @param quality - Optional quality hint for all sizes
 * @returns srcset attribute value
 * 
 * @example
 * ```tsx
 * <img 
 *   src={buildOptimizedCoverUrl(cover, { width: 512 })}
 *   srcSet={buildSrcSet(cover, [256, 512, 1024])}
 *   sizes="(max-width: 768px) 256px, 512px"
 * />
 * ```
 */
export function buildSrcSet(
  coverUrl: string,
  sizes: number[] = [256, 512, 1024],
  quality?: number
): string {
  return sizes
    .map((width) => {
      const url = buildOptimizedCoverUrl(coverUrl, { width, quality });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Common preset configurations for different use cases
 */
export const IMAGE_PRESETS = {
  /** Small thumbnail (256px, compressed) */
  thumbnail: { width: 256, quality: 80 } as ImageOptions,
  
  /** Medium card image (512px, balanced) */
  card: { width: 512, quality: 85 } as ImageOptions,
  
  /** Large detail image (1024px, high quality) */
  detail: { width: 1024, quality: 90 } as ImageOptions,
  
  /** Original size, high quality */
  original: { quality: 95 } as ImageOptions,
} as const;

/**
 * Responsive image sizes for different breakpoints
 */
export const RESPONSIVE_SIZES = {
  /** Thumbnail grid (mobile: 128px, tablet: 192px, desktop: 256px) */
  thumbnailGrid: '(max-width: 640px) 128px, (max-width: 1024px) 192px, 256px',
  
  /** Card grid (mobile: 192px, tablet: 256px, desktop: 384px) */
  cardGrid: '(max-width: 640px) 192px, (max-width: 1024px) 256px, 384px',
  
  /** Detail page (mobile: 256px, tablet: 512px, desktop: 768px) */
  detail: '(max-width: 640px) 256px, (max-width: 1024px) 512px, 768px',
  
  /** Full width */
  full: '100vw',
} as const;

/**
 * Check if browser supports WebP format
 * Note: Modern browsers auto-detect via Accept header, but this can be used for manual checks
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
}

/**
 * Preload critical images for faster rendering
 * 
 * @param urls - Array of image URLs to preload
 * 
 * @example
 * ```ts
 * preloadImages([
 *   buildOptimizedCoverUrl(cover1, { width: 512 }),
 *   buildOptimizedCoverUrl(cover2, { width: 512 }),
 * ]);
 * ```
 */
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
