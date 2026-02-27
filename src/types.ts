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
  tax_rule_id?: string;
  side_fees?: string;
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

export interface UpdateTaxRulePayload {
  tax_type: TaxType;
  rate: string;
  effective_from: string;
  effective_to?: string;
  description?: string;
}

export interface ActiveTaxRate {
  tax_type: string;
  rate: string;
  rule_id: string;
}

export interface Expense {
  id: string;
  order_id: string | null;
  vendor_id: string | null;
  currency: string;
  exchange_rate: string;
  original_amount: string;
  converted_amount_usd: string;
  is_foreign_vendor: boolean;
  fct_type: string;
  fct_rate: string;
  fct_amount: string;
  total_payable: string;
  vat_rate: string;
  vat_amount: string;
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

// --- ROLE & PERMISSION TYPES ---

export interface Permission {
  id: string;
  code: string;
  name: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name: string;
  description: string;
}

export interface UpdateRolePermissionsPayload {
  permission_ids: string[];
}

// --- INVOICE & FINANCE TYPES ---

export type ReferenceType = "ORDER_IMPORT" | "ORDER_EXPORT" | "EXPENSE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Invoice {
  id: string;
  invoice_no: string;
  reference_type: ReferenceType;
  reference_id: string;
  tax_rule_id: string | null;
  tax_type: string | null;
  tax_rate: string | null;
  subtotal: string;
  tax_amount: string;
  side_fees: string;
  total_amount: string;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  note: string;
  created_at: string;
}

export interface CreateInvoicePayload {
  reference_type: ReferenceType;
  reference_id: string;
  tax_rule_id?: string;
  subtotal: string;
  side_fees?: string;
  note?: string;
}

export interface RevenueDataPoint {
  period: string;
  total_revenue: string;
  total_expense: string;
  total_tax_collected: string;
  total_tax_paid: string;
  total_side_fees: string;
}

// --- APPROVAL REQUEST TYPES ---

export type ApprovalRequestType =
  | "CREATE_ORDER"
  | "CREATE_PRODUCT"
  | "CREATE_EXPENSE";

export interface ApprovalRequest {
  id: string;
  request_type: ApprovalRequestType;
  reference_id: string;
  request_data: string;
  status: ApprovalStatus;
  requested_by: string | null;
  requester_name: string;
  approved_by: string | null;
  approver_name: string;
  approved_at: string | null;
  rejection_reason: string;
  created_at: string;
}
