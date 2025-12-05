import React from "react";
import { useNavigate } from "react-router-dom";

const POSBilling: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">POS Billing</h1>
        <p className="text-gray-500 text-sm md:text-base mt-1">Billing Summary</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Bill Card */}
        <div
          onClick={() => navigate("/create-bill")}
          className="border rounded-xl p-6 bg-white shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center"
        >
          <span className="text-6xl mb-3">🖊️</span>
          <h2 className="font-semibold text-xl md:text-2xl text-gray-700">Create Bill</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Make a New Bill</p>
        </div>

        {/* Bill History Card */}
        <div
          onClick={() => navigate("/bill-history")}
          className="border rounded-xl p-6 bg-white shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center"
        >
          <span className="text-6xl mb-3">📄</span>
          <h2 className="font-semibold text-xl md:text-2xl text-gray-700">Bill History</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Check Previous Bills</p>
        </div>
      </div>

      {/* Placeholder for Filter / List */}
      
    </div>
  );
};

export default POSBilling;