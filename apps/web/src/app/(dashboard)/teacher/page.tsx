"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';

export default function TeacherDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Mocked data for MVP
    setMetrics({
      pendingEarningsCents: 15000,
      totalEarningsCents: 450000,
      upcomingClasses: [
        { id: '1', date: '2026-08-05', time: '10:00 AM', student: 'John Doe', course: 'SAT Math' },
        { id: '2', date: '2026-08-06', time: '02:00 PM', student: 'Jane Smith', course: 'IB Physics' },
      ],
    });
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Pending Earnings" 
          value={`$${(metrics.pendingEarningsCents / 100).toFixed(2)}`} 
          description="Ready for next payout"
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${(metrics.totalEarningsCents / 100).toFixed(2)}`} 
          description="Lifetime earnings"
        />
        <StatCard 
          title="Upcoming Classes" 
          value={metrics.upcomingClasses.length} 
          description="Next 7 days"
        />
      </div>

      <div className="mt-8 rounded-xl border bg-card text-card-foreground shadow p-6">
        <h3 className="text-lg font-medium mb-4">Upcoming Classes</h3>
        <div className="space-y-4">
          {metrics.upcomingClasses.map((cls: any) => (
            <div key={cls.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{cls.course}</p>
                <p className="text-sm text-muted-foreground">{cls.student}</p>
              </div>
              <div className="text-right">
                <p>{cls.date}</p>
                <p className="text-sm text-muted-foreground">{cls.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
