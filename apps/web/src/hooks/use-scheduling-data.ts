import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

// --- Availability ---

export function useMyStudentAvailability() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["student-availability", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/availability/student/${user?.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useStudentAvailability(studentId?: string) {
  return useQuery({
    queryKey: ["student-availability", studentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/availability/student/${studentId}`);
      return data;
    },
    enabled: !!studentId,
  });
}

export function useUpdateStudentAvailability() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (availabilityData: any) => {
      const { data } = await apiClient.post("/availability/student", availabilityData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-availability", user?.id] });
    },
  });
}

export function useMyTeacherAvailability() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["teacher-availability", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/availability/teacher/${user?.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useTeacherAvailability(teacherId?: string) {
  return useQuery({
    queryKey: ["teacher-availability", teacherId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/availability/teacher/${teacherId}`);
      return data;
    },
    enabled: !!teacherId,
  });
}

export function useUpdateTeacherAvailability() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (availabilityData: any) => {
      const { data } = await apiClient.post("/availability", availabilityData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-availability", user?.id] });
    },
  });
}

export function useMatchmakingAvailability(studentId: string, teacherId: string) {
  return useQuery({
    queryKey: ["matchmaking", studentId, teacherId],
    queryFn: async () => {
      if (!studentId || !teacherId) return { studentAvailability: [], teacherAvailability: [] };
      const { data } = await apiClient.get(`/availability/match/${studentId}/${teacherId}`);
      return data;
    },
    enabled: !!studentId && !!teacherId,
  });
}

// --- Class Requests ---

export function useMyClassRequests() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["class-requests", "student", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/requests?studentId=${user?.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAllClassRequests(status?: string) {
  return useQuery({
    queryKey: ["class-requests", "all", status],
    queryFn: async () => {
      const url = status ? `/requests?status=${status}` : '/requests';
      const { data } = await apiClient.get(url);
      return data;
    },
  });
}

export function useCreateClassRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestData: any) => {
      const { data } = await apiClient.post("/requests", requestData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-requests"] });
    },
  });
}

export function useResolveClassRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/requests/${id}/resolve`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-requests"] });
    },
  });
}

export function useScheduleMatchedClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleData: any) => {
      const { data } = await apiClient.post("/sessions/matchmaking/schedule", scheduleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-requests"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] }); // For hours update
    },
  });
}

export function useSchedules(studentId?: string, teacherId?: string) {
  return useQuery({
    queryKey: ['schedules', studentId, teacherId],
    queryFn: async () => {
      if (!studentId) return [];
      const params: any = { studentId };
      if (teacherId) params.teacherId = teacherId;
      const { data } = await apiClient.get('/sessions/schedules/list', { params });
      return data;
    },
    enabled: !!studentId,
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: any }) => {
      const res = await apiClient.put(`/sessions/schedules/${courseId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-availability'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    }
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, studentId, teacherId }: { courseId: string, studentId: string, teacherId: string }) => {
      const res = await apiClient.delete(`/sessions/schedules/${courseId}`, { params: { studentId, teacherId } });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['students'] }); // for balance
      toast.success('Schedule deleted and hours refunded');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  });
}
