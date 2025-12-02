import React from 'react';
import { cn } from './Common';

interface SkeletonCardProps {
  /** Optional className for custom styling */
  className?: string;
  /** Number of skeleton cards to render */
  count?: number;
}

/**
 * Skeleton Card Component
 * 
 * Animated placeholder for manhwa cards while content is loading.
 * Matches the actual card layout to prevent layout shift.
 * 
 * Features:
 * - Pulse animation
 * - Matches real card dimensions (aspect ratio 2/3)
 * - Includes cover + title placeholders
 * - Responsive grid support
 * 
 * @example
 * ```tsx
 * {loading ? (
 *   <SkeletonCard count={6} />
 * ) : (
 *   manhwaCards.map(card => <ManhwaCard {...card} />)
 * )}
 * ```
 */
export function SkeletonCard({ className, count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'space-y-3 animate-pulse',
            className
          )}
          aria-hidden="true"
        >
          {/* Cover placeholder */}
          <div className="aspect-[2/3] bg-secondary/30 rounded-lg" />
          
          {/* Title placeholders */}
          <div className="space-y-2 px-1">
            <div className="h-4 bg-secondary/30 rounded w-3/4" />
            <div className="h-4 bg-secondary/20 rounded w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton Card Grid Component
 * 
 * Pre-configured grid layout for skeleton cards.
 * Matches the responsive grid used in Library and Search pages.
 */
export function SkeletonCardGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <SkeletonCard count={count} />
    </div>
  );
}

/**
 * Skeleton Horizontal Scroll Component
 * 
 * For horizontal scrolling sections like "Recently Updated"
 */
export function SkeletonHorizontalScroll({ count = 8 }: { count?: number }) {
  return (
    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-[140px] space-y-2 animate-pulse"
          aria-hidden="true"
        >
          <div className="aspect-[2/3] bg-secondary/30 rounded-lg" />
          <div className="h-3 bg-secondary/30 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
