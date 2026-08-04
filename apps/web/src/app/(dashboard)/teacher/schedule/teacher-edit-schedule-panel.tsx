"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSchedules,
  useUpdateSchedule,
  useDeleteSchedule,
  useMyTeacherAvailability,
} from "@/hooks/use-scheduling-data";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/calendar/AvailabilityCalendar";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export function TeacherEditSchedulePanel({ 
  scheduleGroupId, 
  courseId, 
  studentId,
  onCancel
}: { 
  scheduleGroupId: string;
  courseId: string;
  studentId: string;
  onCancel: () => void;
}) {
  const currentUser = useAuthStore(state => state.user);
  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules(studentId);
  const { data: availability = [] } = useMyTeacherAvailability();
  
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [targetHours, setTargetHours] = useState<number>(0);

  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  // Fetch student sessions to show as conflicts
  const { data: studentSessions = [] } = useQuery({
    queryKey: ['student-sessions', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await apiClient.get(`/sessions?studentId=${studentId}`);
      return res.data;
    },
    enabled: !!studentId
  });

  useEffect(() => {
    if (schedules.length > 0) {
      const schedule = schedules.find((s: any) => (s.scheduleGroupId && s.scheduleGroupId === scheduleGroupId) || (s.course.id === courseId && s.teacher.userId === currentUser?.id));
      if (schedule) {
        setSelectedSchedule(schedule);
        const initialSlots = schedule.sessions
          .filter((s: any) => s.status === 'SCHEDULED' && new Date(s.scheduledStartTime) > new Date())
          .map((s: any) => ({
            id: s.id,
            date: format(new Date(s.scheduledStartTime), 'yyyy-MM-dd'),
            startTime: format(new Date(s.scheduledStartTime), 'HH:mm'),
            endTime: format(new Date(s.scheduledEndTime), 'HH:mm'),
          }));
        setSelectedSlots(initialSlots);

        const originalFutureMinutes = schedule.sessions
          .filter((s: any) => s.status === 'SCHEDULED' && new Date(s.scheduledStartTime) > new Date())
          .reduce((acc: number, s: any) => acc + (new Date(s.scheduledEndTime).getTime() - new Date(s.scheduledStartTime).getTime()) / (1000 * 60), 0);
        setTargetHours(originalFutureMinutes / 60);
      }
    }
  }, [schedules, scheduleGroupId, courseId, currentUser?.id]);

  // Map availability to true overlaps (green blocks)
  const trueOverlaps = availability.flatMap((avail: any) => {
    if (avail.isRecurring) {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (date.getDay() === avail.dayOfWeek) {
          dates.push({
            date: format(date, 'yyyy-MM-dd'),
            startTime: avail.startTime,
            endTime: avail.endTime,
          });
        }
      }
      return dates;
    } else {
      return [{
        date: format(new Date(avail.date), 'yyyy-MM-dd'),
        startTime: avail.startTime,
        endTime: avail.endTime,
      }];
    }
  });

  // Calculate student conflicts (red blocks)
  const studentConflicts = studentSessions
    .filter((s: any) => s.status === 'SCHEDULED' && new Date(s.scheduledStartTime) > new Date() && s.scheduleGroupId !== scheduleGroupId)
    .map((s: any) => ({
      date: format(new Date(s.scheduledStartTime), 'yyyy-MM-dd'),
      startTime: format(new Date(s.scheduledStartTime), 'HH:mm'),
      endTime: format(new Date(s.scheduledEndTime), 'HH:mm'),
      title: s.course?.name || "Other Class"
    }));

  const handleDelete = () => {
    if (!selectedSchedule) return;
    if (!window.confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) return;

    deleteSchedule.mutate(
      {
        courseId: selectedSchedule.course.id,
        studentId,
        teacherId: currentUser?.id,
        scheduleGroupId: selectedSchedule.scheduleGroupId,
      },
      {
        onSuccess: () => {
          onCancel();
        }
      }
    );
  };

  const unassignedHours = targetHours - selectedSlots.reduce((acc, slot) => {
    const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
    const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
    return acc + (e - s) / (1000 * 60 * 60);
  }, 0);

  const handleSave = () => {
    if (!selectedSchedule) return;

    updateSchedule.mutate(
      { 
        courseId: selectedSchedule.course.id, 
        data: { 
          studentId, 
          teacherId: currentUser?.id, 
          scheduleGroupId: selectedSchedule.scheduleGroupId,
          slots: selectedSlots 
        } 
      },
      {
        onSuccess: () => {
          onCancel();
        }
      }
    );
  };

  if (isLoadingSchedules) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>;
  }

  if (!selectedSchedule) {
    return (
      <div className="space-y-4 border rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/20">
        <p className="text-muted-foreground text-center p-8">Schedule not found or you don't have permission to edit it.</p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Editing: {selectedSchedule.course.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">You are modifying future sessions for this student.</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-sm">
              <span className="font-medium text-gray-500">Scheduled:</span> {
                selectedSlots.reduce((acc, slot) => {
                  const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
                  const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
                  return acc + (e - s) / (1000 * 60 * 60);
                }, 0)
              }h
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-500">Unassigned:</span>{' '}
              <span className={unassignedHours !== 0 ? "text-orange-500 font-bold" : "text-green-600 font-bold"}>
                {unassignedHours}h
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
            onClick={handleSave}
            disabled={updateSchedule.isPending || unassignedHours !== 0}
          >
            {updateSchedule.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border">
        <AvailabilityCalendar
          availableBlocks={trueOverlaps}
          initialSlots={selectedSlots}
          onSlotsChange={setSelectedSlots}
          maxHours={targetHours}
          studentConflicts={studentConflicts}
        />
      </div>
    </div>
  );
}
