import React from 'react';
import { Link } from 'react-router-dom';
import { LibraryItem } from '../../types';
import { Clock } from 'lucide-react';
import { buildOptimizedCoverUrl, IMAGE_PRESETS, buildSrcSet } from '../../utils/imageOptimization';

interface LibraryRecentProps {
  items: LibraryItem[];
}

export const LibraryRecent: React.FC<LibraryRecentProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xl font-heading font-semibold text-primary">
        <Clock className="w-5 h-5" />
        <h2>Recently Updated</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        {items.map((item) => (
          <Link to={`/manhwa/${item.id}`} key={`recent-${item.id}`} className="shrink-0 w-[140px] group cursor-pointer">
             <div className="relative aspect-[2/3] overflow-hidden border border-border/50">
               <img 
                  src={buildOptimizedCoverUrl(item.cover_url, IMAGE_PRESETS.thumbnail)} 
                  srcSet={buildSrcSet(item.cover_url, [128, 256], 80)}
                  sizes="140px"
                  alt={item.title} 
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  width="140"
                  height="210"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <p className="text-xs font-semibold text-white line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-gray-300 font-medium mt-0.5">
                    Ch. {item.progress?.last_chapter}{item.lastChapter ? `/${item.lastChapter}` : ''}
                  </p>
                </div>
             </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
