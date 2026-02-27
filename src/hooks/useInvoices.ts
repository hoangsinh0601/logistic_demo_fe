import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { Invoice, CreateInvoicePayload } from "@/types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  byStatus: (status: string) => ["invoices", status] as const,
};

// ------------- TYPES -------------
interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export function useGetInvoices(status?: string, page = 1, limit = 20) {
  return useQuery<PaginatedInvoices>({
    queryKey: status
      ? [...invoiceKeys.byStatus(status), page, limit]
      : [...invoiceKeys.all, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const response = await api.get(`/api/invoices?${params.toString()}`);
      return response.data.data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      const response = await api.post("/api/invoices", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/api/invoices/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useRejectInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/api/invoices/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
