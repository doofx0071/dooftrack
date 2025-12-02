import React from 'react';

/**
 * Skeleton Details Component
 * 
 * Animated placeholder for the Details page while manga data is loading.
 * Matches the actual Details page layout to prevent layout shift.
 * 
 * Features:
 * - Pulse animation
 * - Two-column layout (cover + content)
 * - Matches responsive breakpoints
 * - Includes all major sections (cover, title, description, controls)
 */
export function SkeletonDetails() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 animate-pulse" aria-hidden="true">
      {/* Back Button Skeleton */}
      <div className="h-10 w-32 bg-secondary/50 rounded" />

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        {/* Left Column: Cover & Quick Stats */}
        <div className="space-y-6">
          {/* Cover Skeleton */}
          <div className="max-w-[200px] mx-auto md:max-w-none md:mx-0">
            <div className="aspect-[2/3] bg-secondary/30 rounded-lg" />
          </div>

          {/* Stats Card Skeleton */}
          <div className="h-32 bg-secondary/30 rounded-lg" />

          {/* Delete Button Skeleton */}
          <div className="h-12 bg-secondary/30 rounded-lg" />
        </div>

        {/* Right Column: Details & Controls */}
        <div className="space-y-8">
          {/* Title Skeleton */}
          <div className="space-y-4">
            <div className="h-12 w-3/4 bg-secondary/50 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-secondary/30 rounded" />
              <div className="h-4 w-full bg-secondary/30 rounded" />
              <div className="h-4 w-2/3 bg-secondary/30 rounded" />
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Controls Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status & Rating Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-secondary/40 rounded" />
                <div className="h-12 bg-secondary/30 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-secondary/40 rounded" />
                <div className="h-12 bg-secondary/30 rounded" />
              </div>
            </div>

            {/* Chapter Progress Column */}
            <div className="space-y-2">
              <div className="h-4 w-36 bg-secondary/40 rounded" />
              <div className="h-24 bg-secondary/30 rounded" />
            </div>
          </div>

          {/* Notes Section Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-secondary/40 rounded" />
            <div className="h-32 bg-secondary/30 rounded" />
          </div>

          {/* Save Button Skeleton */}
          <div className="h-12 w-32 bg-secondary/50 rounded" />
        </div>
      </div>

      {/* Recommendations Section Skeleton */}
      <div className="space-y-4 pt-8">
        <div className="h-6 w-48 bg-secondary/40 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] bg-secondary/30 rounded-lg" />
              <div className="h-4 bg-secondary/30 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Details Compact
 * 
 * Simpler skeleton for faster perceived loading
 */
export function SkeletonDetailsCompact() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-pulse" aria-hidden="true">
      <div className="h-10 w-32 bg-secondary/50 rounded" />
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 aspect-[2/3] bg-secondary/30 rounded-lg" />
        <div className="flex-1 space-y-6">
          <div className="h-12 bg-secondary/50 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-secondary/30 rounded" />
            <div className="h-4 bg-secondary/30 rounded" />
            <div className="h-4 bg-secondary/30 rounded w-2/3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-secondary/30 rounded" />
            <div className="h-24 bg-secondary/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
