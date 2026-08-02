"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Video, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMyTeacherSessions, useUpdateSession } from "@/hooks/use-teacher-data";
import { format } from "date-fns";

export default function TeacherClassesPage() {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  const { data: sessions, isLoading } = useMyTeacherSessions();
  const updateSession = useUpdateSession();

  const upcomingClasses = sessions?.filter((s: any) => new Date(s.scheduledStartTime) >= new Date() || s.status === 'SCHEDULED') || [];
  const pastClasses = sessions?.filter((s: any) => s.status === 'COMPLETED' || (new Date(s.scheduledStartTime) < new Date() && s.status !== 'SCHEDULED')) || [];

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-cyan" /></div>;



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
                {upcomingClasses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No upcoming classes.</TableCell>
                  </TableRow>
                )}
                {upcomingClasses.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{format(new Date(cls.scheduledStartTime), "MMM d, yyyy")} - {format(new Date(cls.scheduledStartTime), "h:mm a")}</TableCell>
                    <TableCell>{cls.student?.user?.firstName || "Student"} {cls.student?.user?.lastName}</TableCell>
                    <TableCell>{cls.course?.name}</TableCell>
                    <TableCell>
                      {!cls.meetingLink ? (
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
                        <DialogTrigger render={<Button variant="outline" size="sm" nativeButton={false} onClick={() => {
                          setSelectedClass(cls);
                          setMeetingLink(cls.meetingLink || "");
                        }} />}>
                          <Video className="w-4 h-4 mr-2" />
                          Update Link
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Meeting Link</DialogTitle>
                            <DialogDescription>
                              Set the Zoom or Google Meet link for this session.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Meeting URL</Label>
                              <Input placeholder="https://zoom.us/j/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                              onClick={() => {
                                updateSession.mutate({ sessionId: selectedClass.id, meetingLink });
                              }}
                              disabled={updateSession.isPending}
                            >
                              {updateSession.isPending ? "Saving..." : "Save Link"}
                            </Button>
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
                {pastClasses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No past classes.</TableCell>
                  </TableRow>
                )}
                {pastClasses.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{format(new Date(cls.scheduledStartTime), "MMM d, yyyy")}</TableCell>
                    <TableCell>{cls.student?.user?.firstName || "Student"} {cls.student?.user?.lastName}</TableCell>
                    <TableCell>{cls.course?.name}</TableCell>
                    <TableCell>1.0h</TableCell>
                    <TableCell className="text-right">
                      {cls.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Evaluated
                        </span>
                      ) : (
                        <Dialog>
                          <DialogTrigger render={<Button variant="default" size="sm" nativeButton={false} className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => {
                            setSelectedClass(cls);
                            setNotes(cls.notes || "");
                          }} />}>
                            <Edit className="w-4 h-4 mr-2" />
                            Evaluate
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Class Evaluation</DialogTitle>
                              <DialogDescription>
                                Finalize details for this session.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Actual Duration (Hours)</Label>
                                <Input type="number" step="0.5" defaultValue="1.0" />
                              </div>
                              <div className="space-y-2">
                                <Label>Topics Covered / Notes</Label>
                                <Input placeholder="e.g. Kinematics, Newton's Laws" value={notes} onChange={(e) => setNotes(e.target.value)} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                                onClick={() => {
                                  updateSession.mutate({ sessionId: selectedClass.id, status: "COMPLETED", notes });
                                }}
                                disabled={updateSession.isPending}
                              >
                                {updateSession.isPending ? "Submitting..." : "Submit Evaluation"}
                              </Button>
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
