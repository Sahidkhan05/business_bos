import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { billService, type Bill } from "../services/billService";

const BillHistory: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load bills from API
  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await billService.getBills();
      setBills(data);
      setFilteredBills(data);
    } catch (err: any) {
      console.error("Failed to load bills:", err);
      setError(err.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [search, filterType, filterDate, paymentTypeFilter, bills]);

  const applyFilters = () => {
    let result = [...bills];

    // Date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === "today") {
      result = result.filter(
        (b) => new Date(b.date).toDateString() === today.toDateString()
      );
    } else if (filterType === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      result = result.filter(
        (b) => new Date(b.date).toDateString() === yesterday.toDateString()
      );
    } else if (filterType === "7days") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((b) => new Date(b.date) >= weekAgo);
    } else if (filterType === "30days") {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      result = result.filter((b) => new Date(b.date) >= monthAgo);
    }

    // Specific date filter
    if (filterDate) {
      result = result.filter((b) => {
        const billDate = new Date(b.date).toISOString().split('T')[0];
        return billDate === filterDate;
      });
    }

    // Payment type filter
    if (paymentTypeFilter) {
      result = result.filter((b) => b.payment_type === paymentTypeFilter);
    }

    // Search filter
    if (search) {
      result = result.filter(
        (b) =>
          b.bill_id.toString().includes(search) ||
          b.customer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredBills(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterType("all");
    setFilterDate("");
    setSearch("");
    setPaymentTypeFilter("");
  };

  // Statistics
  const totalBills = filteredBills.length;
  const totalRevenue = filteredBills.reduce((sum, bill) => sum + Number(bill.grand_total), 0);

  // Pagination
  const indexOfLastBill = currentPage * itemsPerPage;
  const indexOfFirstBill = indexOfLastBill - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Payment type badge color
  const getPaymentTypeBadge = (type?: string) => {
    if (!type) return { bg: "bg-gray-100", text: "text-gray-700", label: "N/A" };

    const types: Record<string, { bg: string; text: string }> = {
      Cash: { bg: "bg-green-100", text: "text-green-700" },
      UPI: { bg: "bg-blue-100", text: "text-blue-700" },
      Card: { bg: "bg-purple-100", text: "text-purple-700" },
      Credit: { bg: "bg-orange-100", text: "text-orange-700" },
    };

    const style = types[type] || { bg: "bg-gray-100", text: "text-gray-700" };
    return { ...style, label: type };
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bill History</h1>
        <div className="flex gap-2">
          <button
            onClick={loadBills}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
          <button
            onClick={() => navigate("/Billing")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">Total Bills</p>
          <p className="text-3xl font-bold text-gray-800">{totalBills}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search bill no, customer..."
            className="border p-2 rounded w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Date Filter */}
          <input
            type="date"
            className="border p-2 rounded w-full"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          {/* Quick Date Filter */}
          <select
            className="border p-2 rounded w-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          {/* Payment Type Filter */}
          <select
            className="border p-2 rounded w-full"
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
          >
            <option value="">All Payment Types</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Credit">Credit</option>
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="bg-gray-100 border p-2 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading bills...</p>
        </div>
      )}

      {/* Bills List */}
      {!loading && (
        <>
          <div className="space-y-4">
            {currentBills.length > 0 ? (
              currentBills.map((bill) => {
                const paymentBadge = getPaymentTypeBadge(bill.payment_type);
                const isExpanded = expandedBillId === bill.bill_id;

                return (
                  <div
                    key={bill.bill_id}
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-bold text-gray-800 text-lg">
                            Bill #{bill.bill_id}
                          </p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${paymentBadge.bg} ${paymentBadge.text}`}
                          >
                            {paymentBadge.label}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          Customer:{" "}
                          <span className="font-medium">
                            {bill.customer_name || "Walk-in Customer"}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-gray-500">
                        <p className="font-medium">{formatDate(bill.date)}</p>
                        <p className="text-sm">{formatTime(bill.date)}</p>
                      </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t text-sm">
                      <div>
                        <p className="text-gray-500">Item Total</p>
                        <p className="font-semibold">₹{Number(bill.item_total).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">GST</p>
                        <p className="font-semibold">₹{Number(bill.gst_total).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Discount</p>
                        <p className="font-semibold">₹{Number(bill.bill_discount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Grand Total</p>
                        <p className="font-bold text-lg text-green-600">
                          ₹{Number(bill.grand_total).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() =>
                          setExpandedBillId(isExpanded ? null : bill.bill_id)
                        }
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        {isExpanded ? "▲ Hide Items" : "▼ View Items"}
                      </button>
                    </div>

                    {/* Expanded Items */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <h3 className="font-semibold mb-2">Bill Items:</h3>
                        <div className="space-y-2">
                          {bill.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-gray-50 p-2 rounded"
                            >
                              <div>
                                <p className="font-medium">{item.product_name || `Product #${item.product}`}</p>
                                <p className="text-sm text-gray-600">
                                  Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                                  {item.discount > 0 && ` - Discount: ₹${Number(item.discount).toFixed(2)}`}
                                </p>
                              </div>
                              <p className="font-semibold">
                                ₹{Number(item.subtotal).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white rounded-xl">
                <p className="text-gray-500 text-lg">No bills found.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters or create a new bill.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-white border rounded">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BillHistory;