import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateBill: React.FC = () => {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
  });
  const [productCode, setProductCode] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    itemTotal: 0,
    paymentType: "Cash",
    amountReceived: "",
    change: 0,
    grandTotal: 0,
  });
  const [productsFromStorage, setProductsFromStorage] = useState<any[]>([]);
  const [billNumber, setBillNumber] = useState("");

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setProductsFromStorage(storedProducts);

    const bills = JSON.parse(localStorage.getItem("bills") || "[]");
    if (bills.length === 0) {
      setBillNumber("BN-1001");
    } else {
      const lastBillNumber = bills[bills.length - 1].billNumber;
      const num = parseInt(lastBillNumber.split("-")[1]) + 1;
      setBillNumber(`BN-${num}`);
    }
  }, []);

  const calculateSummary = (updated: any[]) => {
    const itemTotal = updated.reduce((acc, item) => acc + item.price * item.qty, 0);
    setSummary((prev) => ({
      ...prev,
      itemTotal,
      grandTotal: itemTotal,
      change: Number(prev.amountReceived || 0) - itemTotal,
    }));
  };

  const handleSearchProduct = () => {
    const product = productsFromStorage.find((p) => p.sku === productCode);
    if (!product) return alert("Invalid Product Code!");

    const newItem = {
      code: product.sku,
      name: product.name,
      price: Number(product.sellingPrice) || 0,
      qty: 1,
      subtotal: Number(product.sellingPrice) || 0,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    calculateSummary(updatedItems);
    setProductCode("");
  };

  const updateQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].qty = qty;
    updated[index].subtotal = qty * updated[index].price;
    setItems(updated);
    calculateSummary(updated);
  };

  const deleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    calculateSummary(updated);
  };

  const saveBill = () => {
    if (!customer.name.trim()) return alert("Customer name is required!");
    if (!customer.mobile.trim()) return alert("Mobile number is required!");
    if (!customer.address.trim()) return alert("Address is required!");
    if (items.length === 0) return alert("No items added!");
    if (!summary.amountReceived.trim()) return alert("Amount received is required!");

    const bills = JSON.parse(localStorage.getItem("bills") || "[]");

    const newBill = {
      id: Date.now(),
      billNumber,
      customerName: customer.name,
      mobile: customer.mobile,
      address: customer.address,
      paymentType: summary.paymentType,
      amountReceived: summary.amountReceived,
      change: summary.change,
      totalAmount: summary.grandTotal,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items,
    };

    bills.push(newBill);
    localStorage.setItem("bills", JSON.stringify(bills));

    alert(`Bill Saved! Your Bill Number: ${billNumber}`);

    setBillNumber(`BN-${parseInt(billNumber.split("-")[1]) + 1}`);
    setCustomer({ name: "", mobile: "", address: "" });
    setItems([]);
    setSummary({ itemTotal: 0, paymentType: "Cash", amountReceived: "", change: 0, grandTotal: 0 });
  };

  const handlePrint = () => {
    saveBill();
    window.print();
  };

  const sendWhatsApp = () => {
    if (!customer.mobile.trim()) return alert("Enter customer mobile!");
    saveBill();
    const msg = `Hello ${customer.name}, Your Bill Number: ${billNumber}, Total Amount: ₹${summary.grandTotal}, Payment: ${summary.paymentType}, Amount Received: ₹${summary.amountReceived}, Change: ₹${summary.change}. Thank you for shopping!`;
    window.open(`https://wa.me/91${customer.mobile}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="p-4 sm:p-6 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="col-span-3 flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Bill</h1>
        <button onClick={() => navigate("/Billing")} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">⬅ Back</button>
      </div>

      {/* LEFT SIDE */}
      <div className="col-span-2 space-y-6">
        {/* Customer */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">Customer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Customer Name" className="border p-2 rounded" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required />
            <input type="text" placeholder="Mobile" className="border p-2 rounded" value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} required />
            <input type="text" placeholder="Address" className="border p-2 rounded" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} required />
          </div>
        </div>

        {/* Add Items */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">Add Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Enter Product Code" className="border p-2 rounded" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
            <button onClick={handleSearchProduct} className="bg-blue-600 text-white rounded p-2">Search</button>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
          <h2 className="text-xl font-semibold mb-3">Bill Items</h2>
          <table className="w-full border text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-3">No items added</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">
                      <select value={item.qty} onChange={(e) => updateQty(idx, Number(e.target.value))} className="border p-1 rounded">
                        {[...Array(10)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                      </select>
                    </td>
                    <td className="border p-2">₹{item.price}</td>
                    <td className="border p-2">₹{item.subtotal}</td>
                    <td className="border p-2">
                      <button onClick={() => deleteItem(idx)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
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
          <div className="flex justify-between"><span>Bill Number</span> <span>{billNumber}</span></div>
          <div className="flex justify-between"><span>Item Total</span> <span>₹{summary.itemTotal}</span></div>
          <div className="flex justify-between font-semibold text-lg"><span>Grand Total</span> <span>₹{summary.grandTotal}</span></div>
        </div>

        <div className="mt-4 space-y-3">
          <label>Payment Type</label>
          <select className="w-full border p-2 rounded" value={summary.paymentType} onChange={(e) => setSummary({ ...summary, paymentType: e.target.value })}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Credit</option>
          </select>

          <input type="text" placeholder="Amount Received" className="w-full border p-2 rounded" value={summary.amountReceived} onChange={(e) => setSummary({ ...summary, amountReceived: e.target.value, change: Number(e.target.value || 0) - summary.grandTotal })} required />

          <div className="flex justify-between font-semibold"><span>Change</span> <span>₹{summary.change}</span></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={saveBill} className="bg-gray-700 text-white p-2 rounded">Save Only</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white p-2 rounded">Print</button>
          <button onClick={sendWhatsApp} className="bg-green-600 text-white p-2 rounded col-span-2">WhatsApp</button>
        </div>
        <p className="text-center text-gray-500 mt-4">Thank you!</p>
      </div>
    </div>
  );
};

export default CreateBill;