import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  OrderPayload,
} from "@/types";

// ------------- KEYS -------------
export const productKeys = {
  all: ["products"] as const,
};

// ------------- QUERIES -------------
export function useGetProducts() {
  return useQuery<Product[]>({
    queryKey: productKeys.all,
    queryFn: async () => {
      const response = await api.get("/api/products");
      return response.data.data || [];
    },
  });
}

// ------------- MUTATIONS -------------
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const response = await api.post("/api/products", payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch globally when creation is successful
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => {
      const response = await api.put(`/api/products/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OrderPayload) => {
      const response = await api.post("/api/orders", payload);
      return response.data;
    },
    onSuccess: () => {
      // Creating an order manipulates stock levels, invalidate globally
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
