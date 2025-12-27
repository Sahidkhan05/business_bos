import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trash2, Save, Package,
    Search, AlertCircle
} from 'lucide-react';
import {
    supplierService,
    type SupplierListItem
} from '../../services/supplierService';
import { productService, type Product } from '../../services/productService';

interface POItem {
    product: number;
    product_name: string;
    product_sku: string;
    quantity_ordered: number;
    unit_price: number;
    tax_percent: number;
    discount_percent: number;
    subtotal: number;
}

const CreatePurchaseOrder: React.FC = () => {
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [poNumber, setPoNumber] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [taxAmount, setTaxAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [items, setItems] = useState<POItem[]>([]);

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    useEffect(() => {
        fetchData();
        generatePONumber();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [suppliersData, productsData] = await Promise.all([
                supplierService.getSuppliers(),
                productService.getProducts()
            ]);
            setSuppliers(suppliersData.filter(s => s.status === 'active'));
            setProducts(productsData);
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generatePONumber = () => {
        const date = new Date();
        const prefix = 'PO';
        const timestamp = date.getFullYear().toString().slice(-2) +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0');
        setPoNumber(`${prefix}-${timestamp}`);
    };

    const addProduct = (product: Product) => {
        // Check if product already added
        if (items.some(item => item.product === product.product_id)) {
            setProductSearch('');
            setShowProductDropdown(false);
            return;
        }

        const newItem: POItem = {
            product: product.product_id!,
            product_name: product.name,
            product_sku: product.sku,
            quantity_ordered: 1,
            unit_price: Number(product.purchase_price),
            tax_percent: Number(product.gst_percent) || 0,
            discount_percent: 0,
            subtotal: Number(product.purchase_price)
        };

        setItems([...items, newItem]);
        setProductSearch('');
        setShowProductDropdown(false);
    };

    const updateItem = (index: number, field: keyof POItem, value: number) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // Recalculate subtotal
        const item = updatedItems[index];
        const base = item.quantity_ordered * item.unit_price;
        const discount = base * (item.discount_percent / 100);
        updatedItems[index].subtotal = base - discount;

        setItems(updatedItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + taxAmount + shippingCost - discountAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSupplier) {
            setError('Please select a supplier');
            return;
        }

        if (items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await supplierService.createPurchaseOrder({
                po_number: poNumber,
                supplier: selectedSupplier as number,
                order_date: orderDate,
                expected_delivery_date: expectedDate || undefined,
                tax_amount: taxAmount,
                discount_amount: discountAmount,
                shipping_cost: shippingCost,
                notes: notes || undefined,
                items: items.map(item => ({
                    product: item.product,
                    quantity_ordered: item.quantity_ordered,
                    unit_price: item.unit_price,
                    tax_percent: item.tax_percent,
                    discount_percent: item.discount_percent
                }))
            });

            navigate('/purchase-orders');
        } catch (err: any) {
            setError(err.message || 'Failed to create purchase order');
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/purchase-orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-blue-600" />
                        Create Purchase Order
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Order products from your suppliers
                    </p>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* PO Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PO Number *
                            </label>
                            <input
                                type="text"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier *
                            </label>
                            <select
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Order Date *
                            </label>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Delivery
                            </label>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Products */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4">Products</h2>

                    {/* Product Search */}
                    <div className="relative mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowProductDropdown(true);
                                }}
                                onFocus={() => setShowProductDropdown(true)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {showProductDropdown && productSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredProducts.length === 0 ? (
                                    <div className="px-4 py-3 text-gray-500">No products found</div>
                                ) : (
                                    filteredProducts.map(product => (
                                        <button
                                            key={product.product_id}
                                            type="button"
                                            onClick={() => addProduct(product)}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">{formatCurrency(Number(product.purchase_price))}</p>
                                                <p className="text-xs text-gray-500">Stock: {product.current_stock}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    {items.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Product</th>
                                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-600">Qty</th>
                                    <th className="text-right px-3 py-2 text-sm font-medium text-gray-600">Unit Price</th>
                                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-600">Tax %</th>
                                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-600">Disc %</th>
                                    <th className="text-right px-3 py-2 text-sm font-medium text-gray-600">Subtotal</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-3 py-2">
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-xs text-gray-500">{item.product_sku}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity_ordered}
                                                onChange={(e) => updateItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                                                className="w-20 px-2 py-1 border rounded text-center"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                className="w-24 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.tax_percent}
                                                onChange={(e) => updateItem(index, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border rounded text-center"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.discount_percent}
                                                onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border rounded text-center"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium">
                                            {formatCurrency(item.subtotal)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            <Package size={40} className="mx-auto mb-2 text-gray-300" />
                            <p>No items added yet</p>
                            <p className="text-sm">Search and add products above</p>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Add any notes for this order..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Totals */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tax Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={taxAmount}
                                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                                    className="w-32 px-2 py-1 border rounded text-right"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Shipping Cost</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                    className="w-32 px-2 py-1 border rounded text-right"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Discount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    className="w-32 px-2 py-1 border rounded text-right"
                                />
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="text-lg font-semibold">Total</span>
                                <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/purchase-orders')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || items.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Creating...' : 'Create Purchase Order'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePurchaseOrder;
