"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourses, useResourcesByCourse, useMyResources } from "@/hooks/use-student-data";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function StudentResourcesPage() {
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  
  // We'll just fetch resources for the first course they are enrolled in for MVP
  // or fetch all. For now, fetch for the first course
  const courseId = courses?.[0]?.id;
  const { data: resources, isLoading: isLoadingResources } = useResourcesByCourse(courseId);
  const { data: myResources, isLoading: isLoadingMyResources, refetch } = useMyResources();

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      const { data } = await apiClient.get(`/storage/resources/${resourceId}/download`);
      window.open(data.url, "_blank");
    } catch (e) {
      alert("Download failed.");
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Learning Resources
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Download worksheets, practice tests, and materials shared by your teachers.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>Files assigned to you from your active courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses || isLoadingResources ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!resources || resources.length === 0 && <p className="text-sm text-muted-foreground p-4">No resources found.</p>}
            {resources?.map((res: any) => (
              <div key={res.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:border-brand-cyan transition-colors">
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
                <Button variant="ghost" size="icon" className="shrink-0 text-gray-500 hover:text-brand-cyan" onClick={() => handleDownload(res.id, res.title)}>
                  <Download className="h-5 w-5" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>My Uploaded Files</CardTitle>
          <CardDescription>Files you have sent via chat.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMyResources ? (
             <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myResources?.map((res: any) => (
              <div key={res.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:border-brand-cyan/50 transition-colors">
                <FileText className="h-8 w-8 text-brand-cyan shrink-0 mr-3 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{res.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{res.course?.name || "Chat File"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {res.fileType || "File"}
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
