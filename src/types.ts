export interface Product {
  id: string;
  sku: string;
  name: string;
  current_stock: number;
  price: number;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  price: number;
}

export interface UpdateProductPayload {
  sku: string;
  name: string;
  price: number;
}

export interface OrderItemPayload {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderPayload {
  order_code: string;
  type: "IMPORT" | "EXPORT";
  note: string;
  items: OrderItemPayload[];
}

export interface WsMessage {
  event: string;
  data: {
    product_id: string;
    new_stock: number;
  };
}

// --- USER MANAGEMENT TYPES ---

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
}

export interface PaginatedResponse<T> {
  data: {
    users: T[];
    total: number;
    page: number;
    limit: number;
  };
}
