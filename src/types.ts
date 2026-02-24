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

// --- TAX & EXPENSE TYPES ---

export type CurrencyCode = "VND" | "USD" | "EUR" | "JPY" | "CNY" | "KRW";
export type TaxType = "VAT_INLAND" | "VAT_INTL" | "FCT";
export type DocumentType =
  | "VAT_INVOICE"
  | "DIRECT_INVOICE"
  | "RETAIL_RECEIPT"
  | "NONE";
export type FCTType = "NET" | "GROSS";

export interface TaxRule {
  id: string;
  tax_type: TaxType;
  rate: string;
  effective_from: string;
  effective_to: string | null;
  description: string;
  created_at: string;
}

export interface CreateTaxRulePayload {
  tax_type: TaxType;
  rate: string;
  effective_from: string;
  effective_to?: string;
  description?: string;
}

export interface Expense {
  id: string;
  order_id: string | null;
  vendor_id: string | null;
  currency: string;
  exchange_rate: string;
  original_amount: string;
  converted_amount_vnd: string;
  is_foreign_vendor: boolean;
  fct_type: string;
  fct_rate: string;
  fct_amount_vnd: string;
  total_payable: string;
  document_type: DocumentType;
  vendor_tax_code: string | null;
  document_url: string;
  is_deductible_expense: boolean;
  description: string;
  created_at: string;
}

export interface CreateExpensePayload {
  order_id?: string;
  vendor_id?: string;
  currency: CurrencyCode;
  exchange_rate: string;
  original_amount: string;
  is_foreign_vendor: boolean;
  fct_type?: FCTType;
  document_type: DocumentType;
  vendor_tax_code?: string;
  document_url?: string;
  description?: string;
}
