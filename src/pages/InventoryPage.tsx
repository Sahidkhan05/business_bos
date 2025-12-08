import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product, Category, StockMovement, InventoryStats } from "../services/productService";

type ViewMode = "table" | "cards";
type StockStatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const InventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter state
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
    const [stockStatus, setStockStatus] = useState<StockStatusFilter>(
        (searchParams.get("stock_status") as StockStatusFilter) || "all"
    );
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
        (searchParams.get("order") as "asc" | "desc") || "asc"
    );

    // UI state
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [showFilters, setShowFilters] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [stockAction, setStockAction] = useState<"add" | "remove">("add");
    const [stockQuantity, setStockQuantity] = useState("");
    const [stockReason, setStockReason] = useState("");
    const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);

    // Load data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            const [productsData, categoriesData] = await Promise.all([
                productService.getProducts(),
                productService.getCategories(),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load inventory data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Update URL params when filters change
    useEffect(() => {
        const params: Record<string, string> = {};
        if (searchText) params.search = searchText;
        if (selectedCategory) params.category = selectedCategory;
        if (stockStatus !== "all") params.stock_status = stockStatus;
        if (statusFilter !== "all") params.status = statusFilter;
        if (sortBy !== "name") params.sort = sortBy;
        if (sortOrder !== "asc") params.order = sortOrder;

        setSearchParams(params);
    }, [searchText, selectedCategory, stockStatus, statusFilter, sortBy, sortOrder]);

    // Filtered and sorted products
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Search filter
        if (searchText) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.sku.toLowerCase().includes(search) ||
                    (p.brand && p.brand.toLowerCase().includes(search))
            );
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter((p) => p.category === Number(selectedCategory));
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }

        // Stock status filter
        if (stockStatus !== "all") {
            filtered = filtered.filter((p) => {
                const currentStock = p.current_stock || 0;
                const lowStockThreshold = Number(p.low_stock_alert) || 0;

                switch (stockStatus) {
                    case "out_of_stock":
                        return currentStock === 0;
                    case "low_stock":
                        return currentStock > 0 && currentStock <= lowStockThreshold;
                    case "in_stock":
                        return currentStock > lowStockThreshold;
                    default:
                        return true;
                }
            });
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue: any = a[sortBy as keyof Product];
            let bValue: any = b[sortBy as keyof Product];

            // Handle numeric fields
            if (sortBy === "current_stock" || sortBy === "selling_price" || sortBy === "purchase_price") {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            }

            // Handle string fields
            if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue?.toLowerCase() || "";
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [products, searchText, selectedCategory, stockStatus, statusFilter, sortBy, sortOrder]);

    // Calculate statistics
    const stats: InventoryStats = useMemo(() => {
        return productService.calculateInventoryStats(filteredProducts);
    }, [filteredProducts]);

    // Stock operations
    const openStockModal = (product: Product, action: "add" | "remove") => {
        setSelectedProduct(product);
        setStockAction(action);
        setStockQuantity("");
        setStockReason("");
        setShowStockModal(true);
    };

    const handleStockUpdate = async () => {
        if (!selectedProduct || !selectedProduct.product_id) return;

        const quantity = Number(stockQuantity);
        if (!stockQuantity || isNaN(quantity) || quantity <= 0) {
            alert("Enter a valid quantity!");
            return;
        }

        try {
            let result;
            if (stockAction === "add") {
                result = await productService.addStock(
                    selectedProduct.product_id,
                    quantity,
                    stockReason || "Manual stock addition"
                );
            } else {
                result = await productService.removeStock(
                    selectedProduct.product_id,
                    quantity,
                    stockReason || "Manual stock removal"
                );
            }

            // Update product in list
            setProducts(
                products.map((p) =>
                    p.product_id === selectedProduct.product_id
                        ? { ...p, current_stock: result.new_stock }
                        : p
                )
            );

            alert(result.message);
            setShowStockModal(false);
        } catch (err: any) {
            console.error("Failed to update stock:", err);
            alert(err.message || "Failed to update stock");
        }
    };

    const viewStockHistory = async (product: Product) => {
        if (!product.product_id) return;

        try {
            setSelectedProduct(product);
            const history = await productService.getProductStockHistory(product.product_id);
            setStockHistory(history);
            setShowHistoryModal(true);
        } catch (err: any) {
            console.error("Failed to fetch stock history:", err);
            alert("Failed to load stock history");
        }
    };

    const clearFilters = () => {
        setSearchText("");
        setSelectedCategory("");
        setStockStatus("all");
        setStatusFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    const getCategoryName = (categoryId: number) => {
        const category = categories.find((c) => c.category_id === categoryId);
        return category?.name || "Unknown";
    };

    const getStockStatusBadge = (product: Product) => {
        const currentStock = product.current_stock || 0;
        const lowStockThreshold = Number(product.low_stock_alert) || 0;

        if (currentStock === 0) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Out of Stock</span>;
        } else if (currentStock <= lowStockThreshold) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Low Stock</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">In Stock</span>;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading inventory...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        {viewMode === "table" ? "📊 Card View" : "📋 Table View"}
                    </button>
                    <button
                        onClick={() => navigate("/products")}
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                        ⬅ Back
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total_products}</p>
                        </div>
                        <div className="text-3xl">📦</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Value</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_value)}</p>
                        </div>
                        <div className="text-3xl">💰</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.low_stock_count}</p>
                        </div>
                        <div className="text-3xl">⚠️</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count}</p>
                        </div>
                        <div className="text-3xl">🚫</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">In Stock</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.total_products - stats.low_stock_count - stats.out_of_stock_count}
                            </p>
                        </div>
                        <div className="text-3xl">✅</div>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        {showFilters ? "Hide" : "Show"} Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Name, SKU, Brand..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stock Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                            <select
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value as StockStatusFilter)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="all">All Products</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>

                        {/* Product Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="name">Name</option>
                                <option value="sku">SKU</option>
                                <option value="current_stock">Stock Level</option>
                                <option value="selling_price">Price</option>
                                <option value="created_at">Date Added</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
            </div>

            {/* Table View */}
            {viewMode === "table" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                {product.brand && (
                                                    <div className="text-sm text-gray-500">{product.brand}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getCategoryName(product.category)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {product.current_stock || 0}
                                                    </span>
                                                    {getStockStatusBadge(product)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(Number(product.selling_price))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openStockModal(product, "add")}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Add Stock"
                                                    >
                                                        ➕
                                                    </button>
                                                    <button
                                                        onClick={() => openStockModal(product, "remove")}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Remove Stock"
                                                        disabled={(product.current_stock || 0) === 0}
                                                    >
                                                        ➖
                                                    </button>
                                                    <button
                                                        onClick={() => viewStockHistory(product)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View History"
                                                    >
                                                        📜
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No products found matching your filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Card View */}
            {viewMode === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => {
                            const currentStock = product.current_stock || 0;
                            const lowStockThreshold = Number(product.low_stock_alert) || 0;
                            const isOutOfStock = currentStock === 0;
                            const isLowStock = currentStock <= lowStockThreshold && currentStock > 0;

                            return (
                                <div
                                    key={product.product_id}
                                    className={`bg-white rounded-xl shadow-sm border-l-4 p-5 hover:shadow-md transition ${isOutOfStock
                                            ? "border-red-500"
                                            : isLowStock
                                                ? "border-yellow-400"
                                                : "border-green-400"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                                        {getStockStatusBadge(product)}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">SKU:</span> {product.sku}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Category:</span> {getCategoryName(product.category)}
                                        </p>
                                        {product.brand && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Brand:</span> {product.brand}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Stock:</span> {currentStock} {product.unit}
                                        </p>
                                        <p className="text-sm text-gray-900 font-semibold">
                                            {formatCurrency(Number(product.selling_price))}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openStockModal(product, "add")}
                                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition text-sm"
                                        >
                                            + Add
                                        </button>
                                        <button
                                            onClick={() => openStockModal(product, "remove")}
                                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                                            disabled={currentStock === 0}
                                        >
                                            - Remove
                                        </button>
                                        <button
                                            onClick={() => viewStockHistory(product)}
                                            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                                        >
                                            📜
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-12">
                            No products found matching your filters
                        </div>
                    )}
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showStockModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            {stockAction === "add" ? "Add Stock" : "Remove Stock"} - {selectedProduct.name}
                        </h2>

                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">
                                Current Stock: <span className="font-semibold">{selectedProduct.current_stock || 0}</span>
                            </p>
                            <p className="text-gray-600">SKU: {selectedProduct.sku}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(e.target.value)}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                    placeholder="Enter quantity"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={stockReason}
                                    onChange={(e) => setStockReason(e.target.value)}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                                    placeholder="Enter reason for stock adjustment"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleStockUpdate}
                                className={`flex-1 text-white px-4 py-2 rounded-lg transition ${stockAction === "add"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {stockAction === "add" ? "Add Stock" : "Remove Stock"}
                            </button>
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="flex-1 bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock History Modal */}
            {showHistoryModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Stock Movement History - {selectedProduct.name}
                            </h2>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">SKU:</span> {selectedProduct.sku}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Current Stock:</span> {selectedProduct.current_stock || 0}
                            </p>
                        </div>

                        {stockHistory.length > 0 ? (
                            <div className="space-y-3">
                                {stockHistory.map((movement) => (
                                    <div
                                        key={movement.movement_id}
                                        className={`p-4 rounded-lg border-l-4 ${movement.type === "IN" || movement.type === "RETURN"
                                                ? "border-green-500 bg-green-50"
                                                : "border-red-500 bg-red-50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded ${movement.type === "IN" || movement.type === "RETURN"
                                                            ? "bg-green-200 text-green-800"
                                                            : "bg-red-200 text-red-800"
                                                        }`}
                                                >
                                                    {movement.type}
                                                </span>
                                                <span className="ml-2 font-semibold text-gray-900">
                                                    {movement.type === "IN" || movement.type === "RETURN" ? "+" : "-"}
                                                    {movement.quantity}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{formatDate(movement.date)}</span>
                                        </div>
                                        {movement.reference_type && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Reference:</span> {movement.reference_type}
                                            </p>
                                        )}
                                        {movement.reason && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Reason:</span> {movement.reason}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">No stock movements found</div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
