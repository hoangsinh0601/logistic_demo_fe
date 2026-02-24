import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  TaxRule,
  CreateTaxRulePayload,
  UpdateTaxRulePayload,
  ActiveTaxRate,
} from "@/types";

export const taxRuleKeys = {
  all: ["tax-rules"] as const,
  active: (type: string) => ["tax-rules", "active", type] as const,
};

export function useGetTaxRules() {
  return useQuery<TaxRule[]>({
    queryKey: taxRuleKeys.all,
    queryFn: async () => {
      const response = await api.get("/api/tax-rules");
      return response.data.data || [];
    },
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
