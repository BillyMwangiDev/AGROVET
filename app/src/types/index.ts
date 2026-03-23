// ── Category & Product ────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  icon: string;
  parent: number | null;
  is_admin_only: boolean;
  is_active: boolean;
  subcategory_count: number;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: number;
  category_name: string;
  category_slug: string;
  price: string; // Django DecimalField → string on wire; use parseDecimal()
  unit: string;
  package_size: string;
  description: string;
  image: string | null;
  additional_images: ProductImage[];
  is_active: boolean;
  is_featured: boolean;
  stock_status: "out_of_stock" | "low" | "moderate" | "stocked";
  in_stock: boolean;
  meta_title: string;
  meta_description: string;
  // AI semen fields
  is_ai_product: boolean;
  breed: string;
  origin_country: string;
  sire_code: string | null;
  genetic_traits: Record<string, string>;
}

export interface AdminProduct extends Product {
  // Full admin view includes inventory fields
  stock_level: number;
  reorder_point: number;
  max_stock: number;
  expiry_date: string | null;
  supplier: string;
  supplier_ref: string | null;
  supplier_name: string | null;
  last_restocked: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSearchSuggestion {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: string;
  price: string;
  in_stock: boolean;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  price_min?: string;
  price_max?: string;
  stock?: "in_stock" | "out_of_stock";
  sort?: "name" | "name_desc" | "price" | "price_desc" | "newest" | "featured" | "best_selling";
  is_ai?: boolean;
  featured?: boolean;
  limit?: string;
  page?: number;
}

// ── Cart & Orders ─────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  product: string; // product UUID
  product_name: string;
  product_image: string | null;
  product_slug: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  total_amount: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: number;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  notes: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  payment_method: "cash" | "mpesa" | "card" | "bank_transfer";
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ── Sale types (POS) ──────────────────────────────────────────────────────

export interface SaleItem {
  id: string;
  product: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Sale {
  id: string;
  receipt_number: string;
  customer: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  payment_method: "cash" | "mpesa" | "card";
  status: "completed" | "pending" | "cancelled";
  is_return: boolean;
  parent_sale: string | null;
  parent_receipt_number: string | null;
  served_by: string | null;
  served_by_name: string | null;
  items: SaleItem[];
  created_at: string;
}

// ── AI Record types ───────────────────────────────────────────────────────

export interface AIRecord {
  id: string;
  farmer_name: string;
  farmer_phone: string;
  cow_id: string;
  cow_breed: string;
  semen_product: string | null;
  semen_product_name: string;
  insemination_date: string;
  technician: string;
  status: "scheduled" | "completed" | "confirmed_pregnant" | "failed";
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Customer types ────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  total_purchases: string;
  loyalty_points: number;
  last_purchase: string | null;
  created_at: string;
}

// ── Analytics types ───────────────────────────────────────────────────────

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  today_sales: number;
  today_orders: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

// ── Article / Educational Hub ─────────────────────────────────────────────

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  category_obj: ArticleCategory | null;
  author: string | null;
  author_name: string;
  image: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// ── User types ────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "cashier" | "customer";

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  is_active_cashier: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface StoreConfig {
  staff_limit: number;
  idle_timeout_minutes: number;
}

// ── Supplier / Purchase Order ─────────────────────────────────────────────

export interface Supplier {
  id: string; // UUID
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  payment_terms: string;
  credit_limit: string; // DecimalField → string
  notes: string;
  is_active: boolean;
  rating: number;
  product_count: number;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  product: string; // UUID
  product_name: string;
  product_sku: string | null;
  product_unit: string;
  quantity_ordered: number;
  quantity_received: number;
  remaining: number;
  unit_cost: string; // DecimalField → string
  line_total: string;
  notes: string;
}

export type POStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "partial"
  | "received"
  | "cancelled";

export interface PurchaseOrder {
  id: string; // UUID
  po_number: string;
  supplier: string; // UUID
  supplier_name: string;
  status: POStatus;
  status_display: string;
  expected_delivery: string | null;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  notes: string;
  items: PurchaseOrderItem[];
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// ── Stock Alerts ──────────────────────────────────────────────────────────

export type AlertType =
  | "low_stock"
  | "out_of_stock"
  | "overstock"
  | "expiring_soon"
  | "expired"
  | "damaged";

export type AlertStatus =
  | "active"
  | "acknowledged"
  | "resolved"
  | "dismissed";

export interface StockAlert {
  id: string; // UUID
  product: string; // UUID
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_unit: string;
  type: AlertType;
  type_display: string;
  status: AlertStatus;
  status_display: string;
  priority: "low" | "medium" | "high" | "critical";
  priority_display: string;
  message: string;
  threshold_value: number | null;
  acknowledged_by_name: string | null;
  resolved_by_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ── Discounts & POS Session ───────────────────────────────────────────────

export type DiscountType =
  | "percentage"
  | "fixed"
  | "bogo"
  | "bulk";

export interface Discount {
  id: string; // UUID
  name: string;
  code: string;
  type: DiscountType;
  value: string; // DecimalField → string
  min_purchase_amount: string;
  min_quantity: number;
  max_uses: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface POSSession {
  id: string; // UUID
  cashier: string; // UUID
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  opening_cash: string;
  closing_cash: string | null;
  notes: string;
}

// ── Documents (Quotations & Invoices) ────────────────────────────────────────

export type DocumentType = 'quotation' | 'invoice';
export type DocumentStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';

export interface BizDocumentItem {
  id: string;
  product: string | null;
  description: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface BizDocument {
  id: string;
  document_number: string;
  document_type: DocumentType;
  document_type_display: string;
  status: DocumentStatus;
  status_display: string;
  customer: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  issue_date: string;
  due_date: string | null;
  valid_until: string | null;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes: string;
  terms_conditions: string;
  payment_terms: string;
  items: BizDocumentItem[];
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentItemPayload {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateDocumentPayload {
  document_type: DocumentType;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_id?: string;
  due_date?: string;
  valid_until?: string;
  validity_days?: number;
  discount_amount?: number;
  notes?: string;
  terms_conditions?: string;
  payment_terms?: string;
  items: CreateDocumentItemPayload[];
}
