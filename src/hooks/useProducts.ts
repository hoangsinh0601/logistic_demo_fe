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

// ------------- TYPES -------------
interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// ------------- QUERIES -------------
export function useGetProducts(page = 1, limit = 20) {
  return useQuery<PaginatedProducts>({
    queryKey: [...productKeys.all, page, limit],
    queryFn: async () => {
      const response = await api.get(
        `/api/products?page=${page}&limit=${limit}`,
      );
      return response.data.data;
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
      // Order also creates an invoice, refresh invoice list
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
