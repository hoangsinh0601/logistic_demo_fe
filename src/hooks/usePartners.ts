import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  Partner,
  CreatePartnerPayload,
  UpdatePartnerPayload,
} from "@/types";

export const partnerKeys = {
  all: ["partners"] as const,
  list: (filters: Record<string, string | number>) =>
    ["partners", filters] as const,
};

interface PaginatedPartners {
  data: Partner[];
  total: number;
  page: number;
  limit: number;
}

export function usePartners(
  type?: string,
  search?: string,
  page = 1,
  limit = 20,
) {
  return useQuery<PaginatedPartners>({
    queryKey: partnerKeys.list({
      type: type ?? "",
      search: search ?? "",
      page,
      limit,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const response = await api.get(`/api/partners?${params.toString()}`);
      const res = response.data.data;
      return {
        data: res.items ?? [],
        total: res.total,
        page: res.page,
        limit: res.limit,
      };
    },
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePartnerPayload) => {
      const response = await api.post("/api/partners", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdatePartnerPayload & { id: string }) => {
      const response = await api.put(`/api/partners/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/partners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}
