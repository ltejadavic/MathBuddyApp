"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMyAvailability, useUpdateAvailability } from "@/hooks/use-teacher-data";
import { Loader2 } from "lucide-react";

export default function TeacherSchedulePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const hours = ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"];

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const { data: availabilities, isLoading } = useMyAvailability();
  const updateAvailability = useUpdateAvailability();

  useEffect(() => {
    if (availabilities) {
      const newSlots = new Set<string>();
      availabilities.forEach((av: any) => {
        const day = days[av.dayOfWeek];
        // Match hour, e.g. "09:00" to "09:00 AM". Simple matching for MVP.
        const hour = hours.find(h => {
          const hh = parseInt(h.split(":")[0]);
          const isPM = h.includes("PM");
          const military = (isPM && hh !== 12 ? hh + 12 : (hh === 12 && !isPM ? 0 : hh)).toString().padStart(2, "0");
          return av.startTime.startsWith(military);
        });
        if (hour) newSlots.add(`${day}-${hour}`);
      });
      setSelectedSlots(newSlots);
    }
  }, [availabilities]);

  const toggleSlot = (day: string, hour: string) => {
    const key = `${day}-${hour}`;
    const newSlots = new Set(selectedSlots);
    if (newSlots.has(key)) {
      newSlots.delete(key);
    } else {
      newSlots.add(key);
    }
    setSelectedSlots(newSlots);
  };

  const handleSave = () => {
    const payload = Array.from(selectedSlots).map(slot => {
      const [day, hour] = slot.split("-");
      const dayOfWeek = days.indexOf(day);
      const hh = parseInt(hour.split(":")[0]);
      const isPM = hour.includes("PM");
      const military = (isPM && hh !== 12 ? hh + 12 : (hh === 12 && !isPM ? 0 : hh)).toString().padStart(2, "0");
      const startTime = `${military}:00`;
      const endTime = `${military}:59`;
      return { dayOfWeek, startTime, endTime, timeZone: "America/Lima" };
    });
    updateAvailability.mutate(payload, {
      onSuccess: () => alert("Availability saved! (Note: duplicates may throw errors in MVP without a bulk overwrite API)")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Availability & Scheduling
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Set your weekly recurring availability for students to book classes.
          </p>
        </div>
        <Button 
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-white" 
          onClick={handleSave}
          disabled={updateAvailability.isPending}
        >
          {updateAvailability.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Availability
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Weekly Recurring Grid</CardTitle>
          <CardDescription>Click on the slots to mark yourself as available.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
          ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Grid Header */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-medium text-sm text-muted-foreground p-2 text-center">Time</div>
                {days.map(day => (
                  <div key={day} className="font-semibold text-sm text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {day.substring(0, 3)}
                  </div>
                ))}
              </div>
              
              {/* Grid Body */}
              <div className="space-y-2">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center justify-center p-2">
                      {hour}
                    </div>
                    {days.map(day => {
                      const isSelected = selectedSlots.has(`${day}-${hour}`);
                      return (
                        <button
                          key={`${day}-${hour}`}
                          onClick={() => toggleSlot(day, hour)}
                          className={`h-12 rounded-lg transition-colors border ${
                            isSelected 
                              ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' 
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-brand-cyan/50'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-bold">Available</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
