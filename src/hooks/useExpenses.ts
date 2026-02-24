import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type { Expense, CreateExpensePayload } from "@/types";

export const expenseKeys = {
  all: ["expenses"] as const,
};

export function useGetExpenses() {
  return useQuery<Expense[]>({
    queryKey: expenseKeys.all,
    queryFn: async () => {
      const response = await api.get("/api/expenses");
      return response.data.data || [];
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
