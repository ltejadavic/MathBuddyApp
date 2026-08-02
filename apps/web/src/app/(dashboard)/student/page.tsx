"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar as CalendarIcon, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMyProfile, useMySessions } from "@/hooks/use-student-data";
import { format } from "date-fns";

export default function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const { data: sessions, isLoading: isLoadingSessions } = useMySessions();

  if (isLoadingProfile || isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  const studentProfile = profile?.studentProfile;
  const remainingHours = studentProfile?.remainingMinutes ? (studentProfile.remainingMinutes / 60).toFixed(1) : "0.0";
  
  const upcomingClasses = sessions?.filter((s: any) => new Date(s.scheduledStartTime) >= new Date()).slice(0, 3) || [];
  const completedClasses = sessions?.filter((s: any) => s.status === 'COMPLETED') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white capitalize">
            Welcome back, {profile?.firstName || user?.email?.split("@")[0]}!
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Here&apos;s an overview of your academic progress and upcoming schedule.
          </p>
        </div>
        <Button render={<Link href="/student/schedule" />} nativeButton={false} className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan/90 text-white rounded-xl">
          Book a Class
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Hours</CardTitle>
            <Clock className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingHours} hrs</div>
            <p className="text-xs text-muted-foreground">
              From your active packages
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses.length + completedClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              1 completed, 2 upcoming
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              SAT Math, IB Physics
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <GraduationCap className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Based on recent evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 flex-1">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>
              Your schedule for the next few days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming classes scheduled.</p>
              ) : (
                upcomingClasses.map((cls: any) => {
                  const durationMins = (new Date(cls.scheduledEndTime).getTime() - new Date(cls.scheduledStartTime).getTime()) / 60000;
                  return (
                    <div key={cls.id} className="flex items-start justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{cls.course?.name || "Class"}</p>
                        <p className="text-sm text-muted-foreground">with {cls.teacher?.user?.firstName || "Teacher"}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium text-brand-cyan">{format(new Date(cls.scheduledStartTime), "MMM d, h:mm a")}</p>
                        <p className="text-xs text-muted-foreground">{durationMins / 60} hr{durationMins > 60 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl" render={<Link href="/student/schedule" />} nativeButton={false}>
              View Full Schedule
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 flex-1">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>
              Notes from your teachers.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">SAT Math</span>
                    <span className="text-xs text-muted-foreground">Yesterday</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    &quot;Great job on the algebra section today. Please review the quadratic equations worksheet for next class.&quot;
                  </p>
                </div>
             </div>
             <Button variant="outline" className="w-full mt-4 rounded-xl" render={<Link href="/student/history" />} nativeButton={false}>
              View Full History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
