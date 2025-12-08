import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product, Category } from "../services/productService";

// 🔵 Auto SKU Generate Function
const generateSKU = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editProductId = location.state?.editProductId ?? null;

  const [product, setProduct] = useState<Product>({
    name: "",
    sku: generateSKU(),
    category: 0,
    size: "",
    brand: "",
    description: "",
    purchase_price: "",
    selling_price: "",
    mrp: "",
    gst_percent: "0",
    hsn_code: "",
    low_stock_alert: "",
    unit: "pcs",
    status: "active",
  });

  const [profit, setProfit] = useState<string>("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 🔵 Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔵 If page is opened in EDIT MODE
  useEffect(() => {
    if (editProductId !== null) {
      fetchProduct(editProductId);
    }
  }, [editProductId]);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to load categories. Please refresh the page.");
    }
  };

  const fetchProduct = async (id: number) => {
    try {
      setLoading(true);
      const data = await productService.getProduct(id);
      setProduct(data);
      // Calculate profit
      if (data.purchase_price && data.selling_price) {
        setProfit((Number(data.selling_price) - Number(data.purchase_price)).toString());
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = (pPrice: string, sPrice: string) => {
    if (!pPrice || !sPrice) return "";
    return (Number(sPrice) - Number(pPrice)).toString();
  };

  const updateField = (field: keyof Product, value: string | number) => {
    let newData: Product = { ...product, [field]: value };

    if (field === "purchase_price" || field === "selling_price") {
      const newProfit = calculateProfit(
        field === "purchase_price" ? value.toString() : product.purchase_price.toString(),
        field === "selling_price" ? value.toString() : product.selling_price.toString()
      );
      setProfit(newProfit);
    }

    setProduct(newData);
  };

  // 🔵 Image Upload (max 3)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);

    const previewUrls: string[] = [];
    files.forEach((file: File) => {
      previewUrls.push(URL.createObjectURL(file));
    });

    setImagePreviews(previewUrls);
  };

  // 🔵 Save Product
  const saveProduct = async () => {
    setError("");

    // Validation
    if (!product.name || !product.purchase_price || !product.selling_price) {
      setError("Please fill all required fields (Name, Purchase Price, Selling Price)!");
      return;
    }

    if (!product.category || product.category === 0) {
      setError("Please select a category!");
      return;
    }

    try {
      setLoading(true);

      let savedProduct: Product;

      if (editProductId !== null) {
        // Update existing product
        savedProduct = await productService.updateProduct(editProductId, product);
        alert("Product Updated Successfully!");
      } else {
        // Create new product
        savedProduct = await productService.createProduct(product);

        // Upload images if any
        if (imageFiles.length > 0 && savedProduct.product_id) {
          await Promise.all(
            imageFiles.map(file =>
              productService.uploadProductImage(savedProduct.product_id!, file)
            )
          );
        }

        // Handle opening stock if provided
        if (product.low_stock_alert && Number(product.low_stock_alert) > 0 && savedProduct.product_id) {
          await productService.addStock(
            savedProduct.product_id,
            Number(product.low_stock_alert),
            "Opening Stock"
          );
        }

        alert("Product Added Successfully!");
      }

      navigate("/products/list");
    } catch (err: any) {
      console.error("Failed to save product:", err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && editProductId !== null) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10  min-h-screen">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {editProductId !== null ? "Edit Product" : "Add Product"}
        </h1>

        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-4 text-indigo-600 border-b pb-2">Basic Info</h2>

          <input
            type="text"
            placeholder="Product Name *"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm"
            value={product.name}
            onChange={(e) => updateField("name", e.target.value)}
          />

          <input
            type="text"
            placeholder="SKU (Auto)"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 bg-gray-100 shadow-sm"
            value={product.sku}
            readOnly
          />

          <select
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.category}
            onChange={(e) => updateField("category", Number(e.target.value))}
          >
            <option value={0}>Select Category *</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Size (S, M, L, XL)"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.size || ""}
            onChange={(e) => updateField("size", e.target.value)}
          />

          <input
            type="text"
            placeholder="Brand"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.brand || ""}
            onChange={(e) => updateField("brand", e.target.value)}
          />

          <textarea
            placeholder="Description"
            rows={3}
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm resize-none"
            value={product.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <label className="block mb-2 font-medium text-gray-700">Upload Images (Max 3)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full mb-4 p-2 rounded-xl border border-gray-300"
            onChange={handleImageUpload}
          />

          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, index) => (
              <img
                key={index}
                src={src}
                className="w-24 h-24 rounded-2xl border border-gray-300 object-cover shadow-sm"
                alt={`Preview ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">Pricing</h2>

          <input
            type="number"
            placeholder="Purchase Price *"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.purchase_price}
            onChange={(e) => updateField("purchase_price", e.target.value)}
          />

          <input
            type="number"
            placeholder="Selling Price *"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.selling_price}
            onChange={(e) => updateField("selling_price", e.target.value)}
          />

          <input
            type="number"
            placeholder="MRP"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.mrp || ""}
            onChange={(e) => updateField("mrp", e.target.value)}
          />

          <input
            type="text"
            placeholder="Profit (Auto)"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 bg-gray-100 shadow-sm"
            value={profit}
            readOnly
          />
        </div>

        {/* Tax */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-4 text-yellow-600 border-b pb-2">Tax Details</h2>

          <select
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.gst_percent}
            onChange={(e) => updateField("gst_percent", e.target.value)}
          >
            <option value="0">GST 0%</option>
            <option value="5">GST 5%</option>
            <option value="12">GST 12%</option>
            <option value="18">GST 18%</option>
            <option value="28">GST 28%</option>
          </select>

          <input
            type="text"
            placeholder="HSN Code"
            className="w-full p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.hsn_code || ""}
            onChange={(e) => updateField("hsn_code", e.target.value)}
          />
        </div>

        {/* Inventory */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-4 text-purple-600 border-b pb-2">Inventory</h2>

          <input
            type="number"
            placeholder="Opening Stock"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.low_stock_alert || ""}
            onChange={(e) => updateField("low_stock_alert", e.target.value)}
          />

          <input
            type="number"
            placeholder="Low Stock Alert"
            className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.low_stock_alert || ""}
            onChange={(e) => updateField("low_stock_alert", e.target.value)}
          />

          <select
            className="w-full p-3 rounded-xl border border-gray-300 shadow-sm"
            value={product.unit}
            onChange={(e) => updateField("unit", e.target.value)}
          >
            <option value="pcs">PCS</option>
            <option value="box">BOX</option>
            <option value="kg">KG</option>
            <option value="litre">Litre</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-center sm:justify-start">
        <button
          onClick={saveProduct}
          disabled={loading}
          className={`px-8 py-3 rounded-2xl shadow-md hover:shadow-lg transition font-semibold ${loading
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
        >
          {loading ? "Saving..." : editProductId !== null ? "Save Changes" : "Save Product"}
        </button>
      </div>
    </div>



  );
};

export default AddProduct;