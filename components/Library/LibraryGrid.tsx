import React from 'react';
import { Link } from 'react-router-dom';
import { LibraryItem, ReadingStatus } from '../../types';
import { Card, Badge, cn } from '../Common';
import { BookOpen, Star, CheckSquare, Square } from 'lucide-react';
import { buildOptimizedCoverUrl, IMAGE_PRESETS, buildSrcSet, RESPONSIVE_SIZES } from '../../utils/imageOptimization';

interface LibraryGridProps {
  items: LibraryItem[];
  viewMode: 'grid' | 'list';
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  items,
  viewMode,
  selectionMode,
  selectedIds,
  onToggleSelect
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const listContent = (
            <Card className={cn(
              "overflow-hidden border-border/50 bg-card/40 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4",
              !selectionMode && "hover:bg-card/80 hover:shadow-lg",
              selectionMode && "cursor-pointer",
              isSelected && "ring-2 ring-primary"
            )}>
              {/* Thumbnail */}
              <div className="shrink-0 w-16 h-24 sm:w-24 sm:h-32 relative overflow-hidden border border-border/50">
                <img
                  src={buildOptimizedCoverUrl(item.cover_url, IMAGE_PRESETS.thumbnail)}
                  srcSet={buildSrcSet(item.cover_url, [128, 256], 80)}
                  sizes="96px"
                  alt={item.title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  decoding="async"
                  width="96"
                  height="128"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold text-sm sm:text-base line-clamp-1 sm:line-clamp-2 font-heading transition-colors",
                  !selectionMode && "group-hover:text-primary"
                )}>
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
                  {item.author || 'Unknown Author'}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{item.rating || 'N/A'}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Ch. {item.progress?.last_chapter || 0}{item.lastChapter ? `/${item.lastChapter}` : ''}
                  </Badge>
                  {item.progress?.status && (
                    <Badge className={cn(
                      "text-xs",
                      item.progress.status === ReadingStatus.READING && "bg-indigo-600",
                      item.progress.status === ReadingStatus.COMPLETED && "bg-green-600"
                    )}>
                      {item.progress.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Checkbox in selection mode */}
              {selectionMode && (
                <div className="shrink-0">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center border-2 transition-colors",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "bg-background border-input"
                  )}>
                    {isSelected && <CheckSquare className="w-4 h-4 text-primary-foreground" />}
                    {!isSelected && <Square className="w-4 h-4" />}
                  </div>
                </div>
              )}
            </Card>
          );

          return selectionMode ? (
            <div
              key={item.id}
              onClick={() => onToggleSelect(item.id)}
              className="cursor-pointer"
            >
              {listContent}
            </div>
          ) : (
            <Link to={`/manhwa/${item.id}`} key={item.id} className="group cursor-pointer">
              {listContent}
            </Link>
          );
        })}
        {items.length === 0 && (
          <EmptyState />
        )}
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const cardContent = (
          <Card className={cn(
            "h-full overflow-hidden border-border/50 bg-card/40 transition-all",
            !selectionMode && "hover:bg-card/80 hover:-translate-y-1 hover:shadow-lg",
            selectionMode && "cursor-pointer",
            isSelected && "ring-2 ring-primary"
          )}>
            <div className="relative aspect-[2/3]">
              <img
                src={buildOptimizedCoverUrl(item.cover_url, IMAGE_PRESETS.card)}
                srcSet={buildSrcSet(item.cover_url, [256, 384, 512], 85)}
                sizes={RESPONSIVE_SIZES.cardGrid}
                alt={item.title}
                className="object-cover w-full h-full"
                loading="lazy"
                decoding="async"
                width="256"
                height="384"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              
              {/* Checkbox in selection mode */}
              {selectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center border-2 transition-colors",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "bg-black/60 border-white/50 backdrop-blur-sm"
                  )}>
                    {isSelected && <CheckSquare className="w-4 h-4 text-primary-foreground" />}
                    {!isSelected && <Square className="w-4 h-4 text-white" />}
                  </div>
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                 <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-none shadow-sm font-medium">
                    Ch. {item.progress?.last_chapter || 0}{item.lastChapter ? `/${item.lastChapter}` : ''}
                 </Badge>
              </div>
              {item.progress?.status && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8">
                   <p className={cn(
                     "text-[10px] font-bold uppercase tracking-wider text-center py-1",
                     item.progress.status === ReadingStatus.READING ? "text-indigo-300" :
                     item.progress.status === ReadingStatus.COMPLETED ? "text-green-300" : "text-muted-foreground"
                   )}>
                     {item.progress.status}
                   </p>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className={cn(
                "font-semibold text-sm line-clamp-2 leading-snug font-heading transition-colors",
                !selectionMode && "group-hover:text-primary"
              )}>
                {item.title}
              </h3>
            </div>
          </Card>
        );
        
        return selectionMode ? (
          <div
            key={item.id}
            onClick={() => onToggleSelect(item.id)}
            className="cursor-pointer"
          >
            {cardContent}
          </div>
        ) : (
          <Link to={`/manhwa/${item.id}`} key={item.id} className="group cursor-pointer">
            {cardContent}
          </Link>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full">
            <EmptyState />
        </div>
      )}
    </div>
  );
};

const EmptyState = () => (
    <div className="py-20 text-center border-2 border-dashed border-border/50 bg-secondary/10 rounded-lg">
      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
      <h3 className="text-lg font-heading font-medium">No manhwa found</h3>
      <p className="text-muted-foreground mb-4">You haven't added any titles with this status yet.</p>
      <Link to="/search">
        <button className="bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 font-medium cursor-pointer">
          Browse MangaDex
        </button>
      </Link>
    </div>
);
