"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { useState } from "react";
export default function StudentSchedulePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Mock available slots
  const availableSlots = [
    { id: 1, teacher: "Mr. Smith", course: "SAT Math Prep", date: "Today, 4:00 PM", duration: "1.5 hrs" },
    { id: 2, teacher: "Ms. Johnson", course: "IB Physics", date: "Tomorrow, 5:30 PM", duration: "1 hr" },
    { id: 3, teacher: "Mr. Davis", course: "Calculus", date: "Friday, 3:00 PM", duration: "2 hrs" },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSlots.map((slot) => (
              <Card key={slot.id} className="rounded-lg border-gray-200 dark:border-gray-800 shadow-none hover:border-brand-cyan transition-colors">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{slot.course}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-2" />
                      {slot.teacher}
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

                  <Dialog>
                    <DialogTrigger render={
                      <Button 
                        variant="outline" 
                        className="w-full text-brand-cyan border-brand-cyan hover:bg-brand-cyan hover:text-white"
                        onClick={() => setSelectedSlot(slot)}
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
                          <p className="text-sm font-medium">Course: {selectedSlot?.course}</p>
                          <p className="text-sm">Teacher: {selectedSlot?.teacher}</p>
                          <p className="text-sm">When: {selectedSlot?.date}</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">Confirm Booking</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
