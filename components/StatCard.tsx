import React from 'react';
import { Card } from './Common';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  suffix?: string;
  color?: 'primary' | 'green' | 'yellow' | 'purple' | 'blue' | 'orange' | 'teal';
}

export function StatCard({ title, value, icon: Icon, subtitle, suffix, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-600 dark:text-green-400 bg-green-600/10',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-600/10',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-600/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-600/10',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-600/10',
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-600/10'
  };

  return (
    <Card className="p-6 border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-1">
            {value}{suffix}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
