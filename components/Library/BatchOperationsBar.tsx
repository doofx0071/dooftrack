import React from 'react';
import { Button } from '../Common';
import { X, CheckSquare, Edit3, Trash2 } from 'lucide-react';

interface BatchOperationsBarProps {
  selectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
}

export const BatchOperationsBar: React.FC<BatchOperationsBarProps> = ({
  selectionMode,
  selectedCount,
  totalCount,
  onToggleMode,
  onSelectAll,
  onDeselectAll,
  onChangeStatus,
  onDelete
}) => {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant={selectionMode ? "default" : "outline"}
        onClick={onToggleMode}
        className="gap-2 cursor-pointer"
      >
        {selectionMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
        {selectionMode ? 'Cancel Selection' : 'Select Items'}
      </Button>
      
      {selectionMode && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={selectedCount === totalCount}
            className="cursor-pointer"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            className="cursor-pointer"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeStatus}
            disabled={selectedCount === 0}
            className="gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Change Status
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={selectedCount === 0}
            className="gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};
