import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product } from "../services/productService";

const StockManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [editStockProduct, setEditStockProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<"add" | "remove">("add");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update stock (add or remove)
  const updateStock = async () => {
    if (!editStockProduct || !editStockProduct.product_id) return;

    const quantity = Number(stockQuantity);
    if (!stockQuantity || isNaN(quantity) || quantity <= 0) {
      alert("Enter a valid quantity!");
      return;
    }

    try {
      let result;
      if (stockAction === "add") {
        result = await productService.addStock(
          editStockProduct.product_id,
          quantity,
          stockReason || "Manual stock addition"
        );
      } else {
        result = await productService.removeStock(
          editStockProduct.product_id,
          quantity,
          stockReason || "Manual stock removal"
        );
      }

      // Update the product in the list with new stock
      setProducts(products.map(p =>
        p.product_id === editStockProduct.product_id
          ? { ...p, current_stock: result.new_stock }
          : p
      ));

      alert(result.message);
      closeStockModal();
    } catch (err: any) {
      console.error("Failed to update stock:", err);
      alert(err.message || "Failed to update stock");
    }
  };

  const openStockModal = (product: Product, action: "add" | "remove") => {
    setEditStockProduct(product);
    setStockAction(action);
    setStockQuantity("");
    setStockReason("");
  };

  const closeStockModal = () => {
    setEditStockProduct(null);
    setStockQuantity("");
    setStockReason("");
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase());

    const currentStock = p.current_stock || 0;
    const lowStockThreshold = Number(p.low_stock_alert) || 0;

    const matchesStock =
      filterStock === "low"
        ? currentStock <= lowStockThreshold && currentStock > 0
        : filterStock === "out"
          ? currentStock === 0
          : true;

    return matchesSearch && matchesStock;
  });

  if (loading && products.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with heading center & Back button right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex-1 text-gray-800">
          Stock Management
        </h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 ml-4"
        >
          ⬅ Back
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by Name or SKU..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border p-3 rounded-lg w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="border p-3 rounded-lg w-full md:w-48 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="all">All Products</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const currentStock = p.current_stock || 0;
            const lowStockThreshold = Number(p.low_stock_alert) || 0;
            const isOutOfStock = currentStock === 0;
            const isLowStock = currentStock <= lowStockThreshold && currentStock > 0;

            return (
              <div
                key={p.product_id}
                className={`bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col gap-3 border-l-4 ${isOutOfStock
                  ? "border-red-500"
                  : isLowStock
                    ? "border-yellow-400"
                    : "border-green-400"
                  }`}
              >
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-lg">{p.name}</h2>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${isOutOfStock
                      ? "bg-red-100 text-red-700"
                      : isLowStock
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                      }`}
                  >
                    {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                  </span>
                </div>

                <div className="text-gray-600 text-sm">SKU: {p.sku}</div>
                <div className="text-gray-600 text-sm">Brand: {p.brand || "N/A"}</div>

                <div className="flex justify-between items-center font-semibold">
                  <span>Current Stock:</span>
                  <span className="text-lg">{currentStock}</span>
                </div>

                <div className="text-gray-500 text-sm">
                  Low Stock Alert: {lowStockThreshold}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openStockModal(p, "add")}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition"
                  >
                    + Add Stock
                  </button>
                  <button
                    onClick={() => openStockModal(p, "remove")}
                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition"
                    disabled={currentStock === 0}
                  >
                    - Remove Stock
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500 text-lg">
            {loading ? "Loading..." : "No Products Found"}
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {editStockProduct && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {stockAction === "add" ? "Add Stock" : "Remove Stock"} - {editStockProduct.name}
            </h2>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">Current Stock: <span className="font-semibold">{editStockProduct.current_stock || 0}</span></p>
              <p className="text-gray-600">SKU: {editStockProduct.sku}</p>
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
                onClick={updateStock}
                className={`flex-1 text-white px-4 py-2 rounded-lg transition ${stockAction === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {stockAction === "add" ? "Add Stock" : "Remove Stock"}
              </button>
              <button
                onClick={closeStockModal}
                className="flex-1 bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;