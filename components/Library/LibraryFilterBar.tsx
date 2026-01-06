import React from 'react';
import { Button, cn } from '../Common';
import { Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { ReadingStatus } from '../../types';
import { LibraryFilters } from '../../hooks/useLibrary';

interface LibraryFilterBarProps {
  filter: string;
  setFilter: (status: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: LibraryFilters;
  updateFilters: (filters: Partial<LibraryFilters>) => void;
  resetFilters: () => void;
}

export const LibraryFilterBar: React.FC<LibraryFilterBarProps> = ({
  filter,
  setFilter,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  filters,
  updateFilters,
  resetFilters
}) => {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar flex-1 w-full md:w-auto">
          {['ALL', ...Object.values(ReadingStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors border cursor-pointer rounded-md",
                filter === status 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
              )}
            >
              {status === 'ALL' ? 'All Titles' : status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1 bg-secondary/30 border border-border/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50",
                viewMode === 'grid'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50",
                viewMode === 'list'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
              title="List View"
            >
              <List className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 cursor-pointer text-xs md:text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Filters'}</span>
          </Button>
        </div>
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
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="updated">Last Updated</option>
                  <option value="added">Date Added</option>
                  <option value="title">Title</option>
                  <option value="rating">Rating</option>
                </select>
                <button
                  onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-3 py-2 bg-background border border-input rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            
            {/* Rating Range */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rating {filters.ratingMin}-{filters.ratingMax}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={filters.ratingMin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateFilters({ ratingMin: Math.min(val, filters.ratingMax) });
                  }}
                  className="flex-1 h-2 bg-secondary appearance-none cursor-pointer accent-primary rounded-full"
                />
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={filters.ratingMax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateFilters({ ratingMax: Math.max(val, filters.ratingMin) });
                  }}
                  className="flex-1 h-2 bg-secondary appearance-none cursor-pointer accent-primary rounded-full"
                />
              </div>
            </div>
            
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Added</label>
              <select
                value={filters.dateFilter}
                onChange={(e) => updateFilters({ dateFilter: e.target.value as any })}
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
              onClick={resetFilters}
              className="cursor-pointer"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
