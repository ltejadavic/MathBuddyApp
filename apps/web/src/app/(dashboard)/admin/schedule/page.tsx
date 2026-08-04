"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, UserPlus, Inbox, Search, ChevronDown, ChevronUp } from "lucide-react";
import { EditSchedulePanel } from "./edit-schedule-panel";
import { MatchmakingPanel } from "./matchmaking-panel";
import { ScheduleCalendar } from "@/components/calendar/ScheduleCalendar";
import { useAllClassRequests, useResolveClassRequest, useAllSessions } from "@/hooks/use-scheduling-data";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSchedulePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

  const { data: requests = [] } = useAllClassRequests();
  const { data: allSessions = [], isLoading: isLoadingSessions } = useAllSessions();
  const resolveRequest = useResolveClassRequest();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("requests");
  
  const [showAllPending, setShowAllPending] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pendingRequests = requests.filter((r: any) => 
    r.status === 'PENDING' && 
    (searchQuery ? `${r.student.user.firstName} ${r.student.user.lastName} ${r.course.name}`.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );
  
  const resolvedRequests = requests.filter((r: any) => 
    (r.status === 'RESOLVED' || r.status === 'CANCELLED' || r.status === 'EDITED') && 
    (searchQuery ? `${r.student.user.firstName} ${r.student.user.lastName} ${r.course.name}`.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const displayedPending = showAllPending ? pendingRequests : pendingRequests.slice(0, 5);

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

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val !== "manual-match") {
          setSelectedRequest(null);
        }
      }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Class Requests</TabsTrigger>
          <TabsTrigger value="manual-match">Manual Scheduling</TabsTrigger>
          <TabsTrigger value="edit-schedule">Edit Schedules</TabsTrigger>
          <TabsTrigger value="calendar">Master Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Class Requests</CardTitle>
              <CardDescription>Review and resolve class requests submitted by students.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student or course..."
                  className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {requests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No class requests found.</div>
              ) : (
                <div className="space-y-8">
                  {/* Pending Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Pending Requests
                        <Badge variant="secondary">{pendingRequests.length}</Badge>
                      </h3>
                    </div>
                    
                    {pendingRequests.length === 0 ? (
                      <p className="text-sm text-gray-500">No pending requests match your search.</p>
                    ) : (
                      <div className="space-y-4">
                        {displayedPending.map((req: any) => (
                          <div key={req.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4 bg-white dark:bg-gray-900 border-l-4 border-l-amber-400">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{req.student.user.firstName} {req.student.user.lastName}</h4>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">PENDING</Badge>
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
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setActiveTab("manual-match");
                                }}
                              >
                                Process Request
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {pendingRequests.length > 5 && (
                      <div className="mt-4 text-center">
                        <Button 
                          variant="ghost" 
                          className="text-brand-cyan text-sm"
                          onClick={() => setShowAllPending(!showAllPending)}
                        >
                          {showAllPending ? "Show less" : `View all ${pendingRequests.length} pending requests`}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Resolved Section */}
                  <div>
                    <Button 
                      variant="ghost" 
                      className="w-full flex justify-between items-center p-4 h-auto border rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                      onClick={() => setShowResolved(!showResolved)}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Resolved, Cancelled & Edited
                        <Badge variant="outline">{resolvedRequests.length}</Badge>
                      </h3>
                      {showResolved ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                    
                    {showResolved && (
                      <div className="mt-4 space-y-4">
                        {resolvedRequests.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center p-4">No resolved requests match your search.</p>
                        ) : (
                          resolvedRequests.map((req: any) => (
                            <div key={req.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">{req.student.user.firstName} {req.student.user.lastName}</h4>
                                  <Badge variant={req.status === 'RESOLVED' ? 'default' : req.status === 'EDITED' ? 'secondary' : 'destructive'}>
                                    {req.status === 'EDITED' ? 'Teacher Edited' : req.status}
                                  </Badge>
                                  {req.status === 'EDITED' && req.resolvedBy && (
                                    <span className="text-xs text-muted-foreground">
                                      by {req.resolvedBy.firstName} {req.resolvedBy.lastName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  Course: <span className="font-medium text-gray-700 dark:text-gray-300">{req.course.name}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  Submitted on {new Date(req.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
              <MatchmakingPanel 
                prefilledStudentId={selectedRequest?.student?.userId}
                prefilledCourseId={selectedRequest?.courseId}
                classRequestId={selectedRequest?.id}
                onSuccess={() => {
                  setSelectedRequest(null);
                  setActiveTab("requests");
                }}
              />
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
              <CardTitle>Master Calendar</CardTitle>
              <CardDescription>View all active schedules across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
              ) : (
                <ScheduleCalendar sessions={allSessions} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
