import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ---------------- Professional Stock Management Page ----------------
const StockManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [editStockIndex, setEditStockIndex] = useState<number | null>(null);
  const [newStock, setNewStock] = useState("");

  // Load products from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(stored);
  }, []);

  // Save updated stock
  const updateStock = (index: number) => {
    if (!newStock || isNaN(Number(newStock))) return alert("Enter valid stock!");
    const updated = [...products];
    updated[index].openingStock = newStock;
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    setEditStockIndex(null);
    setNewStock("");
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase());

    const matchesStock =
      filterStock === "low"
        ? Number(p.openingStock) <= Number(p.lowStock)
        : filterStock === "out"
        ? Number(p.openingStock) === 0
        : true;

    return matchesSearch && matchesStock;
  });

  return (
    <div className="p-6">
      {/* Header with heading center & Back button right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold  flex-1 text-gray-800">
          Stock Management
        </h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 ml-4"
        >
          ⬅ Back
        </button>
      </div>

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
          filteredProducts.map((p, index) => (
            <div
              key={p.sku}
              className={`bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col gap-3 border-l-4 ${
                Number(p.openingStock) === 0
                  ? "border-red-500"
                  : Number(p.openingStock) <= Number(p.lowStock)
                  ? "border-yellow-400"
                  : "border-green-400"
              }`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">{p.name}</h2>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    Number(p.openingStock) === 0
                      ? "bg-red-100 text-red-700"
                      : Number(p.openingStock) <= Number(p.lowStock)
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {p.category}
                </span>
              </div>

              <div className="text-gray-600 text-sm">SKU: {p.sku}</div>
              <div className="flex justify-between items-center">
                <span>Stock: {p.openingStock}</span>
                {editStockIndex === index ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="border p-1 rounded w-20"
                    />
                    <button
                      onClick={() => updateStock(index)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditStockIndex(null)}
                      className="bg-gray-300 px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditStockIndex(index);
                      setNewStock(p.openingStock);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="text-gray-500 text-sm">
                Low Stock Alert: {p.lowStock}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 text-lg">
            No Products Found
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;