"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState([
    { id: 1, title: "Quadratic Equations Formula Sheet", course: "SAT Math Prep", type: "PDF", size: "1.1 MB" },
    { id: 2, title: "Kinematics Worksheet", course: "IB Physics", type: "Docx", size: "850 KB" },
  ]);

  const handleDelete = (id: number) => {
    setResources(resources.filter(r => r.id !== id));
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
            Drag and drop your PDF or Word document here, or click the button below to browse your files.
          </p>
          <div className="flex items-center gap-2 max-w-md w-full">
            <Input type="file" className="cursor-pointer" />
            <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white whitespace-nowrap">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <div key={res.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:border-brand-cyan/50 transition-colors">
                <FileText className="h-8 w-8 text-brand-cyan shrink-0 mr-3 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{res.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{res.course}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {res.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{res.size}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(res.id)}>
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
            
            {resources.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No resources uploaded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
