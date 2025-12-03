import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLibrary, getRecentlyUpdated, removeFromLibrary, updateProgress } from '../services/store';
import { LibraryItem, ReadingStatus } from '../types';
import { Card, Badge, cn, Button } from '../components/Common';
import { BookOpen, Star, Clock, CheckSquare, Square, Trash2, Edit3, X, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { buildOptimizedCoverUrl, IMAGE_PRESETS, buildSrcSet, RESPONSIVE_SIZES } from '../utils/imageOptimization';

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [recentItems, setRecentItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  
  // Batch operations state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ReadingStatus>(ReadingStatus.READING);
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'added' | 'updated' | 'rating'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      // Run both queries in parallel for maximum speed
      const [libData, recentData] = await Promise.all([
        getLibrary(),
        getRecentlyUpdated(10)
      ]);
      
      if (mounted) {
        setItems(libData);
        setRecentItems(recentData);
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Batch operation handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set()); // Clear selections when toggling
  };
  
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map(item => item.id)));
  };
  
  const deselectAll = () => {
    setSelectedIds(new Set());
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !confirm(`Delete ${selectedIds.size} item(s)?`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => removeFromLibrary(id))
      );
      
      // Refresh library
      const libData = await getLibrary();
      setItems(libData);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Failed to delete some items');
    }
  };
  
  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const selectedItems = items.filter(item => selectedIds.has(item.id));
      
      await Promise.all(
        selectedItems.map(item =>
          updateProgress(item.id, {
            status: bulkStatus,
            last_chapter: item.progress?.last_chapter || 0,
            rating: item.progress?.rating || 0,
            notes: item.progress?.notes || ''
          })
        )
      );
      
      // Refresh library
      const libData = await getLibrary();
      setItems(libData);
      setSelectedIds(new Set());
      setShowBulkStatusModal(false);
      setSelectionMode(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update some items');
    }
  };

  // Apply filters and sorting
  const filteredItems = items
    .filter(item => {
      // Status filter
      if (filter !== 'ALL' && item.progress?.status !== filter) return false;
      
      // Rating filter
      const rating = item.progress?.rating || 0;
      if (rating < ratingMin || rating > ratingMax) return false;
      
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const itemDate = new Date(item.created_at);
        const daysAgo = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dateFilter === 'week' && daysAgo > 7) return false;
        if (dateFilter === 'month' && daysAgo > 30) return false;
        if (dateFilter === 'year' && daysAgo > 365) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case 'title':
          compareResult = a.title.localeCompare(b.title);
          break;
        case 'added':
          compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated':
          const aTime = a.progress?.updated_at ? new Date(a.progress.updated_at).getTime() : 0;
          const bTime = b.progress?.updated_at ? new Date(b.progress.updated_at).getTime() : 0;
          compareResult = aTime - bTime;
          break;
        case 'rating':
          compareResult = (a.progress?.rating || 0) - (b.progress?.rating || 0);
          break;
      }
      
      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

  const stats = {
    total: items.length,
    reading: items.filter(i => i.progress?.status === ReadingStatus.READING).length,
    completed: items.filter(i => i.progress?.status === ReadingStatus.COMPLETED).length,
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <div className="h-10 w-48 bg-secondary/50 mb-2"></div>
            <div className="h-4 w-64 bg-secondary/30"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-secondary/50"></div>
            <div className="h-10 w-32 bg-secondary/50"></div>
          </div>
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[2/3] bg-secondary/30"></div>
              <div className="h-4 bg-secondary/30 w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">My Library</h1>
            <p className="text-muted-foreground mt-1 text-base">
              Track your reading progress across <span className="text-foreground font-medium">{stats.total}</span> titles.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">{stats.reading} Reading</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">{stats.completed} Completed</span>
            </div>
          </div>
        </div>
        
        {/* Selection Mode Toggle */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant={selectionMode ? "default" : "outline"}
              onClick={toggleSelectionMode}
              className="gap-2 cursor-pointer"
            >
              {selectionMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              {selectionMode ? 'Cancel Selection' : 'Select Items'}
            </Button>
            
            {/* Batch Actions Toolbar */}
            {selectionMode && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedIds.size === filteredItems.length}
                  className="cursor-pointer"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={selectedIds.size === 0}
                  className="cursor-pointer"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkStatusModal(true)}
                  disabled={selectedIds.size === 0}
                  className="gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Change Status
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className="gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recently Updated Section */}
      {recentItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-heading font-semibold text-primary">
            <Clock className="w-5 h-5" />
            <h2>Recently Updated</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {recentItems.map((item) => (
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
      )}

      {/* Main Library List */}
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar flex-1">
              {['ALL', ...Object.values(ReadingStatus)].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border cursor-pointer",
                    filter === status 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {status === 'ALL' ? 'All Titles' : status}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 bg-secondary/20 border border-border/50 rounded-lg space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="updated">Last Updated</option>
                      <option value="added">Date Added</option>
                      <option value="title">Title</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-background border border-input rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
                
                {/* Rating Range */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Rating {ratingMin}-{ratingMax}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={ratingMin}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRatingMin(Math.min(val, ratingMax));
                      }}
                      className="flex-1 h-2 bg-secondary appearance-none cursor-pointer accent-primary rounded-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={ratingMax}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRatingMax(Math.max(val, ratingMin));
                      }}
                      className="flex-1 h-2 bg-secondary appearance-none cursor-pointer accent-primary rounded-full"
                    />
                  </div>
                </div>
                
                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Added</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
              
              {/* Reset Filters */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRatingMin(0);
                    setRatingMax(10);
                    setDateFilter('all');
                    setSortBy('updated');
                    setSortOrder('desc');
                  }}
                  className="cursor-pointer"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => {
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
                onClick={() => toggleSelect(item.id)}
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
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 bg-secondary/10">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-heading font-medium">No manhwa found</h3>
              <p className="text-muted-foreground mb-4">You haven't added any titles with this status yet.</p>
              <Link to="/search">
                <button className="bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 font-medium cursor-pointer">
                  Browse MangaDex
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Bulk Status Change Modal */}
      {showBulkStatusModal && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowBulkStatusModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-6 bg-card border border-border rounded-lg shadow-2xl mx-4">
            <h2 className="text-xl font-heading font-bold mb-4">Change Status</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Change the reading status for {selectedIds.size} selected item(s)
            </p>
            
            <div className="space-y-2 mb-6">
              {Object.values(ReadingStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => setBulkStatus(status as ReadingStatus)}
                  className={cn(
                    "w-full px-4 py-3 text-left rounded-lg border transition-colors cursor-pointer",
                    bulkStatus === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 border-border/50 hover:bg-secondary"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkStatusModal(false)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkStatusChange}
                className="flex-1 cursor-pointer"
              >
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
