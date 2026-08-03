"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, UserPlus, Inbox } from "lucide-react";
import { useAllClassRequests, useResolveClassRequest } from "@/hooks/use-scheduling-data";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditSchedulePanel } from "./edit-schedule-panel";
import { MatchmakingPanel } from "./matchmaking-panel";

export default function AdminSchedulePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

  const { data: requests = [] } = useAllClassRequests();
  const resolveRequest = useResolveClassRequest();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Schedule Overview
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Master calendar, matchmaking, and class requests.
          </p>
        </div>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Class Requests</TabsTrigger>
          <TabsTrigger value="manual-match">Manual Scheduling</TabsTrigger>
          <TabsTrigger value="edit-schedule">Edit Schedules</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Class Requests</CardTitle>
              <CardDescription>Review and resolve class requests submitted by students.</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No class requests found.</div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req: any) => (
                    <div key={req.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{req.student.user.firstName} {req.student.user.lastName}</h4>
                          <Badge variant={req.status === 'PENDING' ? 'secondary' : req.status === 'RESOLVED' ? 'default' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested Course: <span className="font-medium text-gray-900 dark:text-gray-100">{req.course.name}</span>
                        </p>
                        {req.notes && (
                          <p className="text-sm text-gray-500 italic mt-2">"{req.notes}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted on {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                          <Button 
                            variant="outline" 
                            className="w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => resolveRequest.mutate({ id: req.id, status: 'CANCELLED' })}
                            disabled={resolveRequest.isPending}
                          >
                            Reject
                          </Button>
                          <Button 
                            className="w-full md:w-auto bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                            onClick={() => setSelectedRequest(req)}
                          >
                            Process Request
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-match">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Manual Scheduling</CardTitle>
              <CardDescription>Manually schedule classes between a student and a teacher.</CardDescription>
            </CardHeader>
            <CardContent>
              <MatchmakingPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-schedule">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Edit Schedules</CardTitle>
              <CardDescription>Manage and modify existing schedules for students.</CardDescription>
            </CardHeader>
            <CardContent>
              <EditSchedulePanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
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
        </TabsContent>
      </Tabs>

      {/* Class Request Processing Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Class Request</DialogTitle>
              <DialogDescription>
                Find a matching teacher for {selectedRequest.student.user.firstName} in {selectedRequest.course.name} and exhaust hours.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <MatchmakingPanel 
                prefilledStudentId={selectedRequest.student.userId}
                prefilledCourseId={selectedRequest.courseId}
                classRequestId={selectedRequest.id}
                onSuccess={() => setSelectedRequest(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
