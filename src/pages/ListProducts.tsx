import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product, Category } from "../services/productService";

const ListProducts: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const deleteProduct = async (productId: number, sku: string) => {
    if (!window.confirm(`Delete product ${sku}?`)) return;

    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((p) => p.product_id !== productId));
      alert("Product deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      alert(err.message || "Failed to delete product");
    }
  };

  const saveEditedProduct = async () => {
    if (!editProduct || !editProduct.product_id) return;

    try {
      const updated = await productService.updateProduct(editProduct.product_id, editProduct);
      setProducts(products.map((p) =>
        p.product_id === updated.product_id ? updated : p
      ));
      setEditProduct(null);
      alert("Product updated successfully!");
    } catch (err: any) {
      console.error("Failed to update product:", err);
      alert(err.message || "Failed to update product");
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = filterCategory
      ? p.category.toString() === filterCategory
      : true;

    return matchesSearch && matchesCategory;
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

      {/* Header + Back */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold">Product List</h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
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
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or SKU…"
          className="border p-2 rounded w-full"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="border p-2 rounded w-full md:w-52"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id.toString()}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto shadow rounded-xl">
        <table className="w-full min-w-[800px] bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">SKU</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Size</th>
              <th className="p-3 border">Brand</th>
              <th className="p-3 border">Purchase</th>
              <th className="p-3 border">Selling</th>
              <th className="p-3 border">Stock</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <tr key={p.product_id} className="text-center hover:bg-gray-50">
                  <td className="p-3 border">{p.name}</td>
                  <td className="p-3 border">{p.sku}</td>
                  <td className="p-3 border">{getCategoryName(p.category)}</td>
                  <td className="p-3 border">{p.size || "-"}</td>
                  <td className="p-3 border">{p.brand || "-"}</td>
                  <td className="p-3 border">₹{p.purchase_price}</td>
                  <td className="p-3 border">₹{p.selling_price}</td>
                  <td className="p-3 border">{p.current_stock || 0}</td>
                  <td className="p-3 border">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => navigate("/products/add", {
                          state: { editProductId: p.product_id }
                        })}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => p.product_id && deleteProduct(p.product_id, p.sku)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 border text-center" colSpan={9}>
                  {loading ? "Loading..." : "No Products Found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ListProducts;