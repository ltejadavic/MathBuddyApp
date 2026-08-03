"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export type AvailabilitySlot = {
  id?: string;
  date: string; // "yyyy-MM-dd"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};

interface AvailabilityCalendarProps {
  initialSlots?: AvailabilitySlot[];
  availableBlocks?: AvailabilitySlot[];
  maxHours?: number;
  onSlotsChange: (slots: AvailabilitySlot[]) => void;
  isSaving?: boolean;
  onSave?: () => void;
  onReplicateWeek?: (dateInWeek: Date) => void;
  onReplicateMonth?: (dateInMonth: Date) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function AvailabilityCalendar({
  initialSlots = [],
  onSlotsChange,
  isSaving,
  onSave,
  onReplicateWeek,
  onReplicateMonth,
  availableBlocks,
  maxHours,
}: AvailabilityCalendarProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (JSON.stringify(initialSlots) !== JSON.stringify(slots)) {
      setSlots(initialSlots);
    }
  }, [JSON.stringify(initialSlots)]);


  const events = slots.map((slot, index) => ({
    id: slot.id || `slot-${index}`,
    start: `${slot.date}T${slot.startTime}:00`,
    end: `${slot.date}T${slot.endTime}:00`,
    backgroundColor: "hsl(194, 96%, 42%)", 
    borderColor: "hsl(194, 96%, 32%)",
    extendedProps: { ...slot },
  }));

  if (availableBlocks) {
    availableBlocks.forEach((block, idx) => {
      events.push({
        id: `block-${idx}`,
        start: `${block.date}T${block.startTime}:00`,
        end: `${block.date}T${block.endTime}:00`,
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 0.5)",
        display: "background",
        extendedProps: { isBackground: true }
      } as any);
    });
  }


  const handleSelect = (info: any) => {
    const start = info.start;
    const end = info.end;

    if (info.allDay) {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.changeView('timeGridDay', start);
      return;
    }

    if (availableBlocks) {
      // Check if the selection falls ENTIRELY inside one of the available blocks
      const selectionStart = start.getTime();
      const selectionEnd = end.getTime();
      
      const isValid = availableBlocks.some(block => {
        const blockStart = new Date(`${block.date}T${block.startTime}:00`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}:00`).getTime();
        return selectionStart >= blockStart && selectionEnd <= blockEnd;
      });

      if (!isValid) {
        const confirmed = window.confirm("This time is outside the shared availability. Are you sure you want to schedule it here?");
        if (!confirmed) {
          calendarRef.current?.getApi()?.unselect();
          return;
        }
      }
    }


    const newSlot: AvailabilitySlot = {
      id: generateId(),
      date: format(start, "yyyy-MM-dd"),
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
    };

    if (maxHours) {
      const calculateHours = (list: AvailabilitySlot[]) => list.reduce((acc, slot) => {
        const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
        const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
        return acc + (e - s) / (1000 * 60 * 60);
      }, 0);
      const newTotal = calculateHours([...slots, newSlot]);
      if (newTotal > maxHours) {
        import("sonner").then(({ toast }) => {
          toast.error(`Cannot schedule more than the requested ${maxHours} hours.`);
        });
        calendarRef.current?.getApi()?.unselect();
        return;
      }
    }

    const newSlots = [...slots, newSlot];
    setSlots(newSlots);
    onSlotsChange(newSlots);
    
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.unselect();
  };

  const handleEventClick = (info: any) => {
    if (window.confirm("Do you want to delete this availability slot?")) {
      const eventId = info.event.id;
      const newSlots = slots.filter((s, idx) => (s.id || `slot-${idx}`) !== eventId);
      setSlots(newSlots);
      onSlotsChange(newSlots);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          {onReplicateWeek && (
            <Button variant="outline" size="sm" onClick={() => onReplicateWeek(currentDate)}>
              Replicate This Week to Month
            </Button>
          )}
          {onReplicateMonth && (
            <Button variant="outline" size="sm" onClick={() => onReplicateMonth(currentDate)}>
              Copy from Previous Month
            </Button>
          )}
        </div>
        {onSave && (
          <Button 
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-white" 
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
      
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
          navLinks={true} // allows clicking day numbers to navigate
          datesSet={(arg) => setCurrentDate(arg.view.currentStart)}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          selectable={true}
          selectMirror={true}
          events={events}
          select={handleSelect}
          eventClick={handleEventClick}
          height="600px"
          editable={false}
        />
      </div>
    </div>
  );
}
