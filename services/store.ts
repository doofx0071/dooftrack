import { Manhwa, ReadingStatus, UserProgress, LibraryItem, UserProfile, UserStats, ReadingGoal, Achievement, GoalType, TargetType } from '../types';
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

/**
 * Quick action: Add to library and set status to Reading in one click
 * Returns the database ID of the manhwa after adding
 */
export const quickStartReading = async (manhwa: Manhwa): Promise<string> => {
  return addToLibrary(manhwa, ReadingStatus.READING);
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

/**
 * Export library data as JSON
 */
export const exportLibraryAsJSON = async (): Promise<Blob> => {
  const library = await getLibrary();
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    library
  };
  
  const json = JSON.stringify(exportData, null, 2);
  return new Blob([json], { type: 'application/json' });
};

/**
 * Export library data as CSV
 */
export const exportLibraryAsCSV = async (): Promise<Blob> => {
  const library = await getLibrary();
  
  // CSV headers
  const headers = ['Title', 'Status', 'Last Chapter', 'Rating', 'Notes', 'Source ID', 'Created At', 'Updated At'];
  
  // CSV rows
  const rows = library.map(item => [
    `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
    item.progress?.status || 'Plan to Read',
    item.progress?.last_chapter || 0,
    item.progress?.rating || 0,
    `"${(item.progress?.notes || '').replace(/"/g, '""')}"`,
    item.source_id,
    new Date(item.created_at).toLocaleDateString(),
    item.progress?.updated_at ? new Date(item.progress.updated_at).toLocaleDateString() : ''
  ].join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  return new Blob([csv], { type: 'text/csv' });
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

// Reading Goals Functions

export const getReadingGoals = async (): Promise<ReadingGoal[]> => {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReadingGoals:', error);
    return [];
  }
};

export const createReadingGoal = async (goal: Omit<ReadingGoal, 'id' | 'user_id' | 'current_value' | 'completed' | 'created_at'>): Promise<ReadingGoal | null> => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reading_goals')
      .insert({
        user_id: userId,
        goal_type: goal.goal_type,
        target_type: goal.target_type,
        target_value: goal.target_value,
        start_date: goal.start_date,
        end_date: goal.end_date
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createReadingGoal:', error);
    return null;
  }
};

export const updateGoalProgress = async (goalId: string, currentValue: number, completed: boolean = false): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reading_goals')
      .update({ current_value: currentValue, completed })
      .eq('id', goalId);

    if (error) {
      console.error('Error updating goal progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateGoalProgress:', error);
    return false;
  }
};

export const deleteReadingGoal = async (goalId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reading_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteReadingGoal:', error);
    return false;
  }
};

// Calculate current progress for a goal based on library data
export const calculateGoalProgress = async (goal: ReadingGoal): Promise<number> => {
  try {
    const library = await getLibrary();
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);

    if (goal.target_type === 'manhwa_count') {
      // Count manhwa added within the goal period
      return library.filter(item => {
        const createdAt = new Date(item.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      }).length;
    } else {
      // Count chapters read within the goal period
      return library.reduce((sum, item) => {
        if (item.progress) {
          const updatedAt = new Date(item.progress.updated_at);
          if (updatedAt >= startDate && updatedAt <= endDate) {
            return sum + item.progress.last_chapter;
          }
        }
        return sum;
      }, 0);
    }
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return 0;
  }
};

// Achievements Functions

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAchievements:', error);
    return [];
  }
};

export const unlockAchievement = async (achievement: Omit<Achievement, 'id' | 'user_id' | 'unlocked_at'>): Promise<Achievement | null> => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    // Check if achievement already exists
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', achievement.achievement_type)
      .maybeSingle();

    if (existing) {
      return null; // Already unlocked
    }

    const { data, error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_type: achievement.achievement_type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon
      })
      .select()
      .single();

    if (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in unlockAchievement:', error);
    return null;
  }
};

// Check and unlock achievements based on current stats
export const checkAchievements = async (): Promise<Achievement[]> => {
  const newAchievements: Achievement[] = [];
  
  try {
    const stats = await getUserStatistics();
    const library = await getLibrary();
    
    // Define achievement conditions
    const achievementChecks = [
      { type: 'first_manhwa', condition: stats.totalManhwa >= 1, title: 'First Steps', description: 'Added your first manhwa', icon: '📚' },
      { type: 'manhwa_10', condition: stats.totalManhwa >= 10, title: 'Collector', description: 'Added 10 manhwa to your library', icon: '📖' },
      { type: 'manhwa_50', condition: stats.totalManhwa >= 50, title: 'Enthusiast', description: 'Added 50 manhwa to your library', icon: '🌟' },
      { type: 'manhwa_100', condition: stats.totalManhwa >= 100, title: 'Devotee', description: 'Added 100 manhwa to your library', icon: '🏆' },
      { type: 'chapters_100', condition: stats.totalChapters >= 100, title: 'Chapter Hunter', description: 'Read 100 chapters', icon: '📜' },
      { type: 'chapters_500', condition: stats.totalChapters >= 500, title: 'Marathon Reader', description: 'Read 500 chapters', icon: '🔥' },
      { type: 'chapters_1000', condition: stats.totalChapters >= 1000, title: 'Legendary Reader', description: 'Read 1000 chapters', icon: '👑' },
      { type: 'perfect_10', condition: library.some(item => item.progress?.rating === 10), title: 'Perfectionist', description: 'Gave a perfect 10 rating', icon: '⭐' },
      { type: 'completed_10', condition: stats.completed >= 10, title: 'Finisher', description: 'Completed 10 manhwa', icon: '✅' },
    ];
    
    for (const check of achievementChecks) {
      if (check.condition) {
        const achievement = await unlockAchievement({
          achievement_type: check.type,
          title: check.title,
          description: check.description,
          icon: check.icon
        });
        
        if (achievement) {
          newAchievements.push(achievement);
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return newAchievements;
};
