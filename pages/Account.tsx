import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { 
  getUserProfile, 
  getUserStatistics, 
  getTopRated,
  updateUserPassword 
} from "../services/store";
import { UserProfile, UserStats, ManhwaItem } from "../types";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { Card, Badge, Button } from "../components/Common";
import { 
  User, 
  BookOpen, 
  BookCheck, 
  FileText, 
  Star, 
  TrendingUp,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  AlertTriangle
} from "lucide-react";

export default function Account() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [topRated, setTopRated] = useState<ManhwaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Theme state for mobile
  const [isDark, setIsDark] = useState(true);
  
  // Sign out confirmation modal
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    loadAccountData();
    // Sync theme state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all data in parallel
      const [profileData, statsData, topRatedData] = await Promise.all([
        getUserProfile(user.id),
        getUserStatistics(user.id),
        getTopRated(user.id, 5)
      ]);

      setProfile(profileData);
      setStats(statsData);
      setTopRated(topRatedData);
    } catch (error) {
      console.error("Error loading account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    try {
      setPasswordLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await updateUserPassword(user.email!, currentPassword, newPassword);
      
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignOutModal(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-border/20 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-border/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="border border-border/50 rounded-lg p-6 bg-card/40">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:block">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              {/* Mobile: Username next to avatar */}
              <div className="sm:hidden">
                <h1 className="font-heading text-2xl font-bold">
                  {profile?.username || "User"}
                </h1>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* Desktop: Username below avatar */}
              <h1 className="hidden sm:block font-heading text-3xl font-bold mb-2">
                {profile?.username || "User"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mb-1">{profile?.email}</p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
            {/* Desktop only: Change Password button */}
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 
                       hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
          
          {/* Mobile: Change Password button below profile */}
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="sm:hidden w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border/50 
                     hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          {/* Password Change Form */}
          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-6 pt-6 border-t border-border/50">
              <h3 className="font-heading text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-border/50 
                               bg-background focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                               hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-border/50 
                               bg-background focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                               hover:text-foreground cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-border/50 
                               bg-background focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                               hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {passwordError && (
                  <div className="text-red-500 text-sm">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="text-green-500 text-sm">{passwordSuccess}</div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg 
                             hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="px-6 py-2 border border-border/50 rounded-lg 
                             hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Statistics Grid */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-4">Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Manhwa"
              value={stats?.totalManhwa || 0}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Currently Reading"
              value={stats?.currentlyReading || 0}
              icon={BookOpen}
              color="yellow"
            />
            <StatCard
              title="Completed"
              value={stats?.completed || 0}
              icon={BookCheck}
              color="green"
            />
            <StatCard
              title="Total Chapters"
              value={stats?.totalChapters || 0}
              icon={FileText}
              color="purple"
            />
            <StatCard
              title="Average Rating"
              value={stats?.averageRating || 0}
              icon={Star}
              color="orange"
              suffix="/10"
            />
            <StatCard
              title="Completion Rate"
              value={stats?.completionRate || 0}
              icon={TrendingUp}
              color="teal"
              suffix="%"
            />
          </div>
        </div>

        {/* Top Rated Manhwa */}
        {topRated.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-bold mb-4">Top Rated Manhwa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topRated.map((manhwa) => (
                <Link
                  key={manhwa.id}
                  to={`/manhwa/${manhwa.id}`}
                  className="group cursor-pointer"
                >
                  <Card className="h-full overflow-hidden border-border/50 bg-card/40 hover:bg-card/80 
                                 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                    <div className="relative aspect-[2/3]">
                      <img
                        src={manhwa.cover_url}
                        alt={manhwa.title}
                        loading="lazy"
                        decoding="async"
                        className="object-cover w-full h-full"
                      />
                      {manhwa.progress?.rating && manhwa.progress.rating > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className="bg-black/60 backdrop-blur-md text-white border-none 
                                     shadow-sm font-medium flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {manhwa.progress.rating}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-snug 
                                   group-hover:text-primary transition-colors font-heading">
                        {manhwa.title}
                      </h3>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section - Mobile only */}
        <div className="md:hidden">
          <h2 className="font-heading text-2xl font-bold mb-4">Settings</h2>
          <div className="border border-border/50 rounded-lg bg-card/40 divide-y divide-border/50">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span className="font-medium">Theme</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>
            
            {/* Sign Out */}
            <button
              onClick={() => setShowSignOutModal(true)}
              className="w-full flex items-center gap-3 p-4 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowSignOutModal(false)} 
          />
          <div className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-6 bg-card border border-border rounded-lg shadow-2xl mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                  Sign Out?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to sign out? You'll need to log in again to access your library.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSignOutModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
