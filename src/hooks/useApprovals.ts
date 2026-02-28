import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { ApprovalRequest } from "@/types";

export const approvalKeys = {
  all: ["approvals"] as const,
  byStatus: (status: string) => ["approvals", status] as const,
};

// ------------- TYPES -------------
interface PaginatedApprovals {
  approvals: ApprovalRequest[];
  total: number;
  page: number;
  limit: number;
}

export function useGetApprovals(status?: string, page = 1, limit = 20) {
  return useQuery<PaginatedApprovals>({
    queryKey: status
      ? [...approvalKeys.byStatus(status), page, limit]
      : [...approvalKeys.all, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const response = await api.get(`/api/approvals?${params.toString()}`);
      const result = response.data.data;
      // Handle both formats: {approvals, total} or {data: [...], total}
      if (result?.approvals) {
        return result;
      }
      return {
        approvals: result?.data || result || [],
        total: result?.total || 0,
        page,
        limit,
      };
    },
  });
}

export function useGetApprovalDetail(id: string | null) {
  return useQuery<ApprovalRequest>({
    queryKey: ["approvals", "detail", id],
    queryFn: async () => {
      const response = await api.get(`/api/approvals/${id}`);
      return response.data.data;
    },
    enabled: !!id,
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
