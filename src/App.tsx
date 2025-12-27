import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import POSBilling from "./pages/POSBilling";
import ProductOverview from "./pages/ProductOverview";
import AddProduct from "./pages/AddProduct";
import ListProducts from "./pages/ListProducts";
import CategoriesPage from "./pages/Categories";
import BillHistory from "./pages/BillHistory";
import CreateBill from "./pages/CreateBill";
import StockManagement from "./pages/StockManagement";
import ImportExport from "./pages/ImportExport";
import StaffPage from "./pages/Staff/Staff";
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";
import SalesReport from "./pages/SalesReport";

// Supplier Module Pages
import {
  SuppliersPage,
  SupplierDetails,
  PurchaseOrderList,
  CreatePurchaseOrder,
  PurchaseOrderDetails
} from "./pages/suppliers";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Layout with Sidebar */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="billing" element={<POSBilling />} />
        <Route path="products" element={<ProductOverview />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/list" element={<ListProducts />} />
        <Route path="/products/categories" element={<CategoriesPage />} />
        <Route path="/create-bill" element={<CreateBill />} />
        <Route path="/bill-history" element={<BillHistory />} />
        <Route path="/products/stock" element={< StockManagement />} />
        <Route path="/products/import-export" element={< ImportExport />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/sales" element={<SalesReport />} />
        <Route path="staff" element={<StaffPage />} />

        {/* Supplier Module Routes */}
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/add" element={<SupplierDetails />} />
        <Route path="/suppliers/:id" element={<SupplierDetails />} />
        <Route path="/purchase-orders" element={<PurchaseOrderList />} />
        <Route path="/purchase-orders/create" element={<CreatePurchaseOrder />} />
        <Route path="/purchase-orders/:id" element={<PurchaseOrderDetails />} />

      </Route>
    </Routes>
  );
}

export default App;