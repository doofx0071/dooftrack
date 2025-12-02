import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, Plus, Loader2, Check, Filter, X, Shuffle, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Input, Button, Card, cn } from '../components/Common';
import { searchMangaDex, SearchOptions, getRandomManga, getRecentlyUpdated, getPopularManga, getCompletedManga, getNewlyAdded } from '../services/mangadex';
import { addToLibrary, getLibrary } from '../services/store';
import { Manhwa } from '../types';

// Debounce hook for search suggestions
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Store search state in sessionStorage to preserve it when navigating back
const SEARCH_STATE_KEY = 'dooftrack_search_state';

interface SearchState {
  query: string;
  results: Manhwa[];
  filters: SearchOptions;
  showFilters: boolean;
}

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [filters, setFilters] = useState<SearchOptions>({
    contentRating: ['safe', 'suggestive'],
    status: [],
    publicationDemographic: []
  });
  
  // Browse sections state
  const [browseData, setBrowseData] = useState<{
    popular: Manhwa[];
    recentlyUpdated: Manhwa[];
    completed: Manhwa[];
    newlyAdded: Manhwa[];
  }>({
    popular: [],
    recentlyUpdated: [],
    completed: [],
    newlyAdded: []
  });
  const [browseLoading, setBrowseLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Manhwa[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the query for autocomplete
  const debouncedQuery = useDebounce(query, 300);

  // Restore search state from sessionStorage when component mounts
  useEffect(() => {
    const savedState = sessionStorage.getItem(SEARCH_STATE_KEY);
    if (savedState) {
      try {
        const state: SearchState = JSON.parse(savedState);
        setQuery(state.query);
        setResults(state.results);
        setFilters(state.filters);
        setShowFilters(state.showFilters);
        if (state.results.length > 0 || state.query) {
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Error restoring search state:', error);
      }
    }
  }, []);
  
  // Load browse data on mount
  useEffect(() => {
    loadBrowseData();
  }, []);
  
  const loadBrowseData = async () => {
    setBrowseLoading(true);
    try {
      const [popular, recentlyUpdated, completed, newlyAdded] = await Promise.all([
        getPopularManga(10),
        getRecentlyUpdated(10),
        getCompletedManga(10),
        getNewlyAdded(10)
      ]);
      setBrowseData({ popular, recentlyUpdated, completed, newlyAdded });
    } catch (error) {
      console.error('Error loading browse data:', error);
    } finally {
      setBrowseLoading(false);
    }
  };

  // Save search state to sessionStorage whenever it changes
  useEffect(() => {
    const state: SearchState = {
      query,
      results,
      filters,
      showFilters
    };
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  }, [query, results, filters, showFilters]);

  // Load library IDs to show "Added" status
  useEffect(() => {
    getLibrary().then(lib => {
      setLibraryIds(new Set(lib.map(i => i.id)));
    });
  }, []);
  
  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      setSuggestionsLoading(true);
      try {
        const data = await searchMangaDex(debouncedQuery, { ...filters, limit: 6 });
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchMangaDex(query, filters);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };
  
  const handleInputFocus = () => {
    if (query.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  const handleSelectSuggestion = (manga: Manhwa) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/manhwa/${manga.source_id}`);
  };
  
  const handleRandomManga = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const manga = await getRandomManga();
      if (manga) {
        setResults([manga]);
        setQuery('');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    sessionStorage.removeItem(SEARCH_STATE_KEY);
  };
  
  const toggleFilter = <T extends keyof SearchOptions>(key: T, value: SearchOptions[T][number]) => {
    setFilters(prev => {
      const current = (prev[key] as any[]) || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };
  
  const clearFilters = () => {
    setFilters({
      contentRating: ['safe', 'suggestive'],
      status: [],
      publicationDemographic: []
    });
  };

  const handleAdd = async (manhwa: Manhwa, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking Add button
    
    // Optimistic UI update - instant feedback
    setLibraryIds(prev => new Set(prev).add(manhwa.id));
    
    try {
      await addToLibrary(manhwa);
    } catch (error) {
      // Rollback on error
      console.error('Failed to add to library:', error);
      setLibraryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(manhwa.id);
        return newSet;
      });
    }
  };
  
  const handleNavigateToManhwa = (manga: Manhwa) => {
    // Navigate to Details page using source_id (MangaDex ID)
    // Details page will handle both library items and preview mode
    navigate(`/manhwa/${manga.source_id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-4 items-center text-center pt-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Discover Manhwa
        </h1>
        <p className="text-muted-foreground text-lg max-w-[600px] leading-relaxed">
          Search MangaDex's massive library and add titles to your personal tracking list.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex w-full max-w-2xl mx-auto items-center space-x-2" aria-label="Search form">
        <div className="relative flex-1" ref={searchContainerRef}>
          <label htmlFor="search-input" className="sr-only">Search titles</label>
          <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground z-10" aria-hidden="true" />
          <Input
            id="search-input"
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search by title..."
            className="pl-10 h-12 text-lg font-medium"
            aria-label="Search titles"
            autoComplete="off"
          />
          
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map((manga, index) => (
                    <li
                      key={manga.id}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                        index === selectedIndex 
                          ? "bg-primary/20" 
                          : "hover:bg-muted/50",
                        index !== suggestions.length - 1 && "border-b border-border/50"
                      )}
                      onClick={() => handleSelectSuggestion(manga)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <img
                        src={manga.cover_url}
                        alt={manga.title}
                        className="w-10 h-14 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{manga.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {manga.description?.slice(0, 80)}...
                        </p>
                      </div>
                      {libraryIds.has(manga.id) && (
                        <span className="flex-shrink-0 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                          In Library
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 w-12"
          title="Toggle filters"
        >
          <Filter className="h-5 w-5" />
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={handleRandomManga}
          disabled={loading}
          className="h-12 w-12"
          title="Random manga"
        >
          <Shuffle className="h-5 w-5" />
        </Button>
        <Button type="submit" size="lg" disabled={loading} className="h-12 px-8 font-semibold">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>
      
      {/* Advanced Filters */}
      {showFilters && (
        <div className="max-w-4xl mx-auto p-6 bg-secondary/20 border border-border/50 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" /> Clear All
            </Button>
          </div>
          
          {/* Content Rating */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Content Rating</label>
            <div className="flex flex-wrap gap-2">
              {(['safe', 'suggestive', 'erotica'] as const).map(rating => (
                <Button
                  key={rating}
                  type="button"
                  variant={filters.contentRating?.includes(rating) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('contentRating', rating)}
                  className="capitalize"
                >
                  {rating}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex flex-wrap gap-2">
              {(['ongoing', 'completed', 'hiatus', 'cancelled'] as const).map(status => (
                <Button
                  key={status}
                  type="button"
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('status', status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Publication Demographic */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Demographic</label>
            <div className="flex flex-wrap gap-2">
              {(['shounen', 'shoujo', 'josei', 'seinen'] as const).map(demo => (
                <Button
                  key={demo}
                  type="button"
                  variant={filters.publicationDemographic?.includes(demo) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('publicationDemographic', demo)}
                  className="capitalize"
                >
                  {demo}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  src={manga.cover_url}
                  alt={manga.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  width="300"
                  height="450"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                  <Button 
                    className={cn("w-full gap-2 font-medium", isAdded ? "bg-green-600 hover:bg-green-700" : "")}
                    onClick={(e) => !isAdded && handleAdd(manga, e)}
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <><Check className="w-4 h-4" /> Added</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add to Library</>
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-heading font-semibold leading-tight line-clamp-1" title={manga.title}>
                  {manga.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {manga.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Show search results when searched */}
      {hasSearched && results.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <SearchIcon className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No results found.</p>
          <p className="mb-4">Try searching for popular titles like "Solo Leveling" or "Tower of God".</p>
          <Button variant="outline" onClick={clearSearch} className="cursor-pointer">
            Back to Browse
          </Button>
        </div>
      )}
      
      {/* Browse Sections - shown when not searching */}
      {!hasSearched && !loading && (
        <div className="space-y-10">
          {/* Popular Manhwa */}
          <BrowseSection
            title="Popular"
            icon={TrendingUp}
            items={browseData.popular}
            loading={browseLoading}
            libraryIds={libraryIds}
            onAdd={handleAdd}
            onNavigate={handleNavigateToManhwa}
          />
          
          {/* Recently Updated */}
          <BrowseSection
            title="Recently Updated"
            icon={Clock}
            items={browseData.recentlyUpdated}
            loading={browseLoading}
            libraryIds={libraryIds}
            onAdd={handleAdd}
            onNavigate={handleNavigateToManhwa}
          />
          
          {/* Completed */}
          <BrowseSection
            title="Completed"
            icon={CheckCircle}
            items={browseData.completed}
            loading={browseLoading}
            libraryIds={libraryIds}
            onAdd={handleAdd}
            onNavigate={handleNavigateToManhwa}
          />
          
          {/* Newly Added */}
          <BrowseSection
            title="Newly Added"
            icon={Sparkles}
            items={browseData.newlyAdded}
            loading={browseLoading}
            libraryIds={libraryIds}
            onAdd={handleAdd}
            onNavigate={handleNavigateToManhwa}
          />
        </div>
      )}
    </div>
  );
}

// Browse section component
function BrowseSection({ 
  title, 
  icon: Icon, 
  items, 
  loading, 
  libraryIds, 
  onAdd, 
  onNavigate 
}: { 
  title: string;
  icon: any;
  items: Manhwa[];
  loading: boolean;
  libraryIds: Set<string>;
  onAdd: (manga: Manhwa, e: React.MouseEvent) => void;
  onNavigate: (manga: Manhwa) => void;
}) {
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
                  src={manga.cover_url}
                  alt={manga.title}
                  loading="lazy"
                  decoding="async"
                  width="256"
                  height="384"
                  className="w-full h-full object-cover"
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
