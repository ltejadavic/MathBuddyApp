"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMatchmakingAvailability, useScheduleMatchedClasses } from "@/hooks/use-scheduling-data";
import { useAllUsers } from "@/hooks/use-admin-data";
import { useAllCourses } from "@/hooks/use-academic-data";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/calendar/AvailabilityCalendar";
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isBefore, startOfDay } from "date-fns";

interface MatchmakingPanelProps {
  prefilledStudentId?: string;
  prefilledCourseId?: string;
  classRequestId?: string;
  onSuccess?: () => void;
}

export function MatchmakingPanel({
  prefilledStudentId,
  prefilledCourseId,
  classRequestId,
  onSuccess
}: MatchmakingPanelProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(prefilledStudentId || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(prefilledCourseId || "");
  const [hoursToConsume, setHoursToConsume] = useState<number | "">("");
  
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    if (prefilledStudentId) setSelectedStudentId(prefilledStudentId);
    if (prefilledCourseId) setSelectedCourseId(prefilledCourseId);
  }, [prefilledStudentId, prefilledCourseId]);

  const { data: users = [] } = useAllUsers();
  const { data: courses = [] } = useAllCourses();
  
  const students = users.filter((u: any) => u.role === "STUDENT");
  const allTeachers = users.filter((u: any) => u.role === "TEACHER");

  const teachers = selectedCourseId && selectedCourseId !== "all"
    ? allTeachers.filter((t: any) => 
        t.teacherProfile?.courses?.some((c: any) => c.courseId === selectedCourseId)
      )
    : allTeachers;

  const { data: matchData, isLoading: isMatchLoading } = useMatchmakingAvailability(selectedStudentId, selectedTeacherId);
  const scheduleClasses = useScheduleMatchedClasses();

  const studentConflicts = useMemo(() => {
    if (!matchData?.studentSessions) return [];
    return matchData.studentSessions.map((sess: any) => {
      const d = new Date(sess.scheduledStartTime);
      const e = new Date(sess.scheduledEndTime);
      return {
        date: format(d, "yyyy-MM-dd"),
        startTime: format(d, "HH:mm"),
        endTime: format(e, "HH:mm"),
        courseName: sess.course?.name || "Busy"
      };
    });
  }, [matchData?.studentSessions]);

  // True Overlaps calculation
  const trueOverlaps = useMemo(() => {
    if (!matchData?.studentAvailability || !matchData?.teacherAvailability) return [];
    
    // We calculate available blocks for the next 3 months to map to the calendar
    const today = startOfDay(new Date());
    const endDate = addDays(today, 90);
    const allDays = eachDayOfInterval({ start: today, end: endDate });
    
    const validBlocks: AvailabilitySlot[] = [];

    allDays.forEach(dateObj => {
      const dayOfWeek = dateObj.getDay();
      const dateStr = format(dateObj, "yyyy-MM-dd");

      // Find overlapping availability for this specific date
      const dayOverlaps = [];
      for (const s of matchData.studentAvailability) {
        const sDateStr = s.date.split('T')[0];
        if (sDateStr !== dateStr) continue;

        for (const t of matchData.teacherAvailability) {
          const tDateStr = t.date.split('T')[0];
          if (tDateStr !== dateStr) continue;

          const maxStart = s.startTime > t.startTime ? s.startTime : t.startTime;
          const minEnd = s.endTime < t.endTime ? s.endTime : t.endTime;
          if (maxStart < minEnd) {
            dayOverlaps.push({ startTime: maxStart, endTime: minEnd });
          }
        }
      }

      // Filter against existing sessions
      // A simple approach: if any session falls on this date for either user, we subtract it.
      // For precision, we only subtract the EXACT time of the session.
      for (const overlap of dayOverlaps) {
        let blockStart = new Date(`${dateStr}T${overlap.startTime}:00`).getTime();
        let blockEnd = new Date(`${dateStr}T${overlap.endTime}:00`).getTime();

        const conflictingSessions = [
          ...(matchData.studentSessions || []),
          ...(matchData.teacherSessions || [])
        ].filter(sess => {
          const sessStart = new Date(sess.scheduledStartTime).getTime();
          const sessEnd = new Date(sess.scheduledEndTime).getTime();
          // Check if session intersects with the block
          return (sessStart < blockEnd && sessEnd > blockStart);
        });

        if (conflictingSessions.length === 0) {
          validBlocks.push({
            date: dateStr,
            startTime: overlap.startTime,
            endTime: overlap.endTime
          });
        } else {
          // If there's a conflict, for simplicity we split the block or skip it.
          // To keep it simple and robust, we sort conflicts by start time and subtract them out.
          conflictingSessions.sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
          
          let currentStart = blockStart;
          for (const conf of conflictingSessions) {
            const cStart = new Date(conf.scheduledStartTime).getTime();
            const cEnd = new Date(conf.scheduledEndTime).getTime();
            
            if (cStart > currentStart) {
              validBlocks.push({
                date: dateStr,
                startTime: format(new Date(currentStart), "HH:mm"),
                endTime: format(new Date(cStart), "HH:mm")
              });
            }
            currentStart = Math.max(currentStart, cEnd);
          }
          if (currentStart < blockEnd) {
             validBlocks.push({
                date: dateStr,
                startTime: format(new Date(currentStart), "HH:mm"),
                endTime: format(new Date(blockEnd), "HH:mm")
              });
          }
        }
      }
    });

    return validBlocks;
  }, [matchData]);

  // -- Event Handlers --

  const handleReplicateWeek = (currentDate: Date) => {
    // ... [same logic as before]
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const slotsInWeek = selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date >= weekStart && date <= weekEnd;
    });

    if (slotsInWeek.length === 0) {
      toast.error("Please add at least one slot to this week before replicating.");
      return;
    }

    const slotsByDay = new Map<number, any[]>();
    for (const slot of slotsInWeek) {
      const day = new Date(slot.date + 'T12:00:00Z').getDay();
      const list = slotsByDay.get(day) || [];
      // Deduplicate templates by time
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!list.some((s: any) => `${s.startTime}-${s.endTime}` === key)) {
        list.push(slot);
      }
      slotsByDay.set(day, list);
    }

    const calculateHours = (list: AvailabilitySlot[]) => list.reduce((acc, slot) => {
      const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
      const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
      return acc + (e - s) / (1000 * 60 * 60);
    }, 0);
    const targetStart = addDays(weekEnd, 1);
    
    let currentTotalHours = calculateHours(selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < targetStart || date > monthEnd;
    }));
    
    const maxHoursAllowed = Number(hoursToConsume);

    const newSlots: AvailabilitySlot[] = [];
    let cur = new Date(targetStart);
    while (cur <= monthEnd) {
      const dayOfWeek = cur.getDay();
      const templates = slotsByDay.get(dayOfWeek);
      if (templates) {
        for (const template of templates) {
          // Check if this new slot is inside trueOverlaps!
          const newSlotStart = new Date(`${format(cur, "yyyy-MM-dd")}T${template.startTime}:00`).getTime();
          const newSlotEnd = new Date(`${format(cur, "yyyy-MM-dd")}T${template.endTime}:00`).getTime();
          // Bypass isValid for explicit bulk replication
          const addedHours = (newSlotEnd - newSlotStart) / (1000 * 60 * 60);
          if (currentTotalHours + addedHours <= maxHoursAllowed) {
            currentTotalHours += addedHours;
            newSlots.push({
              id: `temp-${Date.now()}-${Math.random()}`,
              date: format(cur, 'yyyy-MM-dd'),
              startTime: template.startTime,
              endTime: template.endTime,
            });
          } else {
             // Limit reached, silently skip adding more
          }
        }
      }
      cur = addDays(cur, 1);
    }

    const filteredSlots = selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < targetStart || date > monthEnd;
    });

    setSelectedSlots([...filteredSlots, ...newSlots]);
    toast.success("Week replicated to available slots in the rest of the month.");
  };

  const handleReplicateMonth = async (currentDate: Date) => {
    // ... [same logic as before, but with overlap checking]
    const targetDateForMonth = addDays(currentDate, 3);
    const monthStart = startOfMonth(targetDateForMonth);
    const monthEnd = endOfMonth(targetDateForMonth);
    
    const prevMonth = subMonths(targetDateForMonth, 1);
    const prevMonthStart = startOfMonth(prevMonth);
    const prevMonthEnd = endOfMonth(prevMonth);

    const prevMonthSlots = selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    if (prevMonthSlots.length === 0) {
      toast.error("No slots found in the previous month to copy.");
      return;
    }

    const newSlots: AvailabilitySlot[] = [];
    let cur = new Date(monthStart);
    
    const slotsByDay = new Map<number, any[]>();
    for (const slot of prevMonthSlots) {
      const day = new Date(slot.date + 'T12:00:00Z').getDay();
      const list = slotsByDay.get(day) || [];
      // Deduplicate templates by time
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!list.some((s: any) => `${s.startTime}-${s.endTime}` === key)) {
        list.push(slot);
      }
      slotsByDay.set(day, list);
    }

    const calculateHours = (list: AvailabilitySlot[]) => list.reduce((acc, slot) => {
      const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
      const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
      return acc + (e - s) / (1000 * 60 * 60);
    }, 0);
    
    let currentTotalHours = calculateHours(selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < monthStart || date > monthEnd;
    }));
    
    const maxHoursAllowed = Number(hoursToConsume);

    while (cur <= monthEnd) {
      const dayOfWeek = cur.getDay();
      const templates = slotsByDay.get(dayOfWeek);
      if (templates) {
        for (const template of templates) {
          const newSlotStart = new Date(`${format(cur, "yyyy-MM-dd")}T${template.startTime}:00`).getTime();
          const newSlotEnd = new Date(`${format(cur, "yyyy-MM-dd")}T${template.endTime}:00`).getTime();
          // Bypass isValid for explicit bulk replication
          const addedHours = (newSlotEnd - newSlotStart) / (1000 * 60 * 60);
          if (currentTotalHours + addedHours <= maxHoursAllowed) {
            currentTotalHours += addedHours;
            newSlots.push({
              id: `temp-${Date.now()}-${Math.random()}`,
              date: format(cur, 'yyyy-MM-dd'),
              startTime: template.startTime,
              endTime: template.endTime,
            });
          } else {
             // Limit reached, silently skip adding more
          }
        }
      }
      cur = addDays(cur, 1);
    }

    const filteredSlots = selectedSlots.filter(s => {
      const date = new Date(s.date + 'T12:00:00Z');
      return date < monthStart || date > monthEnd;
    });

    setSelectedSlots([...filteredSlots, ...newSlots]);
    toast.success("Previous month replicated to available slots in the current month.");
  };

  const handleSchedule = () => {
    if (!selectedStudentId || !selectedTeacherId || !selectedCourseId || !hoursToConsume || selectedSlots.length === 0) {
      toast.error("Please fill all fields and select at least one slot.");
      return;
    }
    if (selectedCourseId === "all") {
      toast.error("Please select a specific course, not 'Any Course'.");
      return;
    }

    scheduleClasses.mutate({
      studentId: selectedStudentId,
      courseId: selectedCourseId,
      teacherId: selectedTeacherId,
      classRequestId,
      totalMinutesToConsume: Number(hoursToConsume) * 60,
      slots: selectedSlots,
    }, {
      onSuccess: () => {
        toast.success("Classes scheduled successfully!");
        if (onSuccess) onSuccess();
        if (!prefilledStudentId) setSelectedStudentId("");
        if (!prefilledCourseId) setSelectedCourseId("");
        setSelectedTeacherId("");
        setHoursToConsume("");
        setSelectedSlots([]);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to schedule classes");
      }
    });
  };

  // Safe names for select values
  const studentName = students.find((s: any) => s.studentProfile?.id === selectedStudentId || s.id === selectedStudentId);
  const courseName = courses.find((c: any) => c.id === selectedCourseId);
  const teacherName = teachers.find((t: any) => t.teacherProfile?.id === selectedTeacherId || t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Student</label>
          <Select 
            value={selectedStudentId} 
            onValueChange={(val) => { setSelectedStudentId(val || ""); setSelectedSlots([]); }}
            disabled={!!classRequestId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select student">
                {studentName ? `${studentName.firstName} ${studentName.lastName}` : "Select student"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {students.map((u: any) => (
                <SelectItem key={u.id} value={u.studentProfile?.id || u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Course</label>
          <Select 
            value={selectedCourseId} 
            onValueChange={(val) => { setSelectedCourseId(val || ""); setSelectedTeacherId(""); setSelectedSlots([]); }}
            disabled={!!classRequestId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course">
                 {courseName ? courseName.name : (selectedCourseId === "all" ? "Any Course" : "Select course")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {!prefilledCourseId && <SelectItem value="all">Any Course</SelectItem>}
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Teacher</label>
          <Select value={selectedTeacherId} onValueChange={(val) => setSelectedTeacherId(val || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select teacher">
                 {teacherName ? `${teacherName.firstName} ${teacherName.lastName}` : "Select teacher"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teachers.map((u: any) => (
                <SelectItem key={u.id} value={u.teacherProfile?.id || u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudentId && selectedTeacherId && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Schedule Classes
            {isMatchLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h3>
          
          <div className="mt-2 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
            <h4 className="font-medium mb-3">1. Setup Hours to Consume</h4>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-64">
                <label className="text-sm font-medium mb-1 block">Hours to Consume</label>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="e.g., 10" 
                  value={hoursToConsume}
                  onChange={(e) => setHoursToConsume(Number(e.target.value) || "")}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  disabled={selectedSlots.length > 0}
                  title={selectedSlots.length > 0 ? "Clear calendar to change hours" : ""}
                />
              </div>
            </div>
          </div>

          <div className="relative p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-800/10">
            {!hoursToConsume && (
              <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Please enter the "Hours to Consume" above to unlock the calendar.
                </p>
              </div>
            )}
            
            {hoursToConsume && (
              <div className="mb-4 flex justify-between items-center bg-white p-3 rounded-md shadow-sm border border-gray-200">
                <span className="font-medium">Selected Hours:</span>
                <span className="font-bold text-brand-cyan">
                  {selectedSlots.reduce((acc, slot) => {
                    const start = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
                    const end = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
                    return acc + (end - start) / (1000 * 60 * 60);
                  }, 0).toFixed(1)} / {hoursToConsume}
                </span>
              </div>
            )}

            <AvailabilityCalendar 
              initialSlots={selectedSlots} 
              onSlotsChange={setSelectedSlots}
              onReplicateWeek={handleReplicateWeek}
              onReplicateMonth={handleReplicateMonth}
              isSaving={scheduleClasses.isPending}
              availableBlocks={trueOverlaps}
              studentConflicts={studentConflicts}
              maxHours={Number(hoursToConsume)}
            />
          </div>

          {selectedSlots.length > 0 && hoursToConsume && (
            <div className="flex justify-end mt-4">
              <Button 
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                onClick={() => {
                  const totalSelected = selectedSlots.reduce((acc, slot) => {
                    const start = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
                    const end = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
                    return acc + (end - start) / (1000 * 60 * 60);
                  }, 0);
                  
                  if (Math.abs(totalSelected - Number(hoursToConsume)) > 0.01) {
                    toast.error(`You selected ${totalSelected.toFixed(1)} hours, but specified ${hoursToConsume} hours. Please make them match.`);
                    return;
                  }
                  handleSchedule();
                }}
                disabled={scheduleClasses.isPending}
              >
                {scheduleClasses.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Schedule
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
