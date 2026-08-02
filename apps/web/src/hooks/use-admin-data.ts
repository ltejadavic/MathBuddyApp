import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// --- Users ---
export function useAllUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users");
      return data;
    },
  });
}

// Update user role or status
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, ...dataToUpdate }: { userId: string; [key: string]: any }) => {
      const { data } = await apiClient.patch(`/users/${userId}`, dataToUpdate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// --- Academic Setup ---
export function useAllPrograms() {
  return useQuery({
    queryKey: ["admin", "programs"],
    queryFn: async () => {
      const { data } = await apiClient.get("/academic/programs");
      return data;
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (programData: any) => {
      const { data } = await apiClient.post("/academic/programs", programData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useAllCourses() {
  return useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data } = await apiClient.get("/academic/courses");
      return data;
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseData: any) => {
      const { data } = await apiClient.post("/academic/courses", courseData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] }); // since programs contain courses
    },
  });
}

// --- Financials ---
export function useFinancialSummary() {
  return useQuery({
    queryKey: ["admin", "financials", "summary"],
    queryFn: async () => {
      // Typically an aggregated endpoint
      // We'll mock it for now
      return {
        revenue: 4250,
        expenses: 1200,
        profit: 3050,
        pendingTeacherPayments: 800
      };
    },
  });
}
