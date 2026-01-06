import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/Common';
import { searchMangaDex, SearchOptions, getRecentlyUpdated, getPopularManga, getCompletedManga, getNewlyAdded } from '../services/mangadex';
import { addToLibrary, quickStartReading, getLibrary } from '../services/store';
import { Manhwa } from '../types';
import { useToast } from '../components/Toast';
import { SearchForm } from '../components/Search/SearchForm';
import { SearchResults } from '../components/Search/SearchResults';
import { BrowseSection } from '../components/Search/BrowseSection';

const SEARCH_STATE_KEY = 'dooftrack_search_state';

interface SearchState {
  query: string;
  results: Manhwa[];
  filters: SearchOptions;
  showFilters: boolean;
}

export default function Search() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchOptions>({
    contentRating: ['safe', 'suggestive'],
    status: [],
    publicationDemographic: []
  });
  
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

  // Restore state
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
  
  // Save state
  useEffect(() => {
    const state: SearchState = { query, results, filters, showFilters };
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  }, [query, results, filters, showFilters]);

  useEffect(() => {
    loadBrowseData();
    getLibrary().then(lib => setLibraryIds(new Set(lib.map(i => i.id))));
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

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    
    try {
      const data = await searchMangaDex(searchQuery, filters);
      setResults(data);
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

  const handleAdd = async (manhwa: Manhwa, e: React.MouseEvent) => {
    e.stopPropagation();
    setLibraryIds(prev => new Set(prev).add(manhwa.id));
    try {
      await addToLibrary(manhwa);
    } catch (error) {
      console.error('Failed to add to library:', error);
      setLibraryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(manhwa.id);
        return newSet;
      });
    }
  };
  
  const handleStartReading = async (manhwa: Manhwa, e: React.MouseEvent) => {
    e.stopPropagation();
    setLibraryIds(prev => new Set(prev).add(manhwa.id));
    try {
      await quickStartReading(manhwa);
      showToast(`Started reading "${manhwa.title}"`, 'success');
    } catch (error) {
      console.error('Failed to start reading:', error);
      showToast('Failed to add to library', 'error');
      setLibraryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(manhwa.id);
        return newSet;
      });
    }
  };
  
  const handleNavigateToManhwa = (manga: Manhwa) => {
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

      <SearchForm 
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        loading={loading}
        libraryIds={libraryIds}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        setResults={setResults}
        setHasSearched={setHasSearched}
      />

      {/* Results or Browse Sections */}
      {hasSearched ? (
        <>
            {results.length > 0 ? (
                <SearchResults 
                    results={results}
                    libraryIds={libraryIds}
                    onAdd={handleAdd}
                    onStartReading={handleStartReading}
                />
            ) : (
                !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <SearchIcon className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No results found.</p>
                        <p className="mb-4">Try searching for popular titles like "Solo Leveling" or "Tower of God".</p>
                        <Button variant="outline" onClick={clearSearch} className="cursor-pointer">
                            Back to Browse
                        </Button>
                    </div>
                )
            )}
        </>
      ) : (
        !loading && (
            <div className="space-y-10">
                <BrowseSection
                    title="Popular"
                    icon={TrendingUp}
                    items={browseData.popular}
                    loading={browseLoading}
                    libraryIds={libraryIds}
                    onAdd={handleAdd}
                    onNavigate={handleNavigateToManhwa}
                />
                <BrowseSection
                    title="Recently Updated"
                    icon={Clock}
                    items={browseData.recentlyUpdated}
                    loading={browseLoading}
                    libraryIds={libraryIds}
                    onAdd={handleAdd}
                    onNavigate={handleNavigateToManhwa}
                />
                <BrowseSection
                    title="Completed"
                    icon={CheckCircle}
                    items={browseData.completed}
                    loading={browseLoading}
                    libraryIds={libraryIds}
                    onAdd={handleAdd}
                    onNavigate={handleNavigateToManhwa}
                />
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
        )
      )}
    </div>
  );
}

