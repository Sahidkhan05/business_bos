import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// 🔵 Auto SKU Generate Function
const generateSKU = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editIndex = location.state?.editIndex ?? null;

  const [product, setProduct] = useState({
    name: "",
    sku: generateSKU(),
    category: "",
    size: "",
    brand: "",
    description: "",
    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    profit: "",
    gst: "0",
    hsn: "",
    openingStock: "",
    lowStock: "",
    unit: "pcs",
    status: true,
    images: [] as string[],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 🔵 If page is opened in EDIT MODE
  useEffect(() => {
    if (editIndex !== null) {
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const existingProduct = products[editIndex];
      if (existingProduct) {
        setProduct(existingProduct);
        setImagePreviews(existingProduct.images || []);
      }
    }
  }, [editIndex]);

  const calculateProfit = (pPrice: string, sPrice: string) => {
    if (!pPrice || !sPrice) return "";
    return (Number(sPrice) - Number(pPrice)).toString();
  };

  const updateField = (field: string, value: string | boolean) => {
    let newData: any = { ...product, [field]: value };

    if (field === "purchasePrice" || field === "sellingPrice") {
      newData.profit = calculateProfit(
        field === "purchasePrice" ? value.toString() : product.purchasePrice,
        field === "sellingPrice" ? value.toString() : product.sellingPrice
      );
    }

    setProduct(newData);
  };

  // 🔵 Image Upload (max 3)
  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files).slice(0, 3);

    const previewUrls: string[] = [];
    const base64Images: string[] = [];

    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        base64Images.push(reader.result as string);
        setProduct((prev) => ({ ...prev, images: base64Images }));
      };
      reader.readAsDataURL(file);
      previewUrls.push(URL.createObjectURL(file));
    });

    setImagePreviews(previewUrls);
  };

  // 🔵 Save Product
  const saveProduct = () => {
    if (!product.name || !product.purchasePrice || !product.sellingPrice) {
      alert("Please fill all required fields!");
      return;
    }

    const existing = JSON.parse(localStorage.getItem("products") || "[]");

    if (editIndex !== null) {
      existing[editIndex] = product;
      alert("Product Updated Successfully!");
    } else {
      existing.push(product);
      alert("Product Added Successfully!");
    }

    localStorage.setItem("products", JSON.stringify(existing));
    navigate("/products/list");
  };

  return (
   <div className="p-6 sm:p-8 lg:p-10  min-h-screen">

  {/* Header */}
  <div className="flex flex-wrap items-center justify-between mb-8 gap-3">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
      {editIndex !== null ? "Edit Product" : "Add Product"}
    </h1>

    <button
      onClick={() => navigate("/products")}
      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
    >
      ⬅ Back
    </button>
  </div>

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
        onChange={(e) => updateField("category", e.target.value)}
      >
        <option value="">Select Category</option>
        <option value="Mens">Mens</option>
        <option value="Womens">Womens</option>
        <option value="Kids">Kids</option>
      </select>

      <input
        type="text"
        placeholder="Size (S, M, L, XL) *"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.size}
        onChange={(e) => updateField("size", e.target.value)}
      />

      <input
        type="text"
        placeholder="Brand"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.brand}
        onChange={(e) => updateField("brand", e.target.value)}
      />

      <textarea
        placeholder="Description"
        rows={3}
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm resize-none"
        value={product.description}
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
        value={product.purchasePrice}
        onChange={(e) => updateField("purchasePrice", e.target.value)}
      />

      <input
        type="number"
        placeholder="Selling Price *"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.sellingPrice}
        onChange={(e) => updateField("sellingPrice", e.target.value)}
      />

      <input
        type="number"
        placeholder="MRP"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.mrp}
        onChange={(e) => updateField("mrp", e.target.value)}
      />

      <input
        type="text"
        placeholder="Profit (Auto)"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 bg-gray-100 shadow-sm"
        value={product.profit}
        readOnly
      />
    </div>

    {/* Tax */}
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4 text-yellow-600 border-b pb-2">Tax Details</h2>

      <select
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.gst}
        onChange={(e) => updateField("gst", e.target.value)}
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
        value={product.hsn}
        onChange={(e) => updateField("hsn", e.target.value)}
      />
    </div>

    {/* Inventory */}
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4 text-purple-600 border-b pb-2">Inventory</h2>

      <input
        type="number"
        placeholder="Opening Stock"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.openingStock}
        onChange={(e) => updateField("openingStock", e.target.value)}
      />

      <input
        type="number"
        placeholder="Low Stock Alert"
        className="w-full mb-3 p-3 rounded-xl border border-gray-300 shadow-sm"
        value={product.lowStock}
        onChange={(e) => updateField("lowStock", e.target.value)}
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
      className="bg-indigo-600 text-white px-8 py-3 rounded-2xl shadow-md hover:shadow-lg hover:bg-indigo-700 transition font-semibold"
    >
      {editIndex !== null ? "Save Changes" : "Save Product"}
    </button>
  </div>
</div>



  );
};

export default AddProduct;