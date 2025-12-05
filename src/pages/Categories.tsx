import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Product = {
  name: string;
  sku: string;
  category?: string;
  size?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  openingStock?: number;
  images?: string[];
};

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [viewImages, setViewImages] = useState<string[] | null>(null);

  // 🔵 Load products from localStorage
  useEffect(() => {
    const stored: Product[] = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(stored);
  }, []);

  // 🔵 Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    : [];

  const categoryCards = [
    { label: "Mens", value: "Mens", color: "bg-blue-200" },
    { label: "Womens", value: "Womens", color: "bg-pink-200" },
    { label: "Kids", value: "Kids", color: "bg-green-200" },
  ];

  return (
    <div className="p-4 sm:p-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-fit"
        >
          ⬅ Back
        </button>
      </div>

      {/* Category Selection */}
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
        Select Category
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
        {categoryCards.map((cat) => (
          <div
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`p-6 sm:p-8 rounded-xl cursor-pointer text-center shadow-lg border hover:scale-105 transition-all ${cat.color}`}
          >
            <h2 className="text-xl font-bold">{cat.label}</h2>
          </div>
        ))}
      </div>

      {/* Product List */}
      {selectedCategory && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Products in: {selectedCategory}
          </h2>

          <div className="overflow-auto rounded-xl shadow border">
            <table className="w-full bg-white text-sm sm:text-base">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 sm:p-3 border">Image</th>
                  <th className="p-2 sm:p-3 border">Name</th>
                  <th className="p-2 sm:p-3 border">SKU</th>
                  <th className="p-2 sm:p-3 border">Category</th>
                  <th className="p-2 sm:p-3 border">Size</th>
                  <th className="p-2 sm:p-3 border">Purchase</th>
                  <th className="p-2 sm:p-3 border">Selling</th>
                  <th className="p-2 sm:p-3 border">Stock</th>
                  <th className="p-2 sm:p-3 border">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.sku || Math.random()} className="text-center">
                      <td className="p-2 sm:p-3 border">
                        {p.images?.length ? (
                          <img
                            src={p.images[0]}
                            className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded"
                            alt={p.name}
                          />
                        ) : (
                          "No Image"
                        )}
                      </td>
                      <td className="p-2 sm:p-3 border">{p.name}</td>
                      <td className="p-2 sm:p-3 border">{p.sku}</td>
                      <td className="p-2 sm:p-3 border">{p.category}</td>
                      <td className="p-2 sm:p-3 border">{p.size}</td>
                      <td className="p-2 sm:p-3 border">₹{p.purchasePrice}</td>
                      <td className="p-2 sm:p-3 border">₹{p.sellingPrice}</td>
                      <td className="p-2 sm:p-3 border">{p.openingStock}</td>
                      <td className="p-2 sm:p-3 border">
                        <button
                          onClick={() => setViewImages(p.images || [])}
                          className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 border text-center" colSpan={9}>
                      No Products Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Image Popup */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {viewImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
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