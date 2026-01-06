import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, BookOpen } from 'lucide-react';
import { Button, Card } from '../Common';
import { Manhwa } from '../../types';
import { buildOptimizedCoverUrl, IMAGE_PRESETS, buildSrcSet, RESPONSIVE_SIZES } from '../../utils/imageOptimization';

interface SearchResultsProps {
    results: Manhwa[];
    libraryIds: Set<string>;
    onAdd: (manga: Manhwa, e: React.MouseEvent) => void;
    onStartReading: (manga: Manhwa, e: React.MouseEvent) => void;
}

export function SearchResults({ results, libraryIds, onAdd, onStartReading }: SearchResultsProps) {
  const navigate = useNavigate();

  const handleNavigateToManhwa = (manga: Manhwa) => {
    navigate(`/manhwa/${manga.source_id}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {results.map((manga) => {
        const isAdded = libraryIds.has(manga.id);
        return (
          <Card 
            key={manga.id} 
            className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer"
            onClick={() => handleNavigateToManhwa(manga)}
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src={buildOptimizedCoverUrl(manga.cover_url, IMAGE_PRESETS.card)}
                srcSet={buildSrcSet(manga.cover_url, [256, 384, 512], 85)}
                sizes={RESPONSIVE_SIZES.cardGrid}
                alt={manga.title}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                width="300"
                height="450"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                {isAdded ? (
                  <Button className="w-full gap-2 font-medium bg-green-600 hover:bg-green-700" disabled>
                    <Check className="w-4 h-4" /> Added
                  </Button>
                ) : (
                  <div className="w-full flex gap-2">
                    <Button className="flex-1 gap-1 font-medium text-xs" onClick={(e) => onAdd(manga, e)}>
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                    <Button className="flex-1 gap-1 font-medium bg-indigo-600 hover:bg-indigo-700 text-xs" onClick={(e) => onStartReading(manga, e)}>
                      <BookOpen className="w-3 h-3" /> Start Reading
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-heading font-semibold leading-tight line-clamp-1" title={manga.title}>{manga.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{manga.description}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
