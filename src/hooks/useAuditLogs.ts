import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { PaginatedResponse } from "../types";

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  entity_id: string;
  entity_name?: string;
  details: string;
  created_at: string;
}

export const auditKeys = {
  all: ["auditLogs"] as const,
  paginated: (page: number, limit: number) =>
    [...auditKeys.all, { page, limit }] as const,
};

export function useGetAuditLogs(page: number, limit: number) {
  return useQuery<PaginatedResponse<AuditLog>["data"]>({
    queryKey: auditKeys.paginated(page, limit),
    queryFn: async () => {
      const response = await api.get("/api/audit-logs", {
        params: { page, limit },
      });
      return response.data.data;
    },
  });
}
