import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BillItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface Bill {
  id: number;
  customerName: string;
  mobile?: string;
  date: string;
  time: string;
  totalAmount: number;
  items: BillItem[];
}

const BillHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Load bills
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bills") || "[]");
    setBills(stored);
    setFilteredBills(stored);
  }, []);

  // Filtering Logic
  const applyFilters = () => {
    if (filterType === "all" && !search && !filterDate) {
      setFilteredBills(bills);
      return;
    }

    let result = [...bills];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === "today") {
      result = result.filter(
        (b) => new Date(b.date).toDateString() === today.toDateString()
      );
    }

    if (filterType === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      result = result.filter(
        (b) => new Date(b.date).toDateString() === yesterday.toDateString()
      );
    }

    if (filterType === "7days") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((b) => new Date(b.date) >= weekAgo);
    }

    if (filterDate) {
      result = result.filter((b) => b.date === filterDate);
    }

    if (search) {
      result = result.filter(
        (b) =>
          b.id.toString().includes(search) ||
          b.customerName.toLowerCase().includes(search.toLowerCase()) ||
          b.mobile?.includes(search)
      );
    }

    setFilteredBills(result);
  };

  useEffect(() => {
    if (bills.length > 0) applyFilters();
  }, [search, filterType, filterDate, bills]);

  // Delete Bill
  const deleteBill = (id: number) => {
    if (!confirm("Delete this bill?")) return;

    const updated = bills.filter((b) => b.id !== id);
    setBills(updated);
    setFilteredBills(updated);
    localStorage.setItem("bills", JSON.stringify(updated));
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bill History</h1>

        <button
          onClick={() => navigate("/Billing")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search name, mobile, bill no..."
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

          {/* Filter Dropdown */}
          <select
            className="border p-2 rounded w-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Bills</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setFilterType("all");
              setFilterDate("");
              setSearch("");
            }}
            className="bg-gray-100 border p-2 rounded hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.length > 0 ? (
          filteredBills.map((bill) => (
            <div
              key={bill.id}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
            >
              {/* Top Row (Bill No + Customer Info) */}
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    Bill #{bill.id}
                  </p>
                  <p className="text-gray-600">
                    Customer: <span className="font-medium">{bill.customerName}</span>
                  </p>
                  <p className="text-gray-600">
                    Mobile: {bill.mobile || "N/A"}
                  </p>
                </div>

                <div className="text-left sm:text-right text-gray-500">
                  <p>{bill.date}</p>
                  <p>{bill.time}</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between border-t mt-3 pt-2">
                <span className="font-medium text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900 text-lg">
                  ₹{bill.totalAmount}
                </span>
              </div>

              {/* Items */}
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                {bill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-t py-1"
                  >
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-medium">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Delete Button */}
              <div className="text-right mt-4">
                <button
                  onClick={() => deleteBill(bill.id)}
                  className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center mt-10">
            No bills found.
          </p>
        )}
      </div>
    </div>
  );
};

export default BillHistory;