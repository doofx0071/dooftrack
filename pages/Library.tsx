import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLibrary, getRecentlyUpdated } from '../services/store';
import { LibraryItem, ReadingStatus } from '../types';
import { Card, Badge, cn } from '../components/Common';
import { BookOpen, Star, Clock } from 'lucide-react';

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [recentItems, setRecentItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

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

  const filteredItems = items.filter(item => 
    filter === 'ALL' ? true : item.progress?.status === filter
  );

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
                      src={item.cover_url} 
                      alt={item.title} 
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <p className="text-xs font-semibold text-white line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-gray-300 font-medium mt-0.5">Ch. {item.progress?.last_chapter}</p>
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
        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
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

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => (
            <Link to={`/manhwa/${item.id}`} key={item.id} className="group cursor-pointer">
              <Card className="h-full overflow-hidden border-border/50 bg-card/40 hover:bg-card/80 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[2/3]">
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-2 right-2">
                     <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-none shadow-sm font-medium">
                        Ch. {item.progress?.last_chapter || 0}
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
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors font-heading">
                    {item.title}
                  </h3>
                </div>
              </Card>
            </Link>
          ))}
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
    </div>
  );
}