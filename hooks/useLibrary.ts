import { useState, useEffect, useMemo } from 'react';
import { getLibrary, getRecentlyUpdated, removeFromLibrary, updateProgress } from '../services/store';
import { LibraryItem, ReadingStatus } from '../types';

export interface LibraryFilters {
  status: string;
  sortBy: 'title' | 'added' | 'updated' | 'rating';
  sortOrder: 'asc' | 'desc';
  ratingMin: number;
  ratingMax: number;
  dateFilter: 'all' | 'week' | 'month' | 'year';
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [recentItems, setRecentItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<LibraryFilters>({
    status: 'ALL',
    sortBy: 'updated',
    sortOrder: 'desc',
    ratingMin: 0,
    ratingMax: 10,
    dateFilter: 'all'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [libData, recentData] = await Promise.all([
        getLibrary(),
        getRecentlyUpdated(10)
      ]);
      
      setItems(libData);
      setRecentItems(recentData);
    } catch (error) {
      console.error("Failed to load library data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshLibrary = () => fetchData();

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Status filter
        if (filters.status !== 'ALL' && item.progress?.status !== filters.status) return false;
        
        // Rating filter
        const rating = item.progress?.rating || 0;
        if (rating < filters.ratingMin || rating > filters.ratingMax) return false;
        
        // Date filter
        if (filters.dateFilter !== 'all') {
          const now = new Date();
          const itemDate = new Date(item.created_at);
          const daysAgo = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (filters.dateFilter === 'week' && daysAgo > 7) return false;
          if (filters.dateFilter === 'month' && daysAgo > 30) return false;
          if (filters.dateFilter === 'year' && daysAgo > 365) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        let compareResult = 0;
        
        switch (filters.sortBy) {
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
        
        return filters.sortOrder === 'asc' ? compareResult : -compareResult;
      });
  }, [items, filters]);

  const stats = useMemo(() => ({
    total: items.length,
    reading: items.filter(i => i.progress?.status === ReadingStatus.READING).length,
    completed: items.filter(i => i.progress?.status === ReadingStatus.COMPLETED).length,
  }), [items]);

  const updateFilters = (newFilters: Partial<LibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    items,
    recentItems,
    filteredItems,
    loading,
    stats,
    filters,
    updateFilters,
    refreshLibrary
  };
}
