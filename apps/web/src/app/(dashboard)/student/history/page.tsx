"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useMySessions } from "@/hooks/use-student-data";
import { format } from "date-fns";

export default function StudentHistoryPage() {
  const { data: sessions, isLoading } = useMySessions();

  const upcomingClasses = sessions?.filter((s: any) => new Date(s.scheduledStartTime) >= new Date()) || [];
  const pastClasses = sessions?.filter((s: any) => s.status === 'COMPLETED') || [];

  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Class History & Links
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Access your meeting links and review past feedback.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2 text-brand-cyan" />
            Upcoming Class Links
          </CardTitle>
          <CardDescription>Secure links for your scheduled sessions. Only visible to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.length === 0 && <p className="text-sm text-muted-foreground p-4">No upcoming classes with links available.</p>}
            {upcomingClasses.map((cls: any) => (
              <div key={cls.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">{cls.course?.name || "Class"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(cls.scheduledStartTime), "MMM d, h:mm a")} - {cls.teacher?.user?.firstName || "Teacher"}</p>
                </div>
                {cls.meetingLink && (
                  <Button variant="default" size="sm" className="bg-brand-cyan hover:bg-brand-cyan/90 text-white rounded-xl" render={<a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                    Join <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Past Sessions History</CardTitle>
          <CardDescription>Review your topics, scores, and teacher notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Topics Covered</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Teacher Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastClasses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No past sessions found.</TableCell>
                  </TableRow>
                )}
                {pastClasses.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{format(new Date(cls.scheduledStartTime), "MMM d, yyyy")}</TableCell>
                    <TableCell>{cls.course?.name || "Class"}</TableCell>
                    <TableCell>{cls.notes ? "Covered" : "N/A"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        --
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cls.notes || "No notes provided"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-4">
            {pastClasses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No past sessions found.</p>}
            {pastClasses.map((cls: any) => (
              <div key={cls.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{cls.course?.name || "Class"}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(cls.scheduledStartTime), "MMM d, yyyy")}</span>
                </div>
                <div className="text-sm"><span className="font-medium">Topics:</span> {cls.notes ? "Covered" : "N/A"}</div>
                <div className="text-sm"><span className="font-medium">Score:</span> --</div>
                <div className="text-sm"><span className="font-medium">Notes:</span> {cls.notes || "No notes"}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
