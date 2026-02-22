import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
} from "@/types";

// ------------- KEYS -------------
export const userKeys = {
  all: ["users"] as const,
  paginated: (page: number, limit: number) =>
    [...userKeys.all, { page, limit }] as const,
};

// ------------- QUERIES -------------
export function useGetUsers(page: number = 1, limit: number = 10) {
  return useQuery<PaginatedResponse<User>["data"]>({
    queryKey: userKeys.paginated(page, limit),
    queryFn: async () => {
      const response = await api.get("/users", { params: { page, limit } });
      return response.data.data;
    },
  });
}

// ------------- MUTATIONS -------------
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const response = await api.post("/users", payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch globally when creation is successful
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserPayload;
    }) => {
      const response = await api.put(`/users/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
