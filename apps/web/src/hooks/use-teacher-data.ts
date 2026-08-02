import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export function useMyTeacherSessions() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["my-teacher-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await apiClient.get(`/sessions?teacherId=${user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, ...dataToUpdate }: { sessionId: string; [key: string]: any }) => {
      const { data } = await apiClient.patch(`/sessions/${sessionId}`, dataToUpdate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teacher-sessions"] });
    },
  });
}

export function useUploadResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title, courseId }: { file: File, title: string, courseId: string }) => {
      // 1. Get presigned URL
      const { data: presign } = await apiClient.post("/storage/presign-upload", {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      // 2. Upload to S3 directly using fetch to avoid axios interceptors messing with it
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      // 3. Register resource in DB
      const { data: resource } = await apiClient.post("/storage/resources", {
        title,
        fileKey: presign.fileKey,
        courseId,
        fileType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      return resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useMyAvailability() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["my-availability", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await apiClient.get(`/availability/${user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (availabilities: { dayOfWeek: number, startTime: string, endTime: string, timeZone: string }[]) => {
      // Typically we'd have a bulk update endpoint. For MVP, we might just call POST /availability multiple times
      // However, to keep it simple, we'll just pretend it works or call it for the first item
      // Actually let's just make one call per availability
      for (const av of availabilities) {
        await apiClient.post("/availability", {
          teacherId: user?.id,
          ...av
        });
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
    },
  });
}
