import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { Category, Product } from "../services/productService";
import { API_BASE_URL } from "../config/config";

// Helper to get full image URL
const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

// Category colors for cards
const categoryColors = [
  "bg-blue-200",
  "bg-pink-200",
  "bg-green-200",
  "bg-yellow-200",
  "bg-purple-200",
  "bg-orange-200",
  "bg-teal-200",
  "bg-red-200",
  "bg-indigo-200",
  "bg-cyan-200",
];

// Add Category Modal Component
const AddCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setError("");
    try {
      await onSubmit(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError("Failed to create category. It may already exist.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description (optional)"
              rows={3}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories and products from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [categoriesData, productsData] = await Promise.all([
          productService.getCategories(),
          productService.getProducts(),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load categories and products");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : [];

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const cat = categories.find((c) => c.category_id === categoryId);
    return cat?.name || "Unknown";
  };

  // Handle adding new category
  const handleAddCategory = async (name: string, description: string) => {
    setIsCreating(true);
    try {
      const newCategory = await productService.createCategory({ name, description });
      setCategories([...categories, newCategory]);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await productService.deleteCategory(categoryId);
      setCategories(categories.filter((c) => c.category_id !== categoryId));
      // Clear selection if deleted category was selected
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Failed to delete category. It may have products associated with it.");
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 w-fit"
          >
            + Add New Category
          </button>
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-fit"
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Category Selection */}
      {!isLoading && !error && (
        <>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
            Select Category
          </h2>

          {categories.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg mb-4">No categories found</p>
              <p>Click "Add New Category" to create your first category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
              {categories.map((cat, index) => (
                <div
                  key={cat.category_id}
                  className={`relative p-6 sm:p-8 rounded-xl cursor-pointer text-center shadow-lg border hover:scale-105 transition-all ${categoryColors[index % categoryColors.length]
                    } ${selectedCategory === cat.category_id ? "ring-4 ring-blue-500" : ""}`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.category_id, cat.name);
                    }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md text-sm font-bold z-10"
                    title="Delete Category"
                  >
                    ✕
                  </button>
                  <div onClick={() => setSelectedCategory(cat.category_id)}>
                    <h2 className="text-xl font-bold">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-sm text-gray-600 mt-2">{cat.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product List */}
          {selectedCategory && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                Products in: {getCategoryName(selectedCategory)}
              </h2>

              <div className="overflow-auto rounded-xl shadow border">
                <table className="w-full bg-white text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 sm:p-3 border">Image</th>
                      <th className="p-2 sm:p-3 border">Name</th>
                      <th className="p-2 sm:p-3 border">SKU</th>
                      <th className="p-2 sm:p-3 border">Size</th>
                      <th className="p-2 sm:p-3 border">Purchase</th>
                      <th className="p-2 sm:p-3 border">Selling</th>
                      <th className="p-2 sm:p-3 border">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <tr key={p.product_id || p.sku} className="text-center">
                          <td className="p-2 sm:p-3 border">
                            No Image
                          </td>
                          <td className="p-2 sm:p-3 border">{p.name}</td>
                          <td className="p-2 sm:p-3 border">{p.sku}</td>
                          <td className="p-2 sm:p-3 border">{p.size || "-"}</td>
                          <td className="p-2 sm:p-3 border">₹{p.purchase_price}</td>
                          <td className="p-2 sm:p-3 border">₹{p.selling_price}</td>
                          <td className="p-2 sm:p-3 border">{p.current_stock || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 border text-center" colSpan={7}>
                          No Products Found in this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCategory}
        isLoading={isCreating}
      />

      {/* Image Popup */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {viewImages.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  className="h-32 w-32 sm:h-40 sm:w-40 object-cover rounded"
                  alt={`product-${i}`}
                />
              ))}
            </div>
            <button
              onClick={() => setViewImages(null)}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;