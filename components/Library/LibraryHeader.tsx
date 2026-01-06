import React from 'react';
import { BookOpen, Star } from 'lucide-react';

interface LibraryStatsProps {
  total: number;
  reading: number;
  completed: number;
}

export const LibraryHeader: React.FC<{ stats: LibraryStatsProps }> = ({ stats }) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">My Library</h1>
        <p className="text-muted-foreground mt-1 text-base">
          Track your reading progress across <span className="text-foreground font-medium">{stats.total}</span> titles.
        </p>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-md">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium">{stats.reading} Reading</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-md">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">{stats.completed} Completed</span>
        </div>
      </div>
    </div>
  );
};
