import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { ApprovalRequest } from "@/types";

export const approvalKeys = {
  all: ["approvals"] as const,
  byStatus: (status: string) => ["approvals", status] as const,
};

export function useGetApprovals(status?: string) {
  return useQuery<ApprovalRequest[]>({
    queryKey: status ? approvalKeys.byStatus(status) : approvalKeys.all,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("limit", "100");
      const response = await api.get(`/api/approvals?${params.toString()}`);
      return response.data.data || [];
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/api/approvals/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.put(`/api/approvals/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}
