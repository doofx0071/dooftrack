import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Manhwa } from '../../types';
import { buildOptimizedCoverUrl, IMAGE_PRESETS, buildSrcSet } from '../../utils/imageOptimization';

interface BrowseSectionProps { 
  title: string;
  icon: any;
  items: Manhwa[];
  loading: boolean;
  libraryIds: Set<string>;
  onAdd: (manga: Manhwa, e: React.MouseEvent) => void;
  onNavigate: (manga: Manhwa) => void;
}

export function BrowseSection({ 
  title, 
  icon: Icon, 
  items, 
  loading, 
  libraryIds, 
  onAdd, 
  onNavigate 
}: BrowseSectionProps) {
  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="aspect-[2/3] bg-border/20 rounded-lg" />
              <div className="h-4 bg-border/20 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (items.length === 0) return null;
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((manga) => {
          const isAdded = libraryIds.has(manga.id);
          return (
            <div
              key={manga.id}
              className="group relative cursor-pointer"
              onClick={() => onNavigate(manga)}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border/50 
                            bg-card shadow-sm transition-all duration-300 
                            group-hover:shadow-lg group-hover:scale-105 group-hover:border-primary/50">
                <img
                  src={buildOptimizedCoverUrl(manga.cover_url, IMAGE_PRESETS.card)}
                  srcSet={buildSrcSet(manga.cover_url, [192, 256, 384], 85)}
                  sizes="(max-width: 640px) 192px, 256px"
                  alt={manga.title}
                  loading="lazy"
                  decoding="async"
                  width="256"
                  height="384"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAdded) onAdd(manga, e);
                  }}
                  disabled={isAdded}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm 
                            transition-all duration-300 opacity-0 group-hover:opacity-100
                            ${
                              isAdded
                                ? "bg-green-500/90 text-white cursor-default"
                                : "bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-110 cursor-pointer"
                            }`}
                  title={isAdded ? "In Library" : "Add to Library"}
                >
                  {isAdded ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Title */}
              <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-primary 
                           transition-colors duration-300">
                {manga.title}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
