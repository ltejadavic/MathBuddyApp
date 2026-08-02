"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Video, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function TeacherClassesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const upcomingClasses = [
    { id: 1, student: "Alice Smith", course: "SAT Math Prep", date: "Aug 5, 2026", time: "4:00 PM", status: "PENDING_LINK" },
    { id: 2, student: "Bob Johnson", course: "IB Physics", date: "Aug 6, 2026", time: "6:00 PM", status: "READY" },
  ];

  const pastClasses = [
    { id: 3, student: "Alice Smith", course: "SAT Math Prep", date: "Jul 28, 2026", time: "4:00 PM", status: "COMPLETED", duration: "1.5h" },
    { id: 4, student: "Bob Johnson", course: "IB Physics", date: "Jul 25, 2026", time: "6:00 PM", status: "PENDING_EVALUATION", duration: "1.0h" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Class Management
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Update meeting links, record attendance, and evaluate completed sessions.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
          <CardDescription>Add Zoom/Meet links to pending sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.date} - {cls.time}</TableCell>
                    <TableCell>{cls.student}</TableCell>
                    <TableCell>{cls.course}</TableCell>
                    <TableCell>
                      {cls.status === 'PENDING_LINK' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Link Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Ready
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger render={<Button variant="outline" size="sm" onClick={() => setSelectedClass(cls)} />}>
                          <Video className="w-4 h-4 mr-2" />
                          Update Link
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Meeting Link</DialogTitle>
                            <DialogDescription>
                              Set the Zoom or Google Meet link for {selectedClass?.student}&apos;s session.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Meeting URL</Label>
                              <Input placeholder="https://zoom.us/j/..." />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">Save Link</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Past Classes (Needs Evaluation)</CardTitle>
          <CardDescription>Record final duration and topics covered to receive payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.date}</TableCell>
                    <TableCell>{cls.student}</TableCell>
                    <TableCell>{cls.course}</TableCell>
                    <TableCell>{cls.duration}</TableCell>
                    <TableCell className="text-right">
                      {cls.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Evaluated
                        </span>
                      ) : (
                        <Dialog>
                          <DialogTrigger render={<Button variant="default" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => setSelectedClass(cls)} />}>
                            <Edit className="w-4 h-4 mr-2" />
                            Evaluate
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Class Evaluation</DialogTitle>
                              <DialogDescription>
                                Finalize details for {selectedClass?.student}&apos;s session.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Actual Duration (Hours)</Label>
                                <Input type="number" step="0.5" defaultValue="1.0" />
                              </div>
                              <div className="space-y-2">
                                <Label>Topics Covered</Label>
                                <Input placeholder="e.g. Kinematics, Newton's Laws" />
                              </div>
                              <div className="space-y-2">
                                <Label>Private Notes (Admin only)</Label>
                                <Input placeholder="Notes about student behavior..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">Submit Evaluation</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
