import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { productService } from "../services/productService";
import type { Product } from "../services/productService";

import { customerService } from "../services/customerService";
import type { Customer, CreateCustomerData } from "../services/customerService";

import { billService } from "../services/billService";
import type { CreateBillData } from "../services/billService";

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

  /* ---------------- CUSTOMER ---------------- */
  const [mobileInput, setMobileInput] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [showNewCustomerCard, setShowNewCustomerCard] = useState(false);

  /* ---------------- NEW CUSTOMER ---------------- */
  const [newCustomer, setNewCustomer] = useState<CreateCustomerData>({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    type: "Regular",
  });

  /* ---------------- PRODUCTS & BILL ---------------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("Cash");

  /* ✅ FIX: loading state added */
  const [loading, setLoading] = useState(false);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    const data = await customerService.getCustomers();
    setCustomers(data);
  };

  const loadProducts = async () => {
    const data = await productService.getProducts();
    setProducts(data);
  };

  /* ---------------- SEARCH CUSTOMER ---------------- */
  const handleSearchCustomer = () => {
    if (mobileInput.length !== 10) {
      alert("Enter valid 10 digit mobile number");
      return;
    }

    const found = customers.find((c) => c.phone === mobileInput);

    if (found) {
      setSelectedCustomer(found);
      setCustomerNotFound(false);
      setShowNewCustomerCard(false);
    } else {
      setSelectedCustomer(null);
      setCustomerNotFound(true);
      setShowNewCustomerCard(false);
      setNewCustomer({ ...newCustomer, phone: mobileInput });
    }
  };

  /* ---------------- CREATE CUSTOMER ---------------- */
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert("Customer name required");
      return;
    }

    const created = await customerService.createCustomer(newCustomer);
    await loadCustomers();
    setSelectedCustomer(created);
    setCustomerNotFound(false);
    setShowNewCustomerCard(false);
  };

  /* ---------------- ITEM LOGIC ---------------- */
  const calculateSubtotal = (item: BillItem) =>
    (item.price - item.discount) * item.quantity;

  const handleAddItem = () => {
    if (!selectedCustomer) {
      alert("Select customer first");
      return;
    }

    const product = products.find(
      (p) => p.sku.toLowerCase() === productSearch.toLowerCase()
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    const index = items.findIndex((i) => i.product_id === product.product_id);

    if (index >= 0) {
      const updated = [...items];
      updated[index].quantity += 1;
      updated[index].subtotal = calculateSubtotal(updated[index]);
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: product.product_id!,
          product_name: product.name,
          sku: product.sku,
          quantity: 1,
          price: Number(product.selling_price),
          discount: 0,
          gst_percent: Number(product.gst_percent),
          subtotal: Number(product.selling_price),
        },
      ]);
    }

    setProductSearch("");
  };

  /* ---------------- TOTALS ---------------- */
  const itemTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const gstTotal = items.reduce(
    (s, i) => s + (i.subtotal * i.gst_percent) / 100,
    0
  );
  const grandTotal = itemTotal + gstTotal - billDiscount;

  /* ---------------- FINAL BILL ---------------- */
  const finalizeBill = async (action?: "print" | "whatsapp") => {
    if (!selectedCustomer) return alert("Customer required");
    if (items.length === 0) return alert("Add items");

    setLoading(true);
    try {
      const billData: CreateBillData = {
        customer_id: selectedCustomer.customer_id,
        bill_discount: billDiscount,
        payment_type: paymentType,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
        })),
      };

      const bill = await billService.createBill(billData);

      if (action === "print") {
        window.print();
      }

      if (action === "whatsapp") {
        const msg = `Hello ${selectedCustomer.name}
Bill No: ${bill.bill_id}
Total: ₹${grandTotal.toFixed(2)}
Thank you!`;

        window.open(
          `https://wa.me/91${selectedCustomer.phone}?text=${encodeURIComponent(
            msg
          )}`
        );
      }

      alert("Bill created successfully");

      setItems([]);
      setSelectedCustomer(null);
      setMobileInput("");
      setBillDiscount(0);
      setPaymentType("Cash");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* HEADER */}
      <div className="col-span-3 flex justify-between">
        <h1 className="text-3xl font-bold">Create Bill</h1>
        <button
          onClick={() => navigate("/Billing")}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          ⬅ Back
        </button>
      </div>

      {/* LEFT */}
      <div className="col-span-2 space-y-4">
        {/* CUSTOMER SEARCH */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Customer Search</h2>
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Enter mobile number"
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
            />
            <button
              onClick={handleSearchCustomer}
              className="bg-blue-600 text-white px-4"
            >
              Search
            </button>
          </div>
        </div>

        {selectedCustomer && (
          <div className="bg-green-50 border border-green-300 p-4 rounded">
            <b>{selectedCustomer.name}</b> ({selectedCustomer.phone})
          </div>
        )}

        {customerNotFound && (
          <div className="bg-red-50 border border-red-300 p-4 rounded">
            Customer not found
            <button
              onClick={() => setShowNewCustomerCard(true)}
              className="ml-3 bg-blue-600 text-white px-3 py-1 rounded"
            >
              + New
            </button>
          </div>
        )}

        {showNewCustomerCard && (
          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded">
            <input
              className="border p-2 w-full mb-2"
              placeholder="Customer Name"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
            />
            <button
              onClick={handleCreateCustomer}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Customer
            </button>
          </div>
        )}

        {/* ADD ITEM */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Add Item</h2>
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Product SKU"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              className="bg-blue-600 text-white px-4"
            >
              Add
            </button>
          </div>
        </div>

        {/* ITEMS TABLE */}
        {items.length > 0 && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Added Items</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Item</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">GST</th>
                  <th className="border p-2">Subtotal</th>
                  <th className="border p-2">❌</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.product_id}>
                    <td className="border p-2">{item.product_name}</td>
                    <td className="border p-2 text-center">
                      <input
                        type="number"
                        min={1}
                        className="w-16 border text-center"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          const updated = [...items];
                          updated[index].quantity = qty;
                          updated[index].subtotal =
                            (updated[index].price -
                              updated[index].discount) *
                            qty;
                          setItems(updated);
                        }}
                      />
                    </td>
                    <td className="border p-2">₹{item.price}</td>
                    <td className="border p-2">{item.gst_percent}%</td>
                    <td className="border p-2">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() =>
                          setItems(items.filter((_, i) => i !== index))
                        }
                        className="text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT SUMMARY */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Bill Summary</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Item Total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST</span>
            <span>₹{gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <input
              type="number"
              className="border w-20 text-right"
              value={billDiscount}
              onChange={(e) => setBillDiscount(Number(e.target.value))}
            />
          </div>
          <hr />
          <div className="flex justify-between font-semibold">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <select
          className="w-full border p-2 mt-3"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Credit</option>
        </select>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            disabled={loading}
            onClick={() => finalizeBill()}
            className="bg-gray-700 text-white p-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => finalizeBill("print")}
            className="bg-blue-600 text-white p-2 rounded"
          >
            Print
          </button>
          <button
            onClick={() => finalizeBill("whatsapp")}
            className="bg-green-600 text-white p-2 rounded"
          >
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBill;
