/**
 * Session timeout detection
 * Tracks user activity and warns/logs out inactive users
 */

type SessionTimeoutCallback = () => void;

export class SessionTimeout {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  
  // Configuration
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_BEFORE = 5 * 60 * 1000; // Warn 5 minutes before timeout
  
  private onWarning: SessionTimeoutCallback | null = null;
  private onTimeout: SessionTimeoutCallback | null = null;
  
  constructor(
    onWarning?: SessionTimeoutCallback,
    onTimeout?: SessionTimeoutCallback
  ) {
    this.onWarning = onWarning || null;
    this.onTimeout = onTimeout || null;
    this.startTracking();
  }
  
  /**
   * Start tracking user activity
   */
  private startTracking() {
    // Track various user activities
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity);
    });
    
    // Start initial timeout
    this.resetTimeout();
  }
  
  /**
   * Handle user activity
   */
  private handleActivity = () => {
    this.lastActivity = Date.now();
    this.resetTimeout();
  };
  
  /**
   * Reset the timeout timers
   */
  private resetTimeout() {
    // Clear existing timers
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
    
    // Set warning timer
    if (this.onWarning) {
      this.warningTimeoutId = setTimeout(() => {
        this.onWarning?.();
      }, this.IDLE_TIMEOUT - this.WARNING_BEFORE);
    }
    
    // Set logout timer
    if (this.onTimeout) {
      this.timeoutId = setTimeout(() => {
        this.onTimeout?.();
      }, this.IDLE_TIMEOUT);
    }
  }
  
  /**
   * Get remaining time until timeout
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.IDLE_TIMEOUT - elapsed);
  }
  
  /**
   * Reset activity (extend session)
   */
  resetActivity() {
    this.handleActivity();
  }
  
  /**
   * Stop tracking and cleanup
   */
  destroy() {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
    
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
  }
}
