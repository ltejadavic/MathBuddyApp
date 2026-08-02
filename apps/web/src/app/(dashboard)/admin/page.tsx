"use client";

import React, { useState } from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyRevenue {
  name: string;
  revenue: number;
}

interface AdminMetrics {
  totalRevenueCents: number;
  activeStudents: number;
  activeTeachers: number;
  totalHoursPurchased: number;
  monthlyRevenue: MonthlyRevenue[];
}

export default function AdminDashboardPage() {
  const [metrics] = useState<AdminMetrics>({
    totalRevenueCents: 1500000,
    activeStudents: 120,
    activeTeachers: 15,
    totalHoursPurchased: 500,
    monthlyRevenue: [
      { name: 'Jan', revenue: 4000 },
      { name: 'Feb', revenue: 3000 },
      { name: 'Mar', revenue: 2000 },
      { name: 'Apr', revenue: 2780 },
      { name: 'May', revenue: 1890 },
      { name: 'Jun', revenue: 2390 },
    ]
  });

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${(metrics.totalRevenueCents / 100).toFixed(2)}`} 
          description="All verified payments"
        />
        <StatCard 
          title="Active Students" 
          value={metrics.activeStudents} 
        />
        <StatCard 
          title="Active Teachers" 
          value={metrics.activeTeachers} 
        />
        <StatCard 
          title="Hours Transacted" 
          value={`${metrics.totalHoursPurchased} h`} 
          description="Total hours purchased"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyRevenue}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
