import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export interface ProductRanking {
  product_id: string;
  product_name: string;
  product_sku: string;
  total_quantity: number;
  total_value: number;
}

export interface StatisticsResponse {
  total_import_value: number;
  total_export_value: number;
  profit: number;
  top_imported_items: ProductRanking[];
  top_exported_items: ProductRanking[];
  time_range_start_date: string;
  time_range_end_date: string;
}

export const useGetStatistics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["statistics", startDate, endDate],
    queryFn: async (): Promise<StatisticsResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/api/statistics${queryString}`);
      return res.data.data;
    },
    // Refetch every 5 minutes automatically to keep metrics fresh
    refetchInterval: 300000,
  });
};
