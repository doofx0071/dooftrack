import { Manhwa, ReadingStatus, UserProgress, LibraryItem, UserProfile, UserStats } from '../types';
import { supabase } from './supabase';

// Replace uploads.mangadex.org cover URLs with our proxy in production
const proxifyCoverUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    if (typeof window !== 'undefined' && !location.hostname.includes('localhost')) {
      return url.replace('https://uploads.mangadex.org/covers', '/api/cover');
    }
    return url;
  } catch {
    return url || '';
  }
};

// Cache user ID to avoid repeated slow auth calls
let cachedUserId: string | null = null;
let userIdPromise: Promise<string | null> | null = null;

// Get current authenticated user ID with caching
const getUserId = async (): Promise<string | null> => {
  // Return cached value if available
  if (cachedUserId) {
    return cachedUserId;
  }
  
  // Reuse in-flight promise if one exists
  if (userIdPromise) {
    return userIdPromise;
  }
  
  // Create new promise and cache it
  userIdPromise = (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    cachedUserId = user?.id || null;
    userIdPromise = null; // Clear promise after resolution
    return cachedUserId;
  })();
  
  return userIdPromise;
};

// Clear cache on auth state changes
supabase.auth.onAuthStateChange(() => {
  cachedUserId = null;
  userIdPromise = null;
});

