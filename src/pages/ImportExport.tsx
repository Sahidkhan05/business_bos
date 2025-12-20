import React, { useState, useRef } from "react";
import type { DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { ImportResult } from "../services/productService";

const ImportExport: React.FC = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ CSV Import via API
  const handleImport = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);
    setError(null);
    setIsImporting(true);

    try {
      const result = await productService.importProductsCSV(file);
      setImportResult(result);
    } catch (err: any) {
      setError(err.message || "Error importing CSV file!");
    } finally {
      setIsImporting(false);
    }
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

  // ✅ CSV Export via API
  const handleExport = async () => {
    setError(null);
    setIsExporting(true);

    try {
      await productService.exportProductsCSV();
    } catch (err: any) {
      setError(err.message || "Error exporting products!");
    } finally {
      setIsExporting(false);
    }
  };

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const headers = [
      'name', 'sku', 'category', 'brand', 'size', 'description', 'unit',
      'purchase_price', 'selling_price', 'mrp', 'current_stock',
      'low_stock_alert', 'hsn_code', 'gst_percent', 'status'
    ];
    const sampleRow = [
      'Sample Product', 'SKU001', 'Electronics', 'Brand X', 'Medium',
      'A sample product description', 'pcs', '100', '150', '160',
      '50', '10', 'HSN1234', '18', 'active'
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_products_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header with heading center & Back button right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex-1">Import / Export Products</h1>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 ml-4"
        >
          ⬅ Back
        </button>
      </div>

      {/* Global Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* ---------------- Import Section ---------------- */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Import Products</h2>
          <button
            onClick={downloadSampleCSV}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            📥 Download Sample CSV Template
          </button>
        </div>
        <p className="text-gray-600 mb-4">Upload a CSV file to add products to your inventory.</p>

        <div
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            } ${isImporting ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isImporting ? (
            <p className="text-blue-600 font-medium">Importing products...</p>
          ) : (
            <>
              <p className="text-gray-500 mb-2">Drag & drop CSV here or click to select file</p>
              <p className="text-sm text-gray-400">{fileName || "No file chosen"}</p>
            </>
          )}
        </div>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Import Results */}
        {importResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <p className={`font-medium ${importResult.success_count > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {importResult.message}
            </p>
            {importResult.error_count > 0 && (
              <div className="mt-2">
                <p className="text-red-600 text-sm font-medium">
                  {importResult.error_count} error(s) occurred:
                </p>
                <ul className="text-red-500 text-sm mt-1 list-disc list-inside">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- Export Section ---------------- */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Export Products</h2>
        <p className="text-gray-600 mb-4">Download all products as a CSV file.</p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition ${isExporting ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
    </div>
  );
};

export default ImportExport;