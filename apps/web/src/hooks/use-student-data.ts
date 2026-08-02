import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me");
      return data;
    },
  });
}

export function useMySessions() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["my-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await apiClient.get(`/sessions?studentId=${user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useMyLedger() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["my-ledger", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await apiClient.get(`/ledger/${user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await apiClient.get("/courses");
      return data;
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users");
      return data;
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: any) => {
      const { data } = await apiClient.post("/sessions", sessionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
    },
  });
}

export function useResourcesByCourse(courseId: string) {
  return useQuery({
    queryKey: ["resources", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data } = await apiClient.get(`/storage/resources/course/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useMyResources() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["my-resources", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/storage/resources/my-files`);
      return data;
    },
    enabled: !!user?.id,
  });
}
