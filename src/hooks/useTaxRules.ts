import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { TaxRule, CreateTaxRulePayload } from "@/types";

export const taxRuleKeys = {
  all: ["tax-rules"] as const,
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
