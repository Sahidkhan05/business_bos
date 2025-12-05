import React, { useState, useRef } from "react";
import type { DragEvent } from "react";
import { parse } from "papaparse"; // CSV parsing library
import { saveAs } from "file-saver"; // CSV download
import { useNavigate } from "react-router-dom";

interface Product {
  name: string;
  sku: string;
  category: string;
  size: string;
  brand: string;
  description: string;
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  profit: string;
  gst: string;
  hsn: string;
  openingStock: string;
  lowStock: string;
  unit: string;
  status: boolean;
  images: string[];
}

const ImportExport: React.FC = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ CSV Import
  const handleImport = (file: File) => {
    if (!file) return;

    setFileName(file.name);

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const importedProducts: Product[] = results.data.map((row: any) => ({
          name: row.name || "",
          sku: row.sku || Math.floor(1000 + Math.random() * 9000).toString(),
          category: row.category || "",
          size: row.size || "",
          brand: row.brand || "",
          description: row.description || "",
          purchasePrice: row.purchasePrice || "0",
          sellingPrice: row.sellingPrice || "0",
          mrp: row.mrp || "0",
          profit: (Number(row.sellingPrice || 0) - Number(row.purchasePrice || 0)).toString(),
          gst: row.gst || "0",
          hsn: row.hsn || "",
          openingStock: row.openingStock || "0",
          lowStock: row.lowStock || "0",
          unit: row.unit || "pcs",
          status: row.status === "false" ? false : true,
          images: [],
        }));

        const existing = JSON.parse(localStorage.getItem("products") || "[]");
        const merged = [...existing, ...importedProducts];
        localStorage.setItem("products", JSON.stringify(merged));

        setImportMessage(`${importedProducts.length} products imported successfully!`);
      },
      error: (err) => {
        console.error(err);
        setImportMessage("Error importing CSV file!");
      },
    });
  };

  // ✅ Handle input file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  };

  // ✅ Drag & Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImport(e.dataTransfer.files[0]);
    }
  };

  // ✅ CSV Export
  const handleExport = () => {
    const products = JSON.parse(localStorage.getItem("products") || "[]");
    if (!products.length) {
      alert("No products to export!");
      return;
    }

    const headers = Object.keys(products[0]);
    const csvContent =
      [headers.join(",")]
        .concat(products.map((p: any) => headers.map((h) => `"${p[h]}"`).join(",")))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "products_export.csv");
  };

  return (
    <div className="p-6">
      {/* Header with heading center & Back button right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold  flex-1">Import / Export Products</h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 ml-4"
        >
          ⬅ Back
        </button>
      </div>

      {/* ---------------- Import Section ---------------- */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Import Products</h2>
        <p className="text-gray-600 mb-4">Upload a CSV file to add products to your inventory.</p>

        <div
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-gray-500 mb-2">Drag & drop CSV here or click to select file</p>
          <p className="text-sm text-gray-400">{fileName || "No file chosen"}</p>
        </div>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {importMessage && <p className="mt-4 text-green-600 font-medium">{importMessage}</p>}
      </div>

      {/* ---------------- Export Section ---------------- */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Export Products</h2>
        <p className="text-gray-600 mb-4">Download all products as a CSV file.</p>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default ImportExport;