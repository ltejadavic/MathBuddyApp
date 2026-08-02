"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentResourcesPage() {
  const resources = [
    { id: 1, title: "SAT Math Practice Test 1", course: "SAT Math Prep", type: "PDF", size: "2.4 MB" },
    { id: 2, title: "Quadratic Equations Formula Sheet", course: "SAT Math Prep", type: "PDF", size: "1.1 MB" },
    { id: 3, title: "Kinematics Worksheet", course: "IB Physics", type: "Docx", size: "850 KB" },
  ];

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <div key={res.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:border-brand-cyan transition-colors">
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
                <Button variant="ghost" size="icon" className="shrink-0 text-gray-500 hover:text-brand-cyan">
                  <Download className="h-5 w-5" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
