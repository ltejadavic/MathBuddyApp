"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, CalendarDays, ExternalLink, Video } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const teacherName = user?.email?.split("@")[0] || "Teacher";

  // Mock data
  const metrics = [
    { title: "Classes This Week", value: "12", icon: CalendarDays, color: "text-brand-cyan" },
    { title: "Total Students", value: "28", icon: Users, color: "text-green-500" },
    { title: "Pending Evaluations", value: "3", icon: BookOpen, color: "text-yellow-500" },
  ];

  const todaysClasses = [
    { id: 1, student: "Alice Smith", course: "SAT Math Prep", time: "4:00 PM - 5:30 PM", link: "https://zoom.us/j/123" },
    { id: 2, student: "Bob Johnson", course: "IB Physics", time: "6:00 PM - 7:00 PM", link: "https://zoom.us/j/456" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome back, {teacherName}!
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Here is your schedule and pending tasks for today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
              </div>
              <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-800/50 ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Classes */}
      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2 text-brand-cyan" />
            Today&apos;s Classes
          </CardTitle>
          <CardDescription>Your schedule for the rest of the day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todaysClasses.map((cls) => (
              <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg gap-4">
                <div>
                  <p className="font-semibold">{cls.course}</p>
                  <p className="text-sm text-muted-foreground">{cls.time} • Student: {cls.student}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" render={<Link href="/teacher/classes" />}>
                    Manage
                  </Button>
                  <Button size="sm" className="bg-brand-cyan hover:bg-brand-cyan/90 text-white" render={<a href={cls.link} target="_blank" rel="noopener noreferrer" />}>
                    Start Class <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
            
            {todaysClasses.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No classes scheduled for today.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