export const getLibrary = async (): Promise<LibraryItem[]> => {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    // Fetch manhwa with their progress in a single query
    const { data: manhwaList, error } = await supabase
      .from('manhwa')
      .select(`
        *,
        reading_progress (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching library:', error);
      return [];
    }

    // Transform to LibraryItem format
    return (manhwaList || []).map((m: any) => {
      // Handle both array and object formats from Supabase
      let progressData = null;
      if (m.reading_progress) {
        if (Array.isArray(m.reading_progress) && m.reading_progress.length > 0) {
          progressData = m.reading_progress[0];
        } else if (typeof m.reading_progress === 'object' && m.reading_progress.id) {
          progressData = m.reading_progress;
        }
      }
      
      return {
        id: m.id,
        title: m.title,
        cover_url: proxifyCoverUrl(m.cover_url) || '',
        description: m.description || '',
        source_id: m.source_id,
        created_at: m.created_at,
        lastChapter: m.last_chapter || undefined,
        progress: progressData ? {
          id: progressData.id,
          manhwa_id: m.id,
          status: progressData.status as ReadingStatus,
          last_chapter: progressData.last_chapter,
          rating: progressData.rating,
          notes: progressData.notes || '',
          updated_at: progressData.updated_at
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error in getLibrary:', error);
    return [];
  }
};

export const getRecentlyUpdated = async (limit: number = 10): Promise<LibraryItem[]> => {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    // Fixed: Filter by user_id via manhwa relationship to only get current user's data
    const { data: progressList, error } = await supabase
      .from('reading_progress')
      .select(`
        *,
        manhwa!inner (*)
      `)
      .eq('manhwa.user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent updates:', error);
      return [];
    }

    // Transform to LibraryItem format
    return (progressList || []).map((p: any) => ({
      id: p.manhwa.id,
      title: p.manhwa.title,
      cover_url: proxifyCoverUrl(p.manhwa.cover_url) || '',
      description: p.manhwa.description || '',
      source_id: p.manhwa.source_id,
      created_at: p.manhwa.created_at,
      lastChapter: p.manhwa.last_chapter || undefined,
      progress: {
        id: p.id,
        manhwa_id: p.manhwa_id,
        status: p.status as ReadingStatus,
        last_chapter: p.last_chapter,
        rating: p.rating,
        notes: p.notes || '',
        updated_at: p.updated_at
      }
    }));
  } catch (error) {
    console.error('Error in getRecentlyUpdated:', error);
    return [];
  }
};

export const isInLibrary = async (userId: string, sourceId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('manhwa')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', sourceId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking if in library:', error);
    return false;
  }
};

// Returns the database ID of the manhwa after adding
export const addToLibrary = async (manhwa: Manhwa, status: ReadingStatus = ReadingStatus.PLAN_TO_READ): Promise<string> => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    // Insert or update manhwa
    const { data: existingManhwa } = await supabase
      .from('manhwa')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', manhwa.source_id)
      .maybeSingle();

    let manhwaId: string;

    if (existingManhwa) {
      manhwaId = (existingManhwa as any).id;
    } else {
      // Insert new manhwa
      const { data: newManhwa, error: insertError } = await supabase
        .from('manhwa')
        .insert({
          user_id: userId,
          source_id: manhwa.source_id,
          title: manhwa.title,
          cover_url: manhwa.cover_url,
          description: manhwa.description,
          last_chapter: (manhwa as any).lastChapter || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting manhwa:', insertError);
        throw insertError;
      }

      manhwaId = (newManhwa as any).id;
    }

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('reading_progress')
      .select('id')
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (!existingProgress) {
      // Insert progress
      const { error: progressError } = await supabase
        .from('reading_progress')
        .insert({
          manhwa_id: manhwaId,
          status: status,
          last_chapter: 0,
          rating: 0,
          notes: ''
        });

      if (progressError) {
        console.error('Error inserting progress:', progressError);
        throw progressError;
      }
    }
    
    return manhwaId;
  } catch (error) {
    console.error('Error in addToLibrary:', error);
    throw error;
  }
};

// Get manhwa by source_id (MangaDex ID) - returns database ID if found
export const getManhwaIdBySourceId = async (sourceId: string): Promise<string | null> => {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const { data } = await supabase
      .from('manhwa')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', sourceId)
      .maybeSingle();

    return data ? (data as any).id : null;
  } catch (error) {
    console.error('Error getting manhwa by source_id:', error);
    return null;
  }
};

export const updateProgress = async (manhwaId: string, updates: Partial<UserProgress>): Promise<UserProgress | null> => {
  try {
    // Use upsert for better performance - single query instead of select + insert/update
    const { data: progress, error } = await supabase
      .from('reading_progress')
      .upsert({
        manhwa_id: manhwaId,
        status: updates.status || 'Plan to Read',
        last_chapter: updates.last_chapter ?? 0,
        rating: updates.rating ?? 0,
        notes: updates.notes ?? ''
      }, {
        onConflict: 'manhwa_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error || !progress) {
      console.error('Error upserting progress:', error);
      return null;
    }

    const p = progress as any;
    return {
      id: p.id,
      manhwa_id: p.manhwa_id,
      status: p.status as ReadingStatus,
      last_chapter: p.last_chapter,
      rating: p.rating,
      notes: p.notes || '',
      updated_at: p.updated_at
    };
  } catch (error) {
    console.error('Error in updateProgress:', error);
    return null;
  }
};

export const getManhwaDetails = async (id: string): Promise<LibraryItem | null> => {
  try {
    // Use maybeSingle() to gracefully handle when manhwa doesn't exist
    const { data: manhwa, error } = await supabase
      .from('manhwa')
      .select(`
        *,
        reading_progress (*)
      `)
      .eq('id', id)
      .maybeSingle();

    // No error logging for "not found" - this is expected for preview mode
    if (error) {
      console.error('Error fetching manhwa details:', error);
      return null;
    }
    
    if (!manhwa) {
      return null;
    }

    const m: any = manhwa;
    
    // Handle both array and object formats from Supabase
    let progressData = null;
    if (m.reading_progress) {
      if (Array.isArray(m.reading_progress) && m.reading_progress.length > 0) {
        progressData = m.reading_progress[0];
      } else if (typeof m.reading_progress === 'object' && m.reading_progress.id) {
        progressData = m.reading_progress;
      }
    }
    
    return {
      id: m.id,
      title: m.title,
      cover_url: proxifyCoverUrl(m.cover_url) || '',
      description: m.description || '',
      source_id: m.source_id,
      created_at: m.created_at,
      lastChapter: m.last_chapter || undefined,
      progress: progressData ? {
        id: progressData.id,
        manhwa_id: m.id,
        status: progressData.status as ReadingStatus,
        last_chapter: progressData.last_chapter,
        rating: progressData.rating,
        notes: progressData.notes || '',
        updated_at: progressData.updated_at
      } : undefined
    };
  } catch (error) {
    console.error('Error in getManhwaDetails:', error);
    return null;
  }
};

export const removeFromLibrary = async (id: string): Promise<void> => {
  try {
    // Delete progress first (will cascade due to foreign key)
    const { error: progressError } = await supabase
      .from('reading_progress')
      .delete()
      .eq('manhwa_id', id);

    if (progressError) {
      console.error('Error deleting progress:', progressError);
    }

    // Delete manhwa
    const { error: manhwaError} = await supabase
      .from('manhwa')
      .delete()
      .eq('id', id);

    if (manhwaError) {
      console.error('Error deleting manhwa:', manhwaError);
      throw manhwaError;
    }
  } catch (error) {
    console.error('Error in removeFromLibrary:', error);
    throw error;
  }
};

// Account Page Functions

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
      created_at: user.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const getUserStatistics = async (): Promise<UserStats> => {
  try {
    const library = await getLibrary();
    
    const totalManhwa = library.length;
    const currentlyReading = library.filter(item => item.progress?.status === ReadingStatus.READING).length;
    const completed = library.filter(item => item.progress?.status === ReadingStatus.COMPLETED).length;
    
    // Calculate total chapters read
    const totalChapters = library.reduce((sum, item) => {
      return sum + (item.progress?.last_chapter || 0);
    }, 0);
    
    // Calculate average rating (exclude 0 ratings)
    const ratedItems = library.filter(item => (item.progress?.rating || 0) > 0);
    const averageRating = ratedItems.length > 0
      ? ratedItems.reduce((sum, item) => sum + (item.progress?.rating || 0), 0) / ratedItems.length
      : 0;
    
    // Calculate completion rate
    const completionRate = totalManhwa > 0 ? (completed / totalManhwa) * 100 : 0;
    
    // Calculate days active
    const profile = await getUserProfile();
    const daysActive = profile 
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      totalManhwa,
      currentlyReading,
      completed,
      totalChapters,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      completionRate: Math.round(completionRate),
      daysActive
    };
  } catch (error) {
    console.error('Error calculating user statistics:', error);
    return {
      totalManhwa: 0,
      currentlyReading: 0,
      completed: 0,
      totalChapters: 0,
      averageRating: 0,
      completionRate: 0,
      daysActive: 0
    };
  }
};

export const getTopRated = async (limit: number = 5): Promise<LibraryItem[]> => {
  try {
    const library = await getLibrary();
    
    // Filter items with ratings > 0, sort by rating descending
    return library
      .filter(item => (item.progress?.rating || 0) > 0)
      .sort((a, b) => (b.progress?.rating || 0) - (a.progress?.rating || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top rated:', error);
    return [];
  }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Attempt to sign in with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message || 'Failed to update password' };
  }
};
