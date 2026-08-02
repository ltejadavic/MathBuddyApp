"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, Clock, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const adminName = user?.email?.split("@")[0] || "Admin";

  const metrics = [
    { title: "Active Students", value: "142", icon: Users, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
    { title: "Active Teachers", value: "18", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Monthly Revenue", value: "$4,250", icon: DollarSign, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "Hours Consumed", value: "320h", icon: Clock, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  const revenueData = [
    { name: "Apr", revenue: 3200 },
    { name: "May", revenue: 3800 },
    { name: "Jun", revenue: 4100 },
    { name: "Jul", revenue: 4800 },
    { name: "Aug", revenue: 4250 },
  ];

  const recentActivity = [
    { id: 1, action: "Payment Registered", details: "$200 for Alice Smith (10 hours)", time: "10 mins ago" },
    { id: 2, action: "New Student", details: "Bob Johnson registered", time: "2 hours ago" },
    { id: 3, action: "Class Completed", details: "IB Physics (Bob Johnson & Mr. Davis)", time: "3 hours ago" },
    { id: 4, action: "System Update", details: "Terms and conditions updated", time: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Command Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Welcome back, {adminName}. Here is the platform overview for today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${metric.bg} ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Platform Revenue</CardTitle>
            <CardDescription>Monthly revenue trends for the last 5 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="revenue" fill="#00B9EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-1 rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-brand-cyan" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan mt-2"></div>
                    <div className="w-px h-full bg-gray-200 dark:bg-gray-800 mt-2 absolute top-4 bottom-[-1.5rem] left-[3px] last:hidden"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
