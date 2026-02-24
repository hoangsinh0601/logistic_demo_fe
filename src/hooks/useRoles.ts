import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  Role,
  Permission,
  CreateRolePayload,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from "@/types";

export const roleKeys = {
  all: ["roles"] as const,
  detail: (id: string) => ["roles", id] as const,
  permissions: ["permissions"] as const,
};

export function useGetRoles() {
  return useQuery<Role[]>({
    queryKey: roleKeys.all,
    queryFn: async () => {
      const response = await api.get("/api/roles");
      return response.data.data || [];
    },
  });
}

export function useGetPermissions() {
  return useQuery<Permission[]>({
    queryKey: roleKeys.permissions,
    queryFn: async () => {
      const response = await api.get("/api/permissions");
      return response.data.data || [];
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRolePayload) => {
      const response = await api.post("/api/roles", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRolePayload;
    }) => {
      const response = await api.put(`/api/roles/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRolePermissionsPayload;
    }) => {
      const response = await api.put(`/api/roles/${id}/permissions`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
