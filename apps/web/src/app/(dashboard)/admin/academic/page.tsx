"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, BookOpen } from "lucide-react";

export default function AdminAcademicPage() {
  const programs = [
    { id: 1, name: "SAT Preparation", courses: 2, status: "Active" },
    { id: 2, name: "IB Diploma", courses: 5, status: "Active" },
    { id: 3, name: "University Level", courses: 3, status: "Active" },
  ];

  const teacherAssignments = [
    { id: 1, teacher: "Mr. Davis", courses: ["SAT Math Prep", "IB Physics"] },
    { id: 2, teacher: "Ms. Robinson", courses: ["SAT Verbal", "IB English"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Academic Setup
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage programs, courses, and teacher assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs */}
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Academic Programs</CardTitle>
              <CardDescription>High-level programs offered.</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add Program
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((prog) => (
                  <TableRow key={prog.id}>
                    <TableCell className="font-medium">{prog.name}</TableCell>
                    <TableCell>{prog.courses}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {prog.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Teacher Assignments */}
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Teacher Assignments</CardTitle>
              <CardDescription>Assign courses to authorized teachers.</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              <BookOpen className="w-4 h-4 mr-2" /> Assign Course
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Authorized Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.teacher}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignment.courses.map(course => (
                          <span key={course} className="text-xs px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded-md">
                            {course}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
