import { NotificationSettings } from '../types';

const NOTIFICATION_SETTINGS_KEY = 'dooftrack_notification_settings';
const LAST_ACTIVITY_KEY = 'dooftrack_last_activity';

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  reminderTime: '19:00',
  streakReminders: true,
  goalMilestones: true,
  continueReadingSuggestions: true,
};

// Get notification settings from localStorage
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Save notification settings
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Check if notifications are enabled
export const areNotificationsEnabled = (): boolean => {
  if (!isNotificationSupported()) return false;
  return Notification.permission === 'granted';
};

// Show a notification
export const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
  if (!areNotificationsEnabled()) return;

  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  try {
    // Use Service Worker notification if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/logo-dark.png',
        badge: '/logo-dark.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/logo-dark.png',
        ...options,
      });
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

// Update last activity timestamp
export const updateLastActivity = (): void => {
  localStorage.setItem(LAST_ACTIVITY_KEY, new Date().toISOString());
};

// Get last activity timestamp
export const getLastActivity = (): Date | null => {
  try {
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
};

// Calculate reading streak (consecutive days with activity)
export const calculateReadingStreak = (activityDates: Date[]): number => {
  if (activityDates.length === 0) return 0;

  // Sort dates in descending order
  const sorted = activityDates.sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentDate = new Date(today);
  
  for (const date of sorted) {
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);
    
    if (activityDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (activityDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
};

// Check if user should get a reminder
export const shouldShowReminder = (): boolean => {
  const lastActivity = getLastActivity();
  if (!lastActivity) return true;
  
  const now = new Date();
  const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceActivity >= 1;
};

// Schedule daily reminder
export const scheduleDailyReminder = async (): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dailyReminder) return;
  
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const delay = scheduledTime.getTime() - now.getTime();
  
  setTimeout(async () => {
    if (shouldShowReminder()) {
      await showNotification('Time to Read!', {
        body: 'Continue your manhwa journey. Keep your reading streak alive!',
        tag: 'daily-reminder',
      });
    }
    // Reschedule for next day
    scheduleDailyReminder();
  }, delay);
};

// Show streak warning
export const showStreakWarning = async (daysInactive: number): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.streakReminders) return;
  
  await showNotification('Reading Streak at Risk!', {
    body: `You haven't read in ${daysInactive} days. Don't break your streak!`,
    tag: 'streak-warning',
  });
};

// Show goal milestone notification
export const showGoalMilestone = async (goalTitle: string, percentage: number): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.goalMilestones) return;
  
  await showNotification('Goal Progress! 🎯', {
    body: `${goalTitle} is ${percentage}% complete. Keep going!`,
    tag: 'goal-milestone',
  });
};

// Show achievement unlocked notification
export const showAchievementUnlocked = async (title: string, description: string, icon: string): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  
  await showNotification(`Achievement Unlocked! ${icon}`, {
    body: `${title}: ${description}`,
    tag: 'achievement',
  });
};

// Show continue reading suggestion
export const showContinueReadingSuggestion = async (manhwaTitle: string, lastChapter: number): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.continueReadingSuggestions) return;
  
  await showNotification('Continue Reading', {
    body: `Pick up where you left off: ${manhwaTitle} (Ch. ${lastChapter})`,
    tag: 'continue-reading',
  });
};

// Initialize notification system
export const initializeNotifications = async (): Promise<void> => {
  if (!isNotificationSupported()) return;
  
  const settings = getNotificationSettings();
  
  if (settings.enabled && areNotificationsEnabled()) {
    // Schedule daily reminder
    scheduleDailyReminder();
    
    // Check for streak warnings
    const lastActivity = getLastActivity();
    if (lastActivity) {
      const now = new Date();
      const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysInactive >= 2 && daysInactive <= 7) {
        showStreakWarning(daysInactive);
      }
    }
  }
};
