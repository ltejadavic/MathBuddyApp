"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentHistoryPage() {
  // Mock data
  const upcomingClasses = [
    { id: 1, course: "SAT Math Prep", teacher: "Mr. Smith", date: "Today, 4:00 PM", link: "https://zoom.us/j/123456789" },
    { id: 2, course: "IB Physics", teacher: "Ms. Johnson", date: "Tomorrow, 5:30 PM", link: "https://meet.google.com/abc-defg-hij" }
  ];

  const pastClasses = [
    { id: 3, course: "SAT Math Prep", date: "Aug 1, 2026", topics: "Quadratic Equations", score: "95%", notes: "Excellent progress." },
    { id: 4, course: "IB Physics", date: "Jul 28, 2026", topics: "Kinematics", score: "88%", notes: "Review projectile motion." },
    { id: 5, course: "Calculus", date: "Jul 25, 2026", topics: "Derivatives", score: "92%", notes: "Good grasp of chain rule." },
  ];

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
            {upcomingClasses.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">{cls.course}</p>
                  <p className="text-xs text-muted-foreground">{cls.date} - {cls.teacher}</p>
                </div>
                <Button variant="default" size="sm" className="bg-brand-cyan hover:bg-brand-cyan/90 text-white rounded-xl" render={<a href={cls.link} target="_blank" rel="noopener noreferrer" />}>
                  Join <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
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
                {pastClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.date}</TableCell>
                    <TableCell>{cls.course}</TableCell>
                    <TableCell>{cls.topics}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {cls.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cls.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-4">
            {pastClasses.map((cls) => (
              <div key={cls.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{cls.course}</span>
                  <span className="text-xs text-muted-foreground">{cls.date}</span>
                </div>
                <div className="text-sm"><span className="font-medium">Topics:</span> {cls.topics}</div>
                <div className="text-sm"><span className="font-medium">Score:</span> {cls.score}</div>
                <div className="text-sm"><span className="font-medium">Notes:</span> {cls.notes}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
