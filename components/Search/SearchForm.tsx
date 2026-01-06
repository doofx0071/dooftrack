import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, Shuffle, Loader2, History } from 'lucide-react';
import { Input, Button, cn } from '../Common';
import { Manhwa } from '../../types';
import { searchMangaDex, getRandomManga, SearchOptions } from '../../services/mangadex';
import { buildOptimizedCoverUrl } from '../../utils/imageOptimization';
import { useDebounce } from '../../hooks/useDebounce';

const SEARCH_HISTORY_KEY = 'dooftrack_search_history'; // Should match parent or be managed here
const MAX_HISTORY_ITEMS = 10;

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface SearchFormProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  loading: boolean;
  libraryIds: Set<string>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: SearchOptions;
  setFilters: React.Dispatch<React.SetStateAction<SearchOptions>>;
  setResults: (results: Manhwa[]) => void; // For random manga
  setHasSearched: (hasSearched: boolean) => void; // For random manga
}

export function SearchForm({
  query,
  setQuery,
  onSearch,
  loading,
  libraryIds,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  setResults,
  setHasSearched
}: SearchFormProps) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Manhwa[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Search history state
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Load history
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    try {
      const newHistory = [
        { query: searchQuery.trim(), timestamp: Date.now() },
        ...searchHistory.filter(item => item.query.toLowerCase() !== searchQuery.trim().toLowerCase())
      ].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (e) { console.error(e); }
  };

  const clearSearchHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  };

  const removeFromHistory = (q: string) => {
    const newHistory = searchHistory.filter(i => i.query !== q);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  // Suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    searchMangaDex(debouncedQuery, { ...filters, limit: 6 })
      .then(setSuggestions)
      .catch(console.error)
      .finally(() => setSuggestionsLoading(false));
  }, [debouncedQuery]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    setShowHistory(false);
    saveToHistory(query);
    onSearch(query);
  };

  const handleRandomManga = async () => {
    setHasSearched(true);
    // loading handled by parent if we passed a callback, but we do it manually here?
    // Parent handles loading state via props usually, but here we set local state logic or parent state
    // Let's assume parent sets loading via wrapper, but we need to signal it.
    // Ideally onSearch should handle "Random" vs "Query"
    // Reusing parent setLoading might be tricky if not passed.
    // For now we just call the API and set results directly. 
    try {
        const manga = await getRandomManga();
        if (manga) {
            setResults([manga]);
            setQuery('');
        }
    } catch (e) {
        console.error(e);
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
      setShowHistory(false);
    } else if (query.trim().length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (manga: Manhwa) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/manhwa/${manga.source_id}`);
  };

  const toggleFilter = <T extends keyof SearchOptions>(
    key: T, 
    value: SearchOptions[T] extends (infer U)[] | undefined ? U : never
  ) => {
    setFilters(prev => {
      const current = (prev[key] as any[]) || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((v: any) => v !== value) : [...current, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({ contentRating: ['safe', 'suggestive'], status: [], publicationDemographic: [] });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto items-center space-x-2" aria-label="Search form">
        <div className="relative flex-1" ref={searchContainerRef}>
          <label htmlFor="search-input" className="sr-only">Search titles</label>
          <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground z-10" aria-hidden="true" />
          <Input
            id="search-input"
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Search by title..."
            className="pl-10 h-12 text-lg font-medium"
            autoComplete="off"
          />
          
          {/* Recent Searches */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-secondary/20">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Recent Searches</span>
                  <Button variant="ghost" size="sm" onClick={clearSearchHistory} className="h-6 px-2 text-xs">Clear All</Button>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                    {searchHistory.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 hover:bg-muted/50 border-b border-border/30 last:border-0">
                            <button onClick={() => {
                                setQuery(item.query);
                                setShowHistory(false);
                                onSearch(item.query);
                            }} className="flex-1 text-left cursor-pointer">
                                <p className="text-sm font-medium">{item.query}</p>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); removeFromHistory(item.query); }} className="p-1 hover:text-destructive cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : suggestions.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map((manga, idx) => (
                    <li key={manga.id} 
                        className={cn("flex items-center gap-3 p-3 cursor-pointer transition-colors", idx === selectedIndex ? "bg-primary/20" : "hover:bg-muted/50")}
                        onClick={() => handleSelectSuggestion(manga)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <img src={buildOptimizedCoverUrl(manga.cover_url, { width: 128 })} alt={manga.title} className="w-10 h-14 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{manga.title}</p>
                      </div>
                      {libraryIds.has(manga.id) && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Added</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>

        <Button type="button" variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="h-12 w-12">
            <Filter className="h-5 w-5" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={handleRandomManga} disabled={loading} className="h-12 w-12">
            <Shuffle className="h-5 w-5" />
        </Button>
        <Button type="submit" size="lg" disabled={loading} className="h-12 px-8 font-semibold">
           {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {/* Filters UI */}
      {showFilters && (
        <div className="max-w-4xl mx-auto p-6 bg-secondary/20 border border-border/50 space-y-4 animate-in slide-in-from-top-4 duration-300">
           <div className="flex justify-between items-center">
             <h3 className="font-heading font-semibold text-lg">Advanced Filters</h3>
             <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2"><X className="w-4 h-4" /> Clear All</Button>
           </div>
           
           <div className="space-y-2">
             <label className="text-sm font-semibold text-muted-foreground uppercase">Content Rating</label>
             <div className="flex flex-wrap gap-2">
               {(['safe', 'suggestive', 'erotica'] as const).map(rating => (
                 <Button key={rating} type="button" variant={filters.contentRating?.includes(rating) ? 'default' : 'outline'} size="sm" onClick={() => toggleFilter('contentRating', rating)} className="capitalize">{rating}</Button>
               ))}
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-sm font-semibold text-muted-foreground uppercase">Status</label>
             <div className="flex flex-wrap gap-2">
               {(['ongoing', 'completed', 'hiatus', 'cancelled'] as const).map(status => (
                 <Button key={status} type="button" variant={filters.status?.includes(status) ? 'default' : 'outline'} size="sm" onClick={() => toggleFilter('status', status)} className="capitalize">{status}</Button>
               ))}
             </div>
           </div>
        </div>
      )}
    </>
  );
}
