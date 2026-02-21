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
