"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicProgramsPage from "../academic-setup/programs/page";
import TeacherAssignmentsPage from "../academic-setup/assignments/page";

export default function AdminAcademicPage() {
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

      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="programs">Academic Programs</TabsTrigger>
          <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <AcademicProgramsPage />
        </TabsContent>

        <TabsContent value="assignments">
          <TeacherAssignmentsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
