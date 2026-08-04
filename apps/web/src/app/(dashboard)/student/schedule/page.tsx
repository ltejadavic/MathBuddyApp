"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useCourses, useUsers, useCreateSession, useMyProfile } from "@/hooks/use-student-data";
import { useMyStudentAvailability, useUpdateStudentAvailability, useCreateClassRequest } from "@/hooks/use-scheduling-data";
import { addDays, format, setHours, setMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/calendar/AvailabilityCalendar";
import { ScheduleCalendar } from "@/components/calendar/ScheduleCalendar";
import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function StudentSchedulePage() {
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: profile } = useMyProfile();
  const createSession = useCreateSession();
  const { data: availability } = useMyStudentAvailability();
  const updateAvailability = useUpdateStudentAvailability();
  const createClassRequest = useCreateClassRequest();

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['student-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const res = await api.get(`/sessions?studentId=${profile.id}`);
      return res.data;
    },
    enabled: !!profile?.id
  });

  // Availability calendar state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (availability) {
      const mapped: AvailabilitySlot[] = availability.map((av: any) => ({
        id: av.id,
        date: new Date(av.date).toISOString().split('T')[0],
        startTime: av.startTime,
        endTime: av.endTime,
      }));
      setSlots(mapped);
    }
  }, [JSON.stringify(availability)]);

  const handleSaveAvailability = async () => {
    const payload = slots.map(slot => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }));
    
    await updateAvailability.mutateAsync({ slots: payload });
    toast.success("Availability saved successfully!");
  };

  const handleReplicateWeek = async (currentDate: Date) => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Validate that current week has at least one slot
    const slotsInWeek = slots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date >= weekStart && date <= weekEnd;
    });
    if (slotsInWeek.length === 0) {
      toast.error("Please add at least one availability slot to this week before replicating.");
      return;
    }

    const slotsByDay = new Map<number, any[]>();
    for (const slot of slotsInWeek) {
      const day = new Date(slot.date + 'T12:00:00Z').getDay();
      const list = slotsByDay.get(day) || [];
      list.push(slot);
      slotsByDay.set(day, list);
    }

    const targetStart = addDays(weekEnd, 1);
    const newSlots: AvailabilitySlot[] = [];
    let cur = new Date(targetStart);
    while (cur <= monthEnd) {
      const dayOfWeek = cur.getDay();
      const templates = slotsByDay.get(dayOfWeek);
      if (templates) {
        for (const template of templates) {
          newSlots.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            date: format(cur, 'yyyy-MM-dd'),
            startTime: template.startTime,
            endTime: template.endTime,
          });
        }
      }
      cur = addDays(cur, 1);
    }

    const filteredSlots = slots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < targetStart || date > monthEnd;
    });

    setSlots([...filteredSlots, ...newSlots]);
    toast.success("Week replicated to the rest of the month locally. Please click 'Save' to persist.");
  };

  const handleReplicateMonth = async (currentDate: Date) => {
    // Add 3 days to current date (start of week) to find which month this week primarily belongs to
    const targetDateForMonth = addDays(currentDate, 3);
    const monthStart = startOfMonth(targetDateForMonth);
    const monthEnd = endOfMonth(targetDateForMonth);
    
    const prevMonth = subMonths(targetDateForMonth, 1);
    const prevMonthStart = startOfMonth(prevMonth);
    const prevMonthEnd = endOfMonth(prevMonth);

    // Validate that the previous month had at least one slot
    const slotsInPrevMonth = slots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date >= prevMonthStart && date <= prevMonthEnd;
    });
    if (slotsInPrevMonth.length === 0) {
      toast.error("The previous month has no availability slots to copy.");
      return;
    }

    // Group by day of week, taking only the LATEST occurrence for each day of the week
    const slotsByDay = new Map<number, any[]>();
    slotsInPrevMonth.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const seenDatesByDay = new Map<number, string>();
    for (const slot of slotsInPrevMonth) {
      const day = new Date(slot.date + 'T12:00:00Z').getDay();
      if (!seenDatesByDay.has(day)) {
        seenDatesByDay.set(day, slot.date);
      }
      if (seenDatesByDay.get(day) === slot.date) {
        const list = slotsByDay.get(day) || [];
        list.push(slot);
        slotsByDay.set(day, list);
      }
    }

    const newSlots: AvailabilitySlot[] = [];
    let cur = new Date(monthStart);
    while (cur <= monthEnd) {
      const dayOfWeek = cur.getDay();
      const templates = slotsByDay.get(dayOfWeek);
      if (templates) {
        for (const template of templates) {
          newSlots.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            date: format(cur, 'yyyy-MM-dd'),
            startTime: template.startTime,
            endTime: template.endTime,
          });
        }
      }
      cur = addDays(cur, 1);
    }

    const filteredSlots = slots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < monthStart || date > monthEnd;
    });

    setSlots([...filteredSlots, ...newSlots]);
    toast.success("Availability copied from previous month locally. Please click 'Save' to persist.");
  };

  // Form states for class request
  const [requestCourseId, setRequestCourseId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const teachers = users?.filter((u: any) => u.role === "TEACHER") || [];
  
  // Generate some mock available slots based on the real teachers and courses for MVP
  const availableSlots = teachers.slice(0, 3).map((teacher: any, index: number) => {
    const course = courses?.[index % (courses?.length || 1)];
    const date = addDays(setHours(setMinutes(new Date(), 0), 16 + index), index); // 4pm, 5pm, 6pm over next few days
    return {
      id: teacher.id + "-" + index,
      teacherId: teacher.id,
      courseId: course?.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      courseName: course?.name || "General Prep",
      dateObj: date,
      date: format(date, "EEEE, h:mm a"),
      duration: "1 hr",
      durationMins: 60
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Schedule & Availability
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your availability, book classes, or request new ones.
        </p>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="availability">My Availability</TabsTrigger>
          <TabsTrigger value="request">Request Class</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>View your upcoming and past classes.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
              ) : (
                <ScheduleCalendar sessions={sessions} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Click and drag on the calendar to mark your available time slots.</CardDescription>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all your availability from the screen? You must click 'Save' afterwards to apply the changes.")) {
                    setSlots([]);
                  }
                }}
              >
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar 
                initialSlots={slots}
                onSlotsChange={setSlots}
                isSaving={updateAvailability.isPending}
                onSave={handleSaveAvailability}
                onReplicateWeek={handleReplicateWeek}
                onReplicateMonth={handleReplicateMonth}
              />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="request">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Request a Class</CardTitle>
              <CardDescription>Cannot find a suitable slot? Request a class and we'll match you with a teacher.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan dark:border-gray-700 dark:bg-gray-900"
                    value={requestCourseId}
                    onChange={(e) => setRequestCourseId(e.target.value)}
                  >
                    <option value="">Select a course...</option>
                    {courses?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea 
                    placeholder="e.g., I prefer evenings or weekends..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                  disabled={!requestCourseId || createClassRequest.isPending}
                  onClick={() => {
                    createClassRequest.mutate({
                      studentId: profile?.id,
                      courseId: requestCourseId,
                      notes: requestNotes
                    }, {
                      onSuccess: () => {
                        alert("Class request submitted successfully! An admin will review it soon.");
                        setRequestCourseId("");
                        setRequestNotes("");
                      }
                    });
                  }}
                >
                  {createClassRequest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
