import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ListProducts: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [editProduct, setEditProduct] = useState<any | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(stored);
  }, []);

  const deleteProduct = (sku: string) => {
    if (!window.confirm("Delete this product?")) return;
    const updated = products.filter((p) => p.sku !== sku);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    alert("Product deleted!");
  };

  const saveEditedProduct = () => {
    if (!editProduct) return;
    const updated = products.map((p) =>
      p.sku === editProduct.sku ? editProduct : p
    );
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    setEditProduct(null);
    alert("Product updated!");
  };

  const filteredProducts = products.filter((p) => {
    return (
      (p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.sku.includes(searchText)) &&
      (filterCategory ? p.category === filterCategory : true)
    );
  });

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
          <option value="Mens">Mens</option>
          <option value="Womens">Womens</option>
          <option value="Kids">Kids</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto shadow rounded-xl">
        <table className="w-full min-w-[800px] bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Image</th>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">SKU</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Size</th>
              <th className="p-3 border">Purchase</th>
              <th className="p-3 border">Selling</th>
              <th className="p-3 border">Stock</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <tr key={p.sku} className="text-center">
                  <td className="p-3 border">
                    {p.images?.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-12 w-12 object-cover rounded mx-auto"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="p-3 border">{p.name}</td>
                  <td className="p-3 border">{p.sku}</td>
                  <td className="p-3 border">{p.category}</td>
                  <td className="p-3 border">{p.size}</td>
                  <td className="p-3 border">₹{p.purchasePrice}</td>
                  <td className="p-3 border">₹{p.sellingPrice}</td>
                  <td className="p-3 border">{p.openingStock}</td>
                  <td className="p-3 border flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setViewImages(p.images || [])}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditProduct({ ...p })}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(p.sku)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
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

      {/* IMAGE POPUP */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-lg overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {viewImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="h-40 w-40 object-cover rounded flex-shrink-0"
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

      {/* EDIT POPUP */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            <div className="grid gap-3">
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={editProduct.name}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, name: e.target.value })
                }
                placeholder="Product Name"
              />
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={editProduct.size}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, size: e.target.value })
                }
                placeholder="Size"
              />
              <input
                type="number"
                className="border p-2 rounded w-full"
                value={editProduct.purchasePrice}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    purchasePrice: e.target.value,
                  })
                }
                placeholder="Purchase Price"
              />
              <input
                type="number"
                className="border p-2 rounded w-full"
                value={editProduct.sellingPrice}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    sellingPrice: e.target.value,
                  })
                }
                placeholder="Selling Price"
              />
              <input
                type="number"
                className="border p-2 rounded w-full"
                value={editProduct.openingStock}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    openingStock: e.target.value,
                  })
                }
                placeholder="Stock"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-5">
              <button
                onClick={saveEditedProduct}
                className="flex-1 bg-green-600 text-white py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditProduct(null)}
                className="flex-1 bg-gray-300 py-2 rounded"
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

export default ListProducts;