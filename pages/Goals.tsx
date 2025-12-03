import React, { useEffect, useState } from 'react';
import { getReadingGoals, createReadingGoal, deleteReadingGoal, getAchievements, calculateGoalProgress, updateGoalProgress, checkAchievements } from '../services/store';
import { ReadingGoal, Achievement, GoalType, TargetType } from '../types';
import { Button, Card, cn } from '../components/Common';
import { Target, Trophy, Plus, Trash2, Calendar, BookOpen, TrendingUp, X } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'monthly' as GoalType,
    target_type: 'manhwa_count' as TargetType,
    target_value: 5,
  });
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [goalsData, achievementsData] = await Promise.all([
      getReadingGoals(),
      getAchievements(),
    ]);
    
    setGoals(goalsData);
    setAchievements(achievementsData);
    
    // Calculate progress for each goal
    const progressMap: Record<string, number> = {};
    for (const goal of goalsData) {
      const progress = await calculateGoalProgress(goal);
      progressMap[goal.id] = progress;
      
      // Update goal progress in database if changed
      if (progress !== goal.current_value) {
        const completed = progress >= goal.target_value;
        await updateGoalProgress(goal.id, progress, completed);
      }
    }
    setGoalProgress(progressMap);
    
    // Check for new achievements
    await checkAchievements();
    
    setLoading(false);
  };

  const handleCreateGoal = async () => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    if (newGoal.goal_type === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }
    
    const goal = await createReadingGoal({
      ...newGoal,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    
    if (goal) {
      setShowCreateModal(false);
      loadData();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const success = await deleteReadingGoal(goalId);
    if (success) {
      loadData();
    }
  };

  const getProgressPercentage = (goal: ReadingGoal): number => {
    const current = goalProgress[goal.id] || goal.current_value;
    return Math.min(100, Math.round((current / goal.target_value) * 100));
  };

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Reading Goals</h1>
          <p className="text-muted-foreground mt-2">Track your progress and unlock achievements</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <Target className="w-6 h-6" />
          Active Goals
        </h2>
        
        {goals.filter(g => !g.completed && new Date(g.end_date) >= new Date()).length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No active goals. Create one to start tracking!</p>
            <Button onClick={() => setShowCreateModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Create Goal
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {goals
              .filter(g => !g.completed && new Date(g.end_date) >= new Date())
              .map((goal) => {
                const progress = goalProgress[goal.id] || goal.current_value;
                const percentage = getProgressPercentage(goal);
                const daysRemaining = getDaysRemaining(goal.end_date);
                
                return (
                  <Card key={goal.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <h3 className="font-heading font-bold text-lg">
                            {goal.goal_type === 'monthly' ? 'Monthly' : goal.goal_type === 'yearly' ? 'Yearly' : 'Custom'} Goal
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {goal.target_type === 'manhwa_count' && `Add ${goal.target_value} manhwa`}
                          {goal.target_type === 'completed_count' && `Complete ${goal.target_value} manhwa`}
                          {goal.target_type === 'chapter_count' && `Read ${goal.target_value} chapters`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{progress} / {goal.target_value}</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500 rounded-full",
                            percentage >= 100 ? "bg-green-500" : percentage >= 75 ? "bg-blue-500" : percentage >= 50 ? "bg-yellow-500" : "bg-primary"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{daysRemaining} days remaining</span>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {goals.filter(g => g.completed).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-heading font-semibold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Completed Goals
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals
              .filter(g => g.completed)
              .map((goal) => (
                <Card key={goal.id} className="p-4 border-green-500/20 bg-green-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="font-medium text-sm">
                        {goal.target_value} {goal.target_type === 'manhwa_count' ? 'manhwa added' : goal.target_type === 'completed_count' ? 'manhwa completed' : 'chapters'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed {new Date(goal.end_date).toLocaleDateString()}
                  </p>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements
          <span className="text-base text-muted-foreground ml-2">({achievements.length} unlocked)</span>
        </h2>
        
        {achievements.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Start adding manhwa to unlock achievements!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="p-4 text-center space-y-2 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
                <div className="text-4xl">{achievement.icon}</div>
                <h3 className="font-heading font-bold text-sm">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(achievement.unlocked_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-6 bg-card border border-border rounded-lg shadow-2xl mx-4">
            <h2 className="text-2xl font-heading font-bold mb-6">Create New Goal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Goal Period
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly', 'yearly'] as GoalType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewGoal({ ...newGoal, goal_type: type })}
                      className={cn(
                        "px-4 py-2 rounded-lg border transition-colors capitalize",
                        newGoal.goal_type === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 border-border/50 hover:bg-secondary"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Goal Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setNewGoal({ ...newGoal, target_type: 'manhwa_count' })}
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors text-xs",
                      newGoal.target_type === 'manhwa_count'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 border-border/50 hover:bg-secondary"
                    )}
                  >
                    Add Manhwa
                  </button>
                  <button
                    onClick={() => setNewGoal({ ...newGoal, target_type: 'completed_count' })}
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors text-xs",
                      newGoal.target_type === 'completed_count'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 border-border/50 hover:bg-secondary"
                    )}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => setNewGoal({ ...newGoal, target_type: 'chapter_count' })}
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors text-xs",
                      newGoal.target_type === 'chapter_count'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 border-border/50 hover:bg-secondary"
                    )}
                  >
                    Chapters
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Target Value
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} className="flex-1">
                Create Goal
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
