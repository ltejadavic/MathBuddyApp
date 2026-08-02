"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { useAllPrograms, useAllCourses } from "@/hooks/use-admin-data";

export default function AdminAcademicPage() {
  const { data: programs, isLoading: isLoadingPrograms } = useAllPrograms();
  const { data: courses, isLoading: isLoadingCourses } = useAllCourses();

  // Basic aggregation for MVP
  const programList = programs || [];
  const courseList = courses || [];

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
            {isLoadingPrograms ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programList.map((prog: any) => (
                  <TableRow key={prog.id}>
                    <TableCell className="font-medium">{prog.name}</TableCell>
                    <TableCell>{prog.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
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
            {isLoadingCourses ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Program</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseList.map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.program?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
