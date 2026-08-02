"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCourses, useUsers, useCreateSession, useMyProfile } from "@/hooks/use-student-data";
import { addDays, format, setHours, setMinutes } from "date-fns";

export default function StudentSchedulePage() {
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: profile } = useMyProfile();
  const createSession = useCreateSession();

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
          Book a Class
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Find available teachers and schedule your next session.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Available Slots</CardTitle>
          <CardDescription>Select a time slot to book your class. Hours will be deducted automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses || isLoadingUsers ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSlots.map((slot: any) => (
              <Card key={slot.id} className="rounded-lg border-gray-200 dark:border-gray-800 shadow-none hover:border-brand-cyan transition-colors">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{slot.courseName}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-2" />
                      {slot.teacherName}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="w-4 h-4 mr-2 text-brand-cyan" />
                      {slot.date}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-brand-cyan" />
                      {slot.duration}
                    </div>
                  </div>

                  <Dialog open={isDialogOpen && selectedSlot?.id === slot.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (open) setSelectedSlot(slot);
                    else setSelectedSlot(null);
                  }}>
                    <DialogTrigger render={
                      <Button 
                        variant="outline" 
                        className="w-full text-brand-cyan border-brand-cyan hover:bg-brand-cyan hover:text-white"
                      />
                    }>
                      Book Slot
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Confirm Booking</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to book this class? 
                          This action will deduct <strong>{slot.duration}</strong> from your active package balance.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2 rounded-md bg-gray-50 dark:bg-gray-900 p-4 border border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-medium">Course: {selectedSlot?.courseName}</p>
                          <p className="text-sm">Teacher: {selectedSlot?.teacherName}</p>
                          <p className="text-sm">When: {selectedSlot?.date}</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createSession.isPending}>Cancel</Button>
                        <Button 
                          className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                          disabled={createSession.isPending}
                          onClick={() => {
                            if (!selectedSlot?.courseId) {
                                alert("Missing Course ID");
                                return;
                            }
                            createSession.mutate({
                              courseId: selectedSlot.courseId,
                              teacherId: selectedSlot.teacherId,
                              scheduledStartTime: selectedSlot.dateObj,
                              scheduledEndTime: addDays(selectedSlot.dateObj, 0).setMinutes(selectedSlot.dateObj.getMinutes() + selectedSlot.durationMins), // Just add duration
                              meetingLink: "https://zoom.us/j/mock",
                              notes: "Booked by student"
                            }, {
                              onSuccess: () => {
                                setIsDialogOpen(false);
                                alert("Class booked successfully!");
                              }
                            });
                          }}
                        >
                          {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Confirm Booking
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
