import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { Invoice, CreateInvoicePayload } from "@/types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  byStatus: (status: string) => ["invoices", status] as const,
};

export function useGetInvoices(status?: string) {
  return useQuery<Invoice[]>({
    queryKey: status ? invoiceKeys.byStatus(status) : invoiceKeys.all,
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const response = await api.get(`/api/invoices${params}`);
      return response.data.data || [];
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
