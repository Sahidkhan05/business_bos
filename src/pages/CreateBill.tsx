import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productService, type Product } from "../services/productService";
import { customerService, type Customer, type CreateCustomerData } from "../services/customerService";
import { billService, type CreateBillData } from "../services/billService";

interface BillItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  gst_percent: number;
  subtotal: number;
}

const CreateBill: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Customer modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState<CreateCustomerData>({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    type: "Regular",
  });
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");

  // Load customers and products on mount
  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError("Failed to load products");
    }
  };

  // Customer modal handlers
  const openCustomerModal = () => {
    setShowCustomerModal(true);
    setCustomerFormData({
      name: "",
      phone: "",
      email: "",
      gst_number: "",
      type: "Regular",
    });
    setCustomerError("");
  };

  const closeCustomerModal = () => {
    setShowCustomerModal(false);
    setCustomerFormData({
      name: "",
      phone: "",
      email: "",
      gst_number: "",
      type: "Regular",
    });
    setCustomerError("");
  };

  const handleCreateCustomer = async () => {
    if (!customerFormData.name.trim()) {
      setCustomerError("Customer name is required");
      return;
    }

    setCustomerLoading(true);
    setCustomerError("");

    try {
      const newCustomer = await customerService.createCustomer(customerFormData);
      await loadCustomers(); // Reload customer list
      setSelectedCustomerId(newCustomer.customer_id); // Auto-select new customer
      closeCustomerModal();
      alert(`Customer "${newCustomer.name}" created successfully!`);
    } catch (err: any) {
      console.error("Failed to create customer:", err);
      setCustomerError(err.response?.data?.detail || err.message || "Failed to create customer");
    } finally {
      setCustomerLoading(false);
    }
  };

  // Search and add product
  const handleSearchProduct = () => {
    if (!productSearch.trim()) {
      alert("Please enter a product SKU");
      return;
    }

    const product = products.find(
      (p) => p.sku.toLowerCase() === productSearch.toLowerCase()
    );

    if (!product) {
      alert("Product not found!");
      return;
    }

    if (!product.product_id) {
      alert("Invalid product data");
      return;
    }

    // Check if product already in items
    const existingIndex = items.findIndex((i) => i.product_id === product.product_id);
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = calculateItemSubtotal(updated[existingIndex]);
      setItems(updated);
    } else {
      // Add new item
      const newItem: BillItem = {
        product_id: product.product_id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        price: Number(product.selling_price),
        discount: 0,
        gst_percent: Number(product.gst_percent),
        subtotal: Number(product.selling_price),
      };
      setItems([...items, newItem]);
    }

    setProductSearch("");
  };

  const calculateItemSubtotal = (item: BillItem) => {
    return (item.price - item.discount) * item.quantity;
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = quantity;
    updated[index].subtotal = calculateItemSubtotal(updated[index]);
    setItems(updated);
  };

  const updateDiscount = (index: number, discount: number) => {
    const updated = [...items];
    updated[index].discount = discount;
    updated[index].subtotal = calculateItemSubtotal(updated[index]);
    setItems(updated);
  };

  const deleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const gstTotal = items.reduce((sum, item) => {
    const taxableAmount = item.subtotal;
    return sum + (taxableAmount * item.gst_percent) / 100;
  }, 0);
  const grandTotal = itemTotal + gstTotal - billDiscount;

  // Submit bill
  const handleSubmitBill = async () => {
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const billData: CreateBillData = {
        customer_id: selectedCustomerId,
        bill_discount: billDiscount,
        payment_type: paymentType,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
      };

      const createdBill = await billService.createBill(billData);
      alert(`Bill created successfully! Bill ID: ${createdBill.bill_id}`);

      // Reset form
      setItems([]);
      setSelectedCustomerId(undefined);
      setBillDiscount(0);
      setPaymentType("Cash");

      // Optionally navigate to bill history
      // navigate("/bill-history");
    } catch (err: any) {
      console.error("Failed to create bill:", err);
      setError(err.response?.data?.detail || err.message || "Failed to create bill");
      alert(`Error: ${err.response?.data?.detail || err.message || "Failed to create bill"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="col-span-3 flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Bill</h1>
        <button
          onClick={() => navigate("/Billing")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⬅ Back
        </button>
      </div>

      {error && (
        <div className="col-span-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* LEFT SIDE */}
      <div className="col-span-2 space-y-6">
        {/* Customer Selection */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">Customer</h2>
          <div className="flex gap-2">
            <select
              className="flex-1 border p-2 rounded"
              value={selectedCustomerId || ""}
              onChange={(e) =>
                setSelectedCustomerId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
            <button
              onClick={openCustomerModal}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
            >
              + New Customer
            </button>
          </div>
        </div>

        {/* Add Items */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">Add Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Enter Product SKU"
              className="border p-2 rounded col-span-2"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchProduct()}
            />
            <button
              onClick={handleSearchProduct}
              className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
          <h2 className="text-xl font-semibold mb-3">Bill Items</h2>
          <table className="w-full border text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">SKU</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Discount</th>
                <th className="border p-2">GST%</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-3 text-gray-500">
                    No items added
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{item.product_name}</td>
                    <td className="border p-2">{item.sku}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                        className="border p-1 rounded w-16"
                      />
                    </td>
                    <td className="border p-2">₹{item.price.toFixed(2)}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateDiscount(idx, Number(e.target.value))}
                        className="border p-1 rounded w-20"
                      />
                    </td>
                    <td className="border p-2">{item.gst_percent}%</td>
                    <td className="border p-2">₹{item.subtotal.toFixed(2)}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => deleteItem(idx)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE SUMMARY */}
      <div className="bg-white p-4 rounded-xl shadow h-fit sticky top-4">
        <h2 className="text-xl font-semibold mb-4">Bill Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Item Total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST Total</span>
            <span>₹{gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bill Discount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={billDiscount}
              onChange={(e) => setBillDiscount(Number(e.target.value))}
              className="border p-1 rounded w-24 text-right"
            />
          </div>
          <hr />
          <div className="flex justify-between font-semibold text-lg">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="font-semibold">Payment Type</label>
          <select
            className="w-full border p-2 rounded"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Credit</option>
          </select>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSubmitBill}
            disabled={loading || items.length === 0}
            className={`w-full p-3 rounded font-semibold ${loading || items.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
              }`}
          >
            {loading ? "Creating Bill..." : "Create Bill"}
          </button>
        </div>

        <p className="text-center text-gray-500 mt-4 text-sm">
          Total Items: {items.length}
        </p>
      </div>

      {/* Customer Creation Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create New Customer</h2>
                <button
                  onClick={closeCustomerModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {customerError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {customerError}
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    placeholder="Enter customer name"
                    value={customerFormData.name}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, name: e.target.value })
                    }
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border p-2 rounded"
                    placeholder="Enter phone number"
                    value={customerFormData.phone}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, phone: e.target.value })
                    }
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border p-2 rounded"
                    placeholder="Enter email address"
                    value={customerFormData.email}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, email: e.target.value })
                    }
                  />
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    placeholder="Enter GST number"
                    value={customerFormData.gst_number}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, gst_number: e.target.value })
                    }
                  />
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Type</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={customerFormData.type}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, type: e.target.value })
                    }
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCustomerModal}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={customerLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={customerLoading}
                  className={`flex-1 px-4 py-2 rounded ${customerLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {customerLoading ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBill;