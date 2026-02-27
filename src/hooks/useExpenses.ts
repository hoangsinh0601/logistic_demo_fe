import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { Expense, CreateExpensePayload } from "@/types";

export const expenseKeys = {
  all: ["expenses"] as const,
};

// ------------- TYPES -------------
interface PaginatedExpenses {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
}

export function useGetExpenses(page = 1, limit = 20) {
  return useQuery<PaginatedExpenses>({
    queryKey: [...expenseKeys.all, page, limit],
    queryFn: async () => {
      const response = await api.get(
        `/api/expenses?page=${page}&limit=${limit}`,
      );
      return response.data.data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const response = await api.post("/api/expenses", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
