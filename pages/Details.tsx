import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManhwaDetails, updateProgress, removeFromLibrary, addToLibrary, getManhwaIdBySourceId } from '../services/store';
import { LibraryItem, ReadingStatus, Manhwa } from '../types';
import { Button, Select, Card } from '../components/Common';
import { ArrowLeft, Trash2, Save, BookOpen, Clock, CheckCircle, Plus, Eye, Edit, Bold, Italic, List, Heading } from 'lucide-react';
import { getLastChapterNumber, getMangaById } from '../services/mangadex';
import { debounce } from '../utils/debounce';
import { sanitizeInput } from '../utils/sanitize';
import { buildOptimizedCoverUrl, IMAGE_PRESETS } from '../utils/imageOptimization';
import { SkeletonDetails } from '../components/SkeletonDetails';
import Recommendations from '../components/Recommendations';

export default function Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [totalChapters, setTotalChapters] = useState<number | null>(null);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [chapterInputValue, setChapterInputValue] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showNotesPreview, setShowNotesPreview] = useState(false);

  // Form State
  const [status, setStatus] = useState<ReadingStatus>(ReadingStatus.PLAN_TO_READ);
  const [chapter, setChapter] = useState(0);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  // Debounced auto-save (saves 2 seconds after user stops typing)
  const debouncedAutoSave = useCallback(
    debounce(async (id: string, status: ReadingStatus, chapter: number, rating: number, notes: string) => {
      if (!initialLoadDone) return; // Don't auto-save during initial load
      
      setAutoSaving(true);
      
      // Sanitize notes before saving
      const sanitizedNotes = sanitizeInput(notes);
      
      await updateProgress(id, {
        status,
        last_chapter: chapter,
        rating,
        notes: sanitizedNotes
      });
      
      setAutoSaving(false);
    }, 2000),
    [initialLoadDone]
  );

  useEffect(() => {
    if (!id) return;
    
    const loadManhwa = async () => {
      // First try to load from library (database ID)
      const libraryData = await getManhwaDetails(id);
      
      if (libraryData) {
        // Found in library
        setItem(libraryData);
        setIsInLibrary(true);
        if (libraryData.progress) {
          setStatus(libraryData.progress.status);
          setChapter(libraryData.progress.last_chapter);
          setRating(libraryData.progress.rating);
          setNotes(libraryData.progress.notes);
        }
        
        // Get total chapters
        if (libraryData.lastChapter) {
          setTotalChapters(libraryData.lastChapter);
        } else if (libraryData.source_id) {
          const lastChapter = await getLastChapterNumber(libraryData.source_id);
          if (lastChapter !== null) setTotalChapters(lastChapter);
        }
      } else {
        // Not in library - try loading from MangaDex (id is source_id)
        const mangaDexData = await getMangaById(id);
        
        if (mangaDexData) {
          // Create a temporary LibraryItem for preview
          setItem({
            id: mangaDexData.id, // This is the source_id
            title: mangaDexData.title,
            cover_url: mangaDexData.cover_url,
            description: mangaDexData.description,
            source_id: mangaDexData.source_id,
            created_at: mangaDexData.created_at || new Date().toISOString(),
            lastChapter: mangaDexData.lastChapter,
            progress: undefined // No progress yet
          });
          setIsInLibrary(false);
          
          // Get total chapters
          if (mangaDexData.lastChapter) {
            setTotalChapters(mangaDexData.lastChapter);
          } else {
            const lastChapter = await getLastChapterNumber(id);
            if (lastChapter !== null) setTotalChapters(lastChapter);
          }
        }
      }
      
      setLoading(false);
      setTimeout(() => setInitialLoadDone(true), 500);
    };
    
    loadManhwa();
  }, [id]);
  
  // Auto-update chapter to last chapter when status changes to Completed
  useEffect(() => {
    if (initialLoadDone && status === ReadingStatus.COMPLETED && totalChapters !== null && chapter < totalChapters) {
      setChapter(Math.floor(totalChapters));
    }
  }, [status, totalChapters, initialLoadDone]);

  // Auto-save when values change (only for items in library)
  useEffect(() => {
    if (id && initialLoadDone && isInLibrary && item) {
      debouncedAutoSave(item.id, status, chapter, rating, notes);
    }
  }, [status, chapter, rating, notes, id, initialLoadDone, debouncedAutoSave, isInLibrary, item]);

  const handleSave = async () => {
    if (!item || !isInLibrary) return;
    setSaving(true);
    setSaveSuccess(false);
    
    // Sanitize notes to prevent XSS attacks
    const sanitizedNotes = sanitizeInput(notes);
    
    await updateProgress(item.id, {
      status,
      last_chapter: chapter,
      rating,
      notes: sanitizedNotes
    });
    
    // Update local state with sanitized value
    setNotes(sanitizedNotes);
    
    setSaving(false);
    setSaveSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  const handleAddToLibrary = async () => {
    if (!item) return;
    setAddingToLibrary(true);
    
    try {
      const dbId = await addToLibrary({
        id: item.source_id,
        title: item.title,
        cover_url: item.cover_url,
        description: item.description,
        source_id: item.source_id,
        created_at: item.created_at,
        lastChapter: item.lastChapter || totalChapters || undefined
      });
      
      setIsInLibrary(true);
      // Navigate to the proper database ID URL
      navigate(`/manhwa/${dbId}`, { replace: true });
    } catch (error) {
      console.error('Error adding to library:', error);
    } finally {
      setAddingToLibrary(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !isInLibrary) return;
    await removeFromLibrary(item.id);
    setShowRemoveModal(false);
    navigate('/library');
  };

  const handleChapterChange = (delta: number) => {
    setChapter(prev => Math.max(0, prev + delta));
  };

  const handleChapterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string while typing
    setChapterInputValue(value);
    
    if (value === '') {
      return;
    }
    // Only allow numbers
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setChapter(numValue);
    }
  };

  const handleChapterBlur = () => {
    setIsEditingChapter(false);
    // If input is empty, reset to current chapter value
    if (chapterInputValue === '') {
      setChapterInputValue(chapter.toString());
    } else {
      // Parse and set the final value
      const numValue = parseInt(chapterInputValue, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setChapter(numValue);
      } else {
        // Invalid input, reset to current chapter
        setChapterInputValue(chapter.toString());
      }
    }
  };
  
  // Markdown formatting helpers
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    const newText = notes.substring(0, start) + before + selectedText + after + notes.substring(end);
    
    setNotes(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };
  
  // Simple markdown to HTML renderer
  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    
    return text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br />');
  };

  if (loading) {
    return <SkeletonDetails />;
  }
  
  if (!item) return <div className="p-20 text-center font-heading text-lg">Manhwa not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Back Button */}
      <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 font-medium" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </Button>

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        {/* Left Column: Cover & Quick Stats */}
        <div className="space-y-6">
          <div className="max-w-[200px] mx-auto md:max-w-none md:mx-0">
             <div className="aspect-[2/3] overflow-hidden shadow-2xl border border-border/50 relative">
               <img 
                 src={buildOptimizedCoverUrl(item.cover_url, IMAGE_PRESETS.detail)} 
                 alt={item.title} 
                 className="w-full h-full object-cover"
                 width="300"
                 height="450"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.onerror = null;
                   target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                 }}
               />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
             </div>
          </div>
          
          {isInLibrary && (
            <>
              <Card className="p-4 space-y-4 bg-secondary/20 border-border/50">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2 font-medium">
                       <Clock className="w-3 h-3" /> Last Updated
                    </span>
                    <span className="font-mono text-xs">{item.progress?.updated_at ? new Date(item.progress.updated_at).toLocaleDateString() : 'Never'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2 font-medium">
                       <BookOpen className="w-3 h-3" /> Source
                    </span>
                    <span className="text-xs font-mono bg-secondary px-2 py-0.5 font-bold">MangaDex</span>
                 </div>
              </Card>

              <Button variant="destructive" className="w-full font-medium" onClick={() => setShowRemoveModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Remove from Library
              </Button>
            </>
          )}
        </div>

        {/* Right Column: Details & Controls */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold leading-tight tracking-tight">{item.title}</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {item.description.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/---/g, '').trim()}
            </p>
          </div>

          {isInLibrary ? (
            <>
              <div className="h-px bg-border/50" />

              {/* Controls Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Status & Rating */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label htmlFor="reading-status" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reading Status</label>
                      <Select
                        id="reading-status"
                        value={status}
                        onChange={(val) => setStatus(val as ReadingStatus)}
                        options={Object.values(ReadingStatus).map(s => ({ value: s, label: s }))}
                        className="w-full font-medium"
                      />
                   </div>

                   <div className="space-y-2">
                      <label htmlFor="rating-slider" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rating (0-10)</label>
                      <div className="flex items-center gap-4">
                         <div className="relative flex-1">
                            <input
                               id="rating-slider"
                               name="rating"
                               type="range"
                               min="0"
                               max="10"
                               step="1"
                               value={rating}
                               onChange={(e) => setRating(Number(e.target.value))}
                               className="w-full h-2 bg-secondary appearance-none cursor-pointer accent-primary"
                               aria-label="Rating slider"
                            />
                         </div>
                         <span className="text-2xl font-heading font-bold w-12 text-right text-primary" aria-live="polite">{rating}</span>
                      </div>
                   </div>
                </div>

                {/* Chapter Progress */}
                <div className="space-y-2">
                   <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider" id="chapter-progress-label">Chapter Progress</div>
                   <div className="flex items-center gap-4 p-4 bg-secondary/20 border border-border/50" role="group" aria-labelledby="chapter-progress-label">
                      <Button variant="outline" size="icon" onClick={() => handleChapterChange(-1)} className="h-12 w-12 border-primary/20 hover:border-primary">
                         <span className="text-2xl font-light font-heading">-</span>
                      </Button>
                      <div className="flex-1 text-center cursor-pointer" onClick={() => {
                        if (!isEditingChapter) {
                          setIsEditingChapter(true);
                          setChapterInputValue(chapter.toString());
                        }
                      }}>
                         {isEditingChapter ? (
                            <input
                               id="chapter-input"
                               name="chapter"
                               type="text"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               value={chapterInputValue}
                               onChange={handleChapterInputChange}
                               onBlur={handleChapterBlur}
                               onFocus={(e) => e.target.select()}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   handleChapterBlur();
                                   e.currentTarget.blur();
                                 }
                               }}
                               autoFocus
                               aria-label="Chapter number input"
                               className="text-5xl font-heading font-bold tabular-nums tracking-tighter text-foreground bg-transparent border-none outline-none text-center w-full focus:ring-2 focus:ring-primary rounded px-2"
                            />
                         ) : (
                            <div className="text-5xl font-heading font-bold tabular-nums tracking-tighter text-foreground hover:text-primary transition-colors">
                               {chapter}
                            </div>
                         )}
                         <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">
                            {isEditingChapter ? 'Press Enter to Save' : totalChapters ? `Chapter Read / ${totalChapters}` : 'Chapter Read'}
                         </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleChapterChange(1)} className="h-12 w-12 border-primary/20 hover:border-primary">
                         <span className="text-2xl font-light font-heading">+</span>
                      </Button>
                   </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="notes-textarea" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Personal Notes
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {notes.length} characters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotesPreview(!showNotesPreview)}
                      className="h-7 px-2 gap-1"
                    >
                      {showNotesPreview ? (
                        <><Edit className="w-3 h-3" /> Edit</>
                      ) : (
                        <><Eye className="w-3 h-3" /> Preview</>
                      )}
                    </Button>
                  </div>
                </div>
                
                {!showNotesPreview && (
                  <>
                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1 bg-secondary/20 border border-border/50 rounded-lg">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        className="p-2 hover:bg-secondary rounded transition-colors cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        className="p-2 hover:bg-secondary rounded transition-colors cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('## ', '')}
                        className="p-2 hover:bg-secondary rounded transition-colors cursor-pointer"
                        title="Heading"
                      >
                        <Heading className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('- ', '')}
                        className="p-2 hover:bg-secondary rounded transition-colors cursor-pointer"
                        title="List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <div className="flex-1" />
                      <span className="text-xs text-muted-foreground px-2">Markdown supported</span>
                    </div>
                    
                    <textarea
                      id="notes-textarea"
                      name="notes"
                      className="flex min-h-[200px] w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
                      placeholder="Write your thoughts...\n\nMarkdown tips:\n**bold** *italic*\n## Heading\n- List item"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      aria-label="Personal notes"
                    />
                  </>
                )}
                
                {showNotesPreview && (
                  <div 
                    className="min-h-[200px] w-full border border-input bg-background px-3 py-2 text-sm rounded-lg"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) || '<p class="text-muted-foreground">No notes yet. Switch to edit mode to add your thoughts.</p>' }}
                  />
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-4 pt-4">
                {autoSaving && (
                  <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in slide-in-from-right-4 duration-200">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">Auto-saving...</span>
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-4 duration-300">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Progress saved successfully!</span>
                  </div>
                )}
                <Button 
                  size="lg" 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full md:w-auto px-8 font-bold tracking-wide cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Clock className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 w-4 h-4" />
                      Save Progress
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-px bg-border/50" />
              
              {/* Chapter Info for Non-Library Items */}
              {totalChapters !== null && (
                <Card className="p-6 bg-secondary/20 border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Chapters</div>
                        <div className="text-3xl font-heading font-bold text-foreground">{totalChapters}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Add to Library Section */}
              <div className="p-6 bg-secondary/20 border border-border/50 rounded-lg text-center">
                <p className="text-muted-foreground mb-4">
                  Add this manhwa to your library to track your reading progress.
                </p>
                <Button 
                  size="lg"
                  onClick={handleAddToLibrary}
                  disabled={addingToLibrary}
                  className="font-bold cursor-pointer"
                >
                  {addingToLibrary ? (
                    <><Clock className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Add to Library</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {item.source_id && <Recommendations mangaId={item.source_id} mangaTitle={item.title} limit={10} />}

      {/* Remove from Library Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-xl font-heading font-bold">Remove from Library</h2>
              </div>
              <p className="text-muted-foreground">
                Are you sure you want to remove <span className="font-medium text-foreground">"{item.title}"</span> from your library? This will delete all your progress and notes.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveModal(false)}
                  className="flex-1 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1 font-medium"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
