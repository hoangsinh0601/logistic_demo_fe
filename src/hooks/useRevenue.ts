import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { RevenueDataPoint } from "@/types";

export const revenueKeys = {
  all: ["revenue"] as const,
  byFilter: (groupBy: string, startDate?: string, endDate?: string) =>
    ["revenue", groupBy, startDate, endDate] as const,
};

export function useGetRevenue(
  groupBy: string = "month",
  startDate?: string,
  endDate?: string,
) {
  return useQuery<RevenueDataPoint[]>({
    queryKey: revenueKeys.byFilter(groupBy, startDate, endDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("group_by", groupBy);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await api.get(
        `/api/statistics/revenue?${params.toString()}`,
      );
      return response.data.data || [];
    },
    refetchInterval: 300000, // 5 minutes
  });
}
