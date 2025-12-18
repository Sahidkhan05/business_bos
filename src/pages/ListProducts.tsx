import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product, Category, ProductImage } from "../services/productService";
import { config } from "../config/config";

const ListProducts: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Fetch products & categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Category fetch failed", err);
    }
  };

  const deleteProduct = async (productId: number, sku: string) => {
    if (!window.confirm(`Delete product ${sku}?`)) return;

    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      alert("Product deleted successfully");
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleViewImages = async (productId: number) => {
    try {
      setImageLoading(true);

      const images: ProductImage[] =
        await productService.getProductImages(productId);

      // Prepend the base URL to each image path
      const imageUrls = images.map((img) => {
        // If the image URL is already absolute, use it as is
        if (img.image.startsWith('http')) {
          return img.image;
        }
        // Otherwise, prepend the base URL
        return `${config.apiBaseUrl}${img.image}`;
      });
      setViewImages(imageUrls);
    } catch (err) {
      alert("Failed to load images");
    } finally {
      setImageLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const cat = categories.find((c) => c.category_id === categoryId);
    return cat ? cat.name : "Unknown";
  };

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
      <div className="p-6 flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Product List</h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⬅ Back
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or SKU"
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

      {/* Table */}
      <div className="overflow-x-auto shadow rounded-xl">
        <table className="w-full min-w-[900px] bg-white">
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
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewImages(p.product_id!)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          navigate("/products/add", {
                            state: { editProductId: p.product_id },
                          })
                        }
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          p.product_id &&
                          deleteProduct(p.product_id, p.sku)
                        }
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
                <td colSpan={9} className="p-4 text-center">
                  No Products Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* IMAGE MODAL */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>

            {imageLoading ? (
              <p className="text-center text-gray-500">Loading images...</p>
            ) : viewImages.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-3">
                {viewImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`product-${i}`}
                    className="h-40 w-40 object-cover rounded border flex-shrink-0"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No images found</p>
            )}

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

export default ListProducts;