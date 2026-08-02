"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useUploadResource } from "@/hooks/use-teacher-data";
import { useCourses, useMyResources } from "@/hooks/use-student-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

export default function TeacherResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  
  // Use the selected course, or default to the first one available
  const activeCourseId = selectedCourseId || courses?.[0]?.id;
  const { data: myResources, isLoading: isLoadingResources, refetch } = useMyResources();
  const uploadResource = useUploadResource();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      try {
        await apiClient.delete(`/storage/resources/${id}`);
        refetch();
      } catch(e) {
        alert("Failed to delete resource");
      }
    }
  };

  const handleUpload = () => {
    if (!file || !activeCourseId) {
      alert("Please select a file and a course.");
      return;
    }
    
    uploadResource.mutate({ file, title: file.name, courseId: activeCourseId }, {
      onSuccess: () => {
        setFile(null);
        alert("File uploaded successfully!");
        refetch();
      },
      onError: () => {
        alert("Failed to upload file.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Resource Management
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Upload and organize materials for your students.
          </p>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 bg-brand-cyan/5 border-dashed border-2 border-brand-cyan/20">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4">
            <UploadCloud className="h-8 w-8 text-brand-cyan" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload a new document</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Select a file and the course it belongs to.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl w-full">
            <Select value={activeCourseId || ""} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="file" className="cursor-pointer flex-1" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button 
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-white whitespace-nowrap"
              onClick={handleUpload}
              disabled={uploadResource.isPending}
            >
              {uploadResource.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Upload File
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>My Uploaded Resources</CardTitle>
          <CardDescription>Manage files assigned to your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses || isLoadingResources ? (
             <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myResources?.map((res: any) => (
              <div key={res.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:border-brand-cyan/50 transition-colors">
                <FileText className="h-8 w-8 text-brand-cyan shrink-0 mr-3 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{res.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{res.course?.name || "Course Material"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {res.fileType || "PDF"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {res.sizeBytes ? (res.sizeBytes / 1024 / 1024).toFixed(1) + " MB" : "N/A"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(res.id)}>
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
            
            {(!myResources || myResources.length === 0) && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No resources uploaded yet.
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
