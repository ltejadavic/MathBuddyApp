"use client";

import React, { useState } from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';

interface UpcomingClass {
  id: string;
  date: string;
  time: string;
  teacher: string;
  course: string;
}

interface RecentSummary {
  id: string;
  date: string;
  course: string;
  notes: string;
}

interface StudentMetrics {
  remainingHours: number;
  upcomingClasses: UpcomingClass[];
  recentSummaries: RecentSummary[];
}

export default function StudentDashboardPage() {
  const [metrics] = useState<StudentMetrics>({
    remainingHours: 12.5,
    upcomingClasses: [
      { id: '1', date: '2026-08-05', time: '10:00 AM', teacher: 'Mr. Smith', course: 'SAT Math' },
    ],
    recentSummaries: [
      { id: '1', date: '2026-08-01', course: 'SAT Math', notes: 'Great progress on algebra.' },
    ],
  });

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Remaining Hours" 
          value={metrics.remainingHours} 
          description="Total hours available"
        />
        <StatCard 
          title="Upcoming Classes" 
          value={metrics.upcomingClasses.length} 
        />
        <StatCard 
          title="Recent Summaries" 
          value={metrics.recentSummaries.length} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-medium mb-4">Upcoming Classes</h3>
          <div className="space-y-4">
            {metrics.upcomingClasses.map((cls: UpcomingClass) => (
              <div key={cls.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold">{cls.course}</p>
                  <p className="text-sm text-muted-foreground">{cls.teacher}</p>
                </div>
                <div className="text-right">
                  <p>{cls.date}</p>
                  <p className="text-sm text-muted-foreground">{cls.time}</p>
                </div>
              </div>
            ))}
            {metrics.upcomingClasses.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming classes.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-medium mb-4">Recent Feedback</h3>
          <div className="space-y-4">
            {metrics.recentSummaries.map((summary: RecentSummary) => (
              <div key={summary.id} className="border-b pb-2">
                <div className="flex justify-between">
                  <p className="font-semibold">{summary.course}</p>
                  <p className="text-sm text-muted-foreground">{summary.date}</p>
                </div>
                <p className="text-sm mt-1">{summary.notes}</p>
              </div>
            ))}
            {metrics.recentSummaries.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent summaries.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
