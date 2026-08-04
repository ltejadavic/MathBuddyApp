"use client";

import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Video, Calendar as CalendarIcon, User, Users, BookOpen, Edit } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface ScheduleCalendarProps {
  sessions: any[];
  onEditSchedule?: (scheduleGroupId: string, courseId: string, studentId: string) => void;
}

export function ScheduleCalendar({ sessions, onEditSchedule }: ScheduleCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const currentUser = useAuthStore(state => state.user);

  const events = sessions.map((session) => {
    // Generate a random pastel color based on course name or schedule group
    const colors = [
      { bg: "rgba(59, 130, 246, 0.2)", border: "rgba(37, 99, 235, 1)", text: "rgba(30, 64, 175, 1)" }, // Blue
      { bg: "rgba(16, 185, 129, 0.2)", border: "rgba(5, 150, 105, 1)", text: "rgba(6, 78, 59, 1)" }, // Emerald
      { bg: "rgba(245, 158, 11, 0.2)", border: "rgba(217, 119, 6, 1)", text: "rgba(146, 64, 14, 1)" }, // Amber
      { bg: "rgba(139, 92, 246, 0.2)", border: "rgba(124, 58, 237, 1)", text: "rgba(91, 33, 182, 1)" }, // Violet
      { bg: "rgba(236, 72, 153, 0.2)", border: "rgba(219, 39, 119, 1)", text: "rgba(157, 23, 77, 1)" }, // Pink
    ];
    
    // Hash course id or schedule group id to pick a consistent color
    const hash = session.courseId ? session.courseId.charCodeAt(0) : 0;
    const color = colors[hash % colors.length];

    let title = session.course?.name || "Class";
    
    // If admin, might want to show student name on the block itself, but for now course is fine.
    // FullCalendar will show title and time.

    return {
      id: session.id,
      title: title,
      start: session.scheduledStartTime,
      end: session.scheduledEndTime,
      backgroundColor: color.bg,
      borderColor: color.border,
      textColor: color.text,
      extendedProps: { ...session },
    };
  });

  const handleEventClick = (info: any) => {
    setSelectedSession(info.event.extendedProps);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          navLinks={true}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          events={events}
          eventClick={handleEventClick}
          height="700px"
          editable={false}
          selectable={false}
        />
      </div>

      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-brand-cyan">
                  <BookOpen className="w-5 h-5" />
                  {selectedSession.course?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedSession.scheduledStartTime), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedSession.scheduledStartTime), "h:mm a")} -{" "}
                      {format(new Date(selectedSession.scheduledEndTime), "h:mm a")}
                    </p>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Teacher</p>
                    <Link 
                      href={`/profile/${selectedSession.teacher?.user?.id}`} 
                      className="font-medium hover:text-brand-cyan transition-colors"
                    >
                      {selectedSession.teacher?.user?.firstName} {selectedSession.teacher?.user?.lastName}
                    </Link>
                  </div>
                </div>

                {/* Student Details */}
                <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300 mt-2">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Students</p>
                    <div className="space-y-1">
                      {selectedSession.attendances?.map((att: any) => (
                        <div key={att.id}>
                          <Link 
                            href={`/profile/${att.student?.user?.id}`} 
                            className="font-medium hover:text-brand-cyan transition-colors"
                          >
                            {att.student?.user?.firstName} {att.student?.user?.lastName}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedSession.meetingLink && (
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 mt-2">
                    <Video className="w-5 h-5 text-gray-400" />
                    <a 
                      href={selectedSession.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline font-medium"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
              <DialogFooter className="sm:justify-between">
                <div>
                  {onEditSchedule && currentUser?.role === "TEACHER" && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const studentId = selectedSession.attendances?.[0]?.studentId;
                        if (studentId) {
                          onEditSchedule(selectedSession.scheduleGroupId, selectedSession.courseId, studentId);
                        }
                        setSelectedSession(null);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Schedule
                    </Button>
                  )}
                </div>
                <Button onClick={() => setSelectedSession(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
