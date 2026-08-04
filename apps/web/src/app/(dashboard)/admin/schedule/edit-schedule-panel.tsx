"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSchedules,
  useUpdateSchedule,
  useDeleteSchedule,
  useTeacherAvailability,
} from "@/hooks/use-scheduling-data";
import { useAllUsers } from "@/hooks/use-admin-data";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/calendar/AvailabilityCalendar";

export function EditSchedulePanel() {
  const { data: users = [] } = useAllUsers();
  const students = users.filter((u: any) => u.role === "STUDENT");

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules(selectedStudentId);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const { data: availability = [] } = useTeacherAvailability(selectedSchedule?.teacher?.id || selectedSchedule?.teacher?.userId);

  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [targetHours, setTargetHours] = useState<number>(0);

  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const activeStudents = students.filter((s: any) => !s.deletedAt);

  const displayedSchedules = schedules;

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

  const handleSelectSchedule = (schedule: any) => {
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
  };

  const handleSave = () => {
    if (!selectedSchedule) return;

    const newMinutes = selectedSlots.reduce((acc, slot) => {
      const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
      const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
      return acc + (e - s) / (1000 * 60);
    }, 0);

    updateSchedule.mutate(
      { 
        courseId: selectedSchedule.course.id, 
        data: { 
          studentId: selectedStudentId, 
          teacherId: selectedSchedule.teacher?.id, 
          scheduleGroupId: selectedSchedule.scheduleGroupId,
          slots: selectedSlots 
        } 
      },
      {
        onSuccess: () => {
          setSelectedSchedule(null);
          setSelectedSlots([]);
        }
      }
    );
  };

  const handleDelete = () => {
    if (!selectedSchedule || !confirm("Are you sure you want to delete this schedule? Future hours will be refunded.")) return;
    deleteSchedule.mutate(
      { 
        courseId: selectedSchedule.course.id, 
        studentId: selectedStudentId, 
        teacherId: selectedSchedule.teacher?.id,
        scheduleGroupId: selectedSchedule.scheduleGroupId
      },
      {
        onSuccess: () => {
          setSelectedSchedule(null);
          setSelectedSlots([]);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Select Student</label>
          <select 
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan dark:border-gray-700 dark:bg-gray-800"
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedSchedule(null);
            }}
          >
            <option value="">-- Choose a student --</option>
            {activeStudents.map((s: any) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudentId && !selectedSchedule && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Schedules</h3>
          {isLoadingSchedules ? (
            <p>Loading...</p>
          ) : displayedSchedules.length === 0 ? (
            <p className="text-muted-foreground">No schedules found for this combination.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedSchedules.map((schedule: any) => {
                const isCompleted = !schedule.sessions.some((s: any) => new Date(s.scheduledStartTime) > new Date());
                const startDate = schedule.sessions.length > 0 ? format(new Date(schedule.sessions[0].scheduledStartTime), 'MMM d, yyyy') : 'N/A';
                const endDate = schedule.sessions.length > 0 ? format(new Date(schedule.sessions[schedule.sessions.length - 1].scheduledStartTime), 'MMM d, yyyy') : 'N/A';

                return (
                  <Card 
                    key={schedule.scheduleGroupId || `${schedule.course.id}-${schedule.teacher?.id}`} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-brand-cyan/20"
                    onClick={() => handleSelectSchedule(schedule)}
                  >
                    <CardContent className="p-4 relative">
                      <div className="absolute top-4 right-4">
                        {isCompleted ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500">Completed</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg pr-20">{schedule.course.name}</h4>
                      <p className="text-sm text-muted-foreground">{schedule.course.program.name}</p>
                      
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Teacher: </span>
                        <span>{schedule.teacher?.user?.firstName} {schedule.teacher?.user?.lastName}</span>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Date Range: </span>
                        <span className="font-medium">{startDate} - {endDate}</span>
                      </div>
                      
                      <div className="mt-1 text-sm">
                        <span className="text-gray-500">Total Hours Scheduled: </span>
                        <span className="font-medium">{schedule.totalMinutes / 60}h</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {schedule.sessions.length} total sessions
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedSchedule && (
        <div className="space-y-4 border rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Editing: {selectedSchedule.course.name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Target Hours:</label>
                  <Input 
                    type="number" 
                    value={targetHours === 0 ? "" : targetHours} 
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-20 h-8" 
                    step="0.5"
                  />
                </div>
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
                  <span className={
                    targetHours - selectedSlots.reduce((acc, slot) => {
                      const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
                      const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
                      return acc + (e - s) / (1000 * 60 * 60);
                    }, 0) > 0 ? "text-orange-500 font-bold" : "text-green-600 font-bold"
                  }>
                    {targetHours - selectedSlots.reduce((acc, slot) => {
                      const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
                      const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
                      return acc + (e - s) / (1000 * 60 * 60);
                    }, 0)}h
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedSchedule(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={
                  deleteSchedule.isPending || 
                  updateSchedule.isPending || 
                  (selectedSchedule && !selectedSchedule.sessions.some((s: any) => new Date(s.scheduledStartTime) > new Date()))
                }
                title={selectedSchedule && !selectedSchedule.sessions.some((s: any) => new Date(s.scheduledStartTime) > new Date()) ? "Completed packages cannot be deleted to preserve history." : ""}
              >
                Delete Schedule
              </Button>
              <Button 
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                onClick={handleSave}
                disabled={updateSchedule.isPending || deleteSchedule.isPending}
              >
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
