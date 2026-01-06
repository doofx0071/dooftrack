import React, { useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { removeFromLibrary, updateProgress } from '../services/store';
import { ReadingStatus } from '../types';
import Loader from '../components/Loader';
import { Button, cn } from '../components/Common';
import { LibraryHeader } from '../components/Library/LibraryHeader';
import { LibraryRecent } from '../components/Library/LibraryRecent';
import { BatchOperationsBar } from '../components/Library/BatchOperationsBar';
import { LibraryFilterBar } from '../components/Library/LibraryFilterBar';
import { LibraryGrid } from '../components/Library/LibraryGrid';

export default function Library() {
  const {
    items,
    recentItems,
    filteredItems,
    loading,
    stats,
    filters,
    updateFilters,
    refreshLibrary
  } = useLibrary();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Batch operations state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ReadingStatus>(ReadingStatus.READING);
  
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
        Array.from(selectedIds).map((id: string) => removeFromLibrary(id))
      );
      
      await refreshLibrary();
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
      
      await refreshLibrary();
      setSelectedIds(new Set());
      setShowBulkStatusModal(false);
      setSelectionMode(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update some items');
    }
  };

  const handleResetFilters = () => {
      updateFilters({
          ratingMin: 0,
          ratingMax: 10,
          dateFilter: 'all',
          sortBy: 'updated',
          sortOrder: 'desc'
      });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <LibraryHeader stats={stats} />
        
        {/* Batch Operations Bar */}
        {filteredItems.length > 0 && (
          <BatchOperationsBar 
             selectionMode={selectionMode}
             selectedCount={selectedIds.size}
             totalCount={filteredItems.length}
             onToggleMode={toggleSelectionMode}
             onSelectAll={selectAll}
             onDeselectAll={deselectAll}
             onChangeStatus={() => setShowBulkStatusModal(true)}
             onDelete={handleBulkDelete}
          />
        )}
      </div>

      {/* Recently Updated Section */}
      <LibraryRecent items={recentItems} />

      {/* Main Library List */}
      <div className="space-y-6">
        {/* Filter Bar */}
        <LibraryFilterBar 
            filter={filters.status}
            setFilter={(status) => updateFilters({ status })}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            updateFilters={updateFilters}
            resetFilters={handleResetFilters}
        />

        {/* Library Content */}
        <LibraryGrid 
            items={filteredItems}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
        />
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
