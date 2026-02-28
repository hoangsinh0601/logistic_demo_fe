import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  TaxRule,
  CreateTaxRulePayload,
  UpdateTaxRulePayload,
  ActiveTaxRate,
} from "@/types";

export const taxRuleKeys = {
  all: ["tax-rules"] as const,
  search: (q: string) => ["tax-rules", "search", q] as const,
  active: (type: string) => ["tax-rules", "active", type] as const,
};

// ------------- TYPES -------------
interface PaginatedTaxRules {
  items: TaxRule[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export function useGetTaxRules(page = 1, limit = 20) {
  return useQuery<PaginatedTaxRules>({
    queryKey: [...taxRuleKeys.all, page, limit],
    queryFn: async () => {
      const response = await api.get(
        `/api/tax-rules?page=${page}&limit=${limit}`,
      );
      return response.data.data;
    },
  });
}

export function useSearchTaxRules(search: string, limit = 20) {
  return useInfiniteQuery<PaginatedTaxRules>({
    queryKey: taxRuleKeys.search(search),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const response = await api.get(`/api/tax-rules?${params.toString()}`);
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetActiveTaxRate(taxType: string) {
  return useQuery<ActiveTaxRate | null>({
    queryKey: taxRuleKeys.active(taxType),
    queryFn: async () => {
      const response = await api.get(`/api/tax-rules/active?type=${taxType}`);
      return response.data.data || null;
    },
    retry: false,
  });
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaxRulePayload) => {
      const response = await api.post("/api/tax-rules", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRuleKeys.all });
    },
  });
}

export function useUpdateTaxRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTaxRulePayload;
    }) => {
      const response = await api.put(`/api/tax-rules/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRuleKeys.all });
    },
  });
}

export function useDeleteTaxRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/tax-rules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRuleKeys.all });
    },
  });
}
