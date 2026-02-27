# Inventory Management System — Frontend

Giao diện quản lý kho vận, tài chính và quy trình phê duyệt. Hỗ trợ đa ngôn ngữ (Tiếng Việt / English), phân quyền RBAC, và real-time updates.

## Tech Stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| Framework    | React 18 + TypeScript   |
| Build Tool   | Vite                    |
| Styling      | TailwindCSS + shadcn/ui |
| State & Data | TanStack React Query v5 |
| Routing      | React Router v6         |
| i18n         | react-i18next (vi/en)   |
| HTTP Client  | Axios                   |
| Icons        | Lucide React            |

## Cấu trúc dự án

Áp dụng **Atomic Design Pattern**:

```
src/
├── api/                  ← Axios instance + interceptors
├── components/
│   ├── atoms/            ← UI primitives (Button, Input, Badge, Table, Select, Dialog...)
│   ├── molecules/        ← Composite components (DataTable, Pagination, OrderForm, LanguageSwitcher...)
│   ├── organisms/        ← Feature components (ExpenseForm, InventoryTable, StatisticsCards...)
│   └── templates/        ← Layout components (MainLayout, ProtectedRoute, AdminRoute)
├── context/              ← AuthContext (JWT, RBAC, permissions)
├── hooks/                ← Custom hooks (useProducts, useExpenses, useInvoices, useTaxRules...)
├── i18n/                 ← Internationalization (vi.json, en.json)
├── lib/                  ← Utilities (cn helper)
├── pages/                ← Route pages
├── types.ts              ← TypeScript type definitions
├── App.tsx               ← Router configuration
└── main.tsx              ← Entry point
```

## Chức năng chính

### 📊 Dashboard

- Tổng quan thống kê đơn hàng (cards)
- Biểu đồ doanh thu
- Bảng xếp hạng sản phẩm bán chạy
- Finance Dashboard (doanh thu + chi phí)

### 🏭 Quản lý Kho (Inventory)

- Danh sách sản phẩm + phân trang
- Tạo/Sửa sản phẩm qua modal
- Tạo đơn hàng nhập/xuất kho với lựa chọn thuế, phụ phí
- Theo dõi tồn kho realtime (WebSocket)

### 💰 Quản lý Chi phí (Expenses)

- Form tạo chi phí đa tiền tệ
- Bảng chi phí với phân trang
- Hỗ trợ toggle hiển thị VND ↔ USD

### 📋 Phê duyệt (Approval Board)

- Bảng yêu cầu phê duyệt với filter theo trạng thái
- Duyệt / Từ chối (nhập lý do)
- Phân trang

### 🧾 Hóa đơn (Invoices)

- Danh sách hóa đơn đã duyệt
- Hiển thị subtotal, thuế, phụ phí, tổng
- Toggle tiền tệ + phân trang

### 📊 Thuế (Tax Rules)

- CRUD quy tắc thuế (VAT nội địa, VAT quốc tế, FCT)
- Trạng thái Active/Expired tự động
- Phân trang

### 👥 Quản lý User & Role

- CRUD users với phân trang
- Quản lý roles + permissions
- RBAC: ẩn/hiện menu theo permission

### 📝 Audit History

- Lịch sử mọi thao tác trong hệ thống
- Phân trang qua DataTable

## Phân quyền (RBAC)

Menu sidebar và các action được kiểm soát bởi **permission-based access control**:

```tsx
// Component Can — render children chỉ khi user có permission
<Can permission="approvals.approve">
  <Button>Duyệt</Button>
</Can>;

// Hook
const { hasAnyPermission } = useAuth();
```

Permissions mẫu: `inventory.read`, `expenses.write`, `approvals.approve`, `users.delete`, `roles.manage`...

## Đa ngôn ngữ (i18n)

Hỗ trợ 2 ngôn ngữ: **Tiếng Việt** và **English**.

- File ngôn ngữ: `src/i18n/locales/vi.json`, `en.json`
- Chuyển ngôn ngữ: `LanguageSwitcher` component trên sidebar
- Sử dụng: `const { t } = useTranslation(); t('sidebar.dashboard')`

## Pagination

Tất cả trang dạng list đều có phân trang đầy đủ:

- **Component**: `DataTable` (built-in) hoặc `Pagination` (standalone)
- **Hook**: `usePagination(defaultLimit)` → `{ page, limit, setPage, setLimit }`
- **UI**: Rows per page selector + Showing X-Y of Z + Previous/Next buttons

## Chạy local

### Yêu cầu

- Node.js 18+
- yarn hoặc npm

### Cài đặt & Chạy

```bash
# Cài dependencies
yarn install

# Dev server (hot reload)
yarn dev
# → http://localhost:5173

# Build production
yarn build

# Preview production build
yarn preview
```

### Biến môi trường

Tạo file `.env` (hoặc `.env.local`):

```env
VITE_API_URL=http://localhost:8080
```

## Component Design System

Sử dụng **shadcn/ui** — headless, customizable components:

| Component        | Loại     | Mô tả                                          |
| ---------------- | -------- | ---------------------------------------------- |
| `Button`         | Atom     | Variants: default, ghost, outline, destructive |
| `Input`, `Label` | Atom     | Form controls                                  |
| `Select`         | Atom     | Dropdown select                                |
| `Table`          | Atom     | Table primitives (Header, Body, Row, Cell)     |
| `Badge`          | Atom     | Status badges                                  |
| `Card`           | Atom     | Container cards                                |
| `Dialog`         | Atom     | Modal dialogs                                  |
| `DataTable`      | Molecule | Table + pagination + sorting                   |
| `Pagination`     | Molecule | Standalone pagination controls                 |
| `OrderForm`      | Molecule | Order creation dialog                          |
| `CurrencyToggle` | Atom     | VND ↔ USD toggle                               |

## Scripts

```bash
yarn dev        # Start dev server
yarn build      # Production build
yarn preview    # Preview production build
yarn lint       # ESLint check
```
