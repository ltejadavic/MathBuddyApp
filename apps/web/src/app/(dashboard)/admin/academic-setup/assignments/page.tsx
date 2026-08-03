"use client";

import { useState } from "react";
import { useAllUsers } from "@/hooks/use-admin-data";
import { useAllPrograms, useAssignTeacher, useRemoveTeacherAssignment } from "@/hooks/use-academic-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TeacherAssignmentsPage() {
  const { data: users = [], isLoading: loadingUsers } = useAllUsers();
  const { data: programs = [], isLoading: loadingPrograms } = useAllPrograms();
  const assignTeacher = useAssignTeacher();
  const removeTeacher = useRemoveTeacherAssignment();

  const [searchQuery, setSearchQuery] = useState("");

  const teachers = users.filter((u: any) => u.role === "TEACHER");
  
  const filteredTeachers = teachers.filter((t: any) => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAssignment = async (teacher: any, courseId: string, isAssigned: boolean) => {
    const profileId = teacher.teacherProfile?.id;
    if (!profileId) return;
    
    if (isAssigned) {
      await assignTeacher.mutateAsync({ courseId, teacherId: profileId });
    } else {
      await removeTeacher.mutateAsync({ courseId, teacherId: profileId });
    }
  };

  if (loadingUsers || loadingPrograms) return <div>Loading data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Teacher Assignments
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Assign teachers to specific courses. Teachers will only be matched for courses they are assigned to.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl">
                <UserCheck className="w-5 h-5 mr-2 text-brand-cyan" />
                Assign Courses
              </CardTitle>
              <CardDescription>Select courses for each teacher.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search teachers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {filteredTeachers.map((teacher: any) => {
              // Extract course IDs the teacher is currently assigned to
              // The backend User object has teacherProfile.courses
              const assignedCourseIds = teacher.teacherProfile?.courses?.map((c: any) => c.courseId) || [];

              return (
                <div key={teacher.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                    <Badge variant="outline" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20">
                      {assignedCourseIds.length} Assigned
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.map((program: any) => (
                      <div key={program.id} className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                          {program.name}
                        </h4>
                        {program.courses?.length === 0 && (
                          <p className="text-xs text-gray-400 italic px-2">No courses.</p>
                        )}
                        <div className="space-y-2 px-2">
                          {program.courses?.map((course: any) => {
                            const isAssigned = assignedCourseIds.includes(course.id);
                            return (
                              <div key={course.id} className="flex items-center space-x-2">
                                <input 
                                  type="checkbox"
                                  id={`teacher-${teacher.id}-course-${course.id}`} 
                                  checked={isAssigned}
                                  onChange={(e) => handleToggleAssignment(teacher, course.id, e.target.checked)}
                                  className="w-4 h-4 text-brand-cyan rounded border-gray-300 focus:ring-brand-cyan"
                                />
                                <label 
                                  htmlFor={`teacher-${teacher.id}-course-${course.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {course.name}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {filteredTeachers.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No teachers found matching "{searchQuery}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
