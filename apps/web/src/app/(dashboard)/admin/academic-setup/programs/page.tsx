"use client";

import { useState } from "react";
import { useAllPrograms, useCreateProgram, useUpdateProgram, useDeleteProgram, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@/hooks/use-academic-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, BookOpen, Layers } from "lucide-react";

export default function AcademicProgramsPage() {
  const { data: programs = [], isLoading } = useAllPrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [courseFormData, setCourseFormData] = useState({ name: "", description: "" });

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram) {
      await updateProgram.mutateAsync({ id: selectedProgram.id, data: formData });
    } else {
      await createProgram.mutateAsync(formData);
    }
    setIsProgramModalOpen(false);
    setSelectedProgram(null);
    setFormData({ name: "", description: "" });
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourse) {
      await updateCourse.mutateAsync({ id: selectedCourse.id, data: courseFormData });
    } else {
      await createCourse.mutateAsync({ ...courseFormData, programId: selectedProgram.id });
    }
    setIsCourseModalOpen(false);
    setSelectedCourse(null);
    setSelectedProgram(null);
    setCourseFormData({ name: "", description: "" });
  };

  const openEditProgram = (program: any) => {
    setSelectedProgram(program);
    setFormData({ name: program.name, description: program.description || "" });
    setIsProgramModalOpen(true);
  };

  const openEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseFormData({ name: course.name, description: course.description || "" });
    setIsCourseModalOpen(true);
  };

  const openAddCourse = (program: any) => {
    setSelectedProgram(program);
    setSelectedCourse(null);
    setCourseFormData({ name: "", description: "" });
    setIsCourseModalOpen(true);
  };

  const handleDeleteProgram = async (id: string) => {
    if (confirm("Are you sure? This will hide the program and remove teacher assignments for all its courses.")) {
      await deleteProgram.mutateAsync(id);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure? This will hide the course and remove teacher assignments for it.")) {
      await deleteCourse.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading programs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Academic Programs
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage programs (e.g. IB, SAT) and their specific courses.
          </p>
        </div>
        <Button 
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
          onClick={() => {
            setIsProgramModalOpen(true);
            setSelectedProgram(null);
            setFormData({ name: "", description: "" });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
        <Dialog open={isProgramModalOpen} onOpenChange={(open) => {
          setIsProgramModalOpen(open);
          if (!open) {
            setSelectedProgram(null);
            setFormData({ name: "", description: "" });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. IB Mathematics" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
              </div>
              <Button type="submit" className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white" disabled={createProgram.isPending || updateProgram.isPending}>
                {createProgram.isPending || updateProgram.isPending ? "Saving..." : "Save Program"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {programs.map((program: any) => (
          <Card key={program.id} className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl border-b border-gray-100 dark:border-gray-800">
              <div>
                <CardTitle className="text-xl flex items-center text-brand-darkNavy dark:text-gray-100">
                  <Layers className="w-5 h-5 mr-2 text-brand-cyan" />
                  {program.name}
                </CardTitle>
                {program.description && <CardDescription className="mt-1">{program.description}</CardDescription>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditProgram(program)} className="h-8 w-8 p-0">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteProgram(program.id)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Courses</h4>
                <Button variant="outline" size="sm" onClick={() => openAddCourse(program)} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Course
                </Button>
              </div>

              {program.courses?.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-lg text-sm text-gray-500">
                  No courses added to this program yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.courses?.map((course: any) => (
                    <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">{course.name}</h5>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => openEditCourse(course)} className="h-6 w-6 p-0">
                            <Edit2 className="w-3 h-3 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)} className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {course.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {programs.length === 0 && (
          <div className="text-center p-12 border border-dashed rounded-xl text-gray-500 bg-gray-50 dark:bg-gray-800/50">
            No academic programs found. Create your first program to get started.
          </div>
        )}
      </div>

      <Dialog open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCourse ? "Edit Course" : "Add Course"}</DialogTitle>
            <DialogDescription>{selectedProgram?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCourseSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Course Name</label>
              <Input required value={courseFormData.name} onChange={e => setCourseFormData({ ...courseFormData, name: e.target.value })} placeholder="e.g. IB Math AA HL" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input value={courseFormData.description} onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })} placeholder="Optional description" />
            </div>
            <Button type="submit" className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white" disabled={createCourse.isPending || updateCourse.isPending}>
              {createCourse.isPending || updateCourse.isPending ? "Saving..." : "Save Course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
