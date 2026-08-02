"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, UserPlus } from "lucide-react";

export default function AdminSchedulePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Schedule Override
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Master calendar to view and manually schedule classes.
          </p>
        </div>
        <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Force Match Class
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-brand-cyan" />
            Master Calendar Overview
          </CardTitle>
          <CardDescription>Select a teacher to view their availability vs scheduled classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <select className="flex h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan dark:border-gray-700 dark:bg-gray-800">
              <option>All Teachers</option>
              <option>Mr. Davis</option>
              <option>Ms. Robinson</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="font-medium text-sm text-muted-foreground p-2 text-center">Time</div>
                {days.map(day => (
                  <div key={day} className="font-semibold text-sm text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-6 gap-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center justify-center p-2">
                      {hour}
                    </div>
                    {days.map((day, idx) => {
                      // Mocking some slots
                      const isClass = hour === "04:00 PM" && day === "Monday";
                      const isAvailable = idx % 2 === 0;

                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`h-16 rounded-lg transition-colors border p-2 flex flex-col justify-center items-center text-center ${
                            isClass 
                              ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                              : isAvailable 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {isClass && (
                            <>
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate w-full">SAT Math</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-500 truncate w-full">Alice S.</span>
                            </>
                          )}
                          {!isClass && isAvailable && (
                            <span className="text-[10px] text-green-600 dark:text-green-500 font-medium">Available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
