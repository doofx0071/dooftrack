import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRelatedManga } from "../services/mangadex";
import { addToLibrary, isInLibrary } from "../services/store";
import { supabase } from "../services/supabase";
import { Manhwa } from "../types";
import { Plus, Check, Lightbulb } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface RecommendationsProps {
  mangaId: string;
  mangaTitle: string;
  limit?: number;
}

export default function Recommendations({ mangaId, mangaTitle, limit = 8 }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToLibrary, setAddedToLibrary] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, [mangaId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const related = await getRelatedManga(mangaId, limit);
      setRecommendations(related);
      
      // Check which ones are already in library
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const inLibrarySet = new Set<string>();
        await Promise.all(
          related.map(async (manga) => {
            const inLib = await isInLibrary(user.id, manga.source_id);
            if (inLib) inLibrarySet.add(manga.id);
          })
        );
        setAddedToLibrary(inLibrarySet);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (manga: Manhwa, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic update
    setAddingIds((prev) => new Set(prev).add(manga.id));

    try {
      await addToLibrary(manga);
      setAddedToLibrary((prev) => new Set(prev).add(manga.id));
    } catch (error) {
      console.error("Error adding to library:", error);
      // Rollback on error
      setAddedToLibrary((prev) => {
        const newSet = new Set(prev);
        newSet.delete(manga.id);
        return newSet;
      });
    } finally {
      setAddingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(manga.id);
        return newSet;
      });
    }
  };

  const handleNavigate = (manga: Manhwa) => {
    // Navigate to Details page using source_id (MangaDex ID)
    // Details page will handle both library items and preview mode
    navigate(`/manhwa/${manga.source_id}`);
  };

  if (loading) {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-2xl font-bold">You Might Also Like</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Because you read <span className="font-medium text-foreground">{mangaTitle}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SkeletonCard count={limit} />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-border/50">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-2xl font-bold">You Might Also Like</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-7">
          Because you read <span className="font-medium text-foreground">{mangaTitle}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommendations.map((manga) => {
          const isAdded = addedToLibrary.has(manga.id);
          const isAdding = addingIds.has(manga.id);

          return (
            <div
              key={manga.id}
              className="group relative cursor-pointer"
              onClick={() => handleNavigate(manga)}
            >
              {/* Cover Image */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border/50 
                            bg-card shadow-sm transition-all duration-300 
                            group-hover:shadow-lg group-hover:scale-105 group-hover:border-primary/50">
                <img
                  src={manga.cover_url}
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
                  onClick={(e) => handleAddToLibrary(manga, e)}
                  disabled={isAdded || isAdding}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm 
                            transition-all duration-300 opacity-0 group-hover:opacity-100
                            ${
                              isAdded
                                ? "bg-green-500/90 text-white cursor-default"
                                : "bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-110 cursor-pointer"
                            }
                            ${isAdding ? "cursor-not-allowed opacity-50" : ""}`}
                  title={isAdded ? "In Library" : "Add to Library"}
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isAdded ? (
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
