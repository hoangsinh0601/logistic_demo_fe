import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";

export function useApproveWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (approvalID: string) => {
      const res = await api.put(
        `/api/approvals/${approvalID}/approve-warehouse`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useApproveAccounting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (approvalID: string) => {
      const res = await api.put(
        `/api/approvals/${approvalID}/approve-accounting`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRejectWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.put(`/api/approvals/${id}/reject-warehouse`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRejectAccounting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.put(`/api/approvals/${id}/reject-accounting`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export interface Shipment {
  id: string;
  order_id: string;
  tracking_code: string;
  carrier_name: string;
  status: "PREPARING" | "IN_TRANSIT" | "DELIVERED";
  current_location: string;
  created_at: string;
  updated_at: string;
}

export function useOrderShipment(orderId: string | null) {
  return useQuery<Shipment>({
    queryKey: ["shipments", orderId],
    queryFn: async () => {
      const res = await api.get(`/api/orders/${orderId}/shipment`);
      return res.data.data;
    },
    enabled: !!orderId,
  });
}

interface ShipmentListResponse {
  items: Shipment[];
  total: number;
  page: number;
  limit: number;
}

export function useListShipments(page: number, limit: number, search: string) {
  return useQuery<ShipmentListResponse>({
    queryKey: ["shipments", "list", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const res = await api.get(`/api/shipments?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      current_location,
    }: {
      id: string;
      status: string;
      current_location?: string;
    }) => {
      const res = await api.put(`/api/shipments/${id}/status`, {
        status,
        current_location: current_location || "",
      });
      return res.data.data as Shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export interface ShipmentHistoryItem {
  id: string;
  old_status: string;
  new_status: string;
  location: string;
  changed_by: string;
  note: string;
  created_at: string;
}

export function useShipmentHistory(shipmentId: string | null) {
  return useQuery<ShipmentHistoryItem[]>({
    queryKey: ["shipments", shipmentId, "history"],
    queryFn: async () => {
      const res = await api.get(`/api/shipments/${shipmentId}/history`);
      return res.data.data;
    },
    enabled: !!shipmentId,
  });
}
