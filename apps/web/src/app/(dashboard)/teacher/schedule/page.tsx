"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMyTeacherAvailability, useUpdateTeacherAvailability } from "@/hooks/use-scheduling-data";
import { Loader2 } from "lucide-react";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/calendar/AvailabilityCalendar";
import { ScheduleCalendar } from "@/components/calendar/ScheduleCalendar";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addDays, format } from "date-fns";
import { apiClient as api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyTeacherSessions } from "@/hooks/use-teacher-data";
import { TeacherEditSchedulePanel } from "./teacher-edit-schedule-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeacherSchedulePage() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [editingSchedule, setEditingSchedule] = useState<{ scheduleGroupId: string, courseId: string, studentId: string } | null>(null);

  const { data: sessions = [], isLoading: isLoadingSessions } = useMyTeacherSessions();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const { data: availabilities, isLoading } = useMyTeacherAvailability();
  const updateAvailability = useUpdateTeacherAvailability();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (availabilities) {
      const mapped: AvailabilitySlot[] = availabilities.map((av: any) => ({
        id: av.id,
        date: new Date(av.date).toISOString().split('T')[0],
        startTime: av.startTime,
        endTime: av.endTime,
      }));
      setSlots(mapped);
    }
  }, [JSON.stringify(availabilities)]);

  const handleSave = async () => {

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

  if (editingSchedule) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Edit Schedule
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Modify class times for your assigned student.
          </p>
        </div>
        <TeacherEditSchedulePanel 
          scheduleGroupId={editingSchedule.scheduleGroupId}
          courseId={editingSchedule.courseId}
          studentId={editingSchedule.studentId}
          onCancel={() => setEditingSchedule(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Schedule & Availability
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your teaching schedule and set your available hours.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="availability">My Availability</TabsTrigger>
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
                <ScheduleCalendar 
                  sessions={sessions} 
                  onEditSchedule={(scheduleGroupId, courseId, studentId) => {
                    setEditingSchedule({ scheduleGroupId, courseId, studentId });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Availability</CardTitle>
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
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
              ) : (
                <AvailabilityCalendar 
                  initialSlots={slots}
                  onSlotsChange={setSlots}
                  isSaving={updateAvailability.isPending}
                  onSave={handleSave}
                  onReplicateWeek={handleReplicateWeek}
                  onReplicateMonth={handleReplicateMonth}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
