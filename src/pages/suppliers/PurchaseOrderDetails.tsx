import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Package, Calendar, Truck, CheckCircle,
    Clock, XCircle, Download, AlertCircle, DollarSign
} from 'lucide-react';
import {
    supplierService,
    type PurchaseOrder,
    type ReceiveItemRequest
} from '../../services/supplierService';

const PurchaseOrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [receiving, setReceiving] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const data = await supplierService.getPurchaseOrder(Number(id));
            setOrder(data);

            // Initialize receive quantities
            const quantities: Record<number, number> = {};
            data.items.forEach(item => {
                const remaining = item.quantity_ordered - item.quantity_received;
                quantities[item.po_item_id!] = remaining;
            });
            setReceiveQuantities(quantities);

            setError(null);
        } catch (err) {
            setError('Failed to load purchase order');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveItems = async () => {
        if (!order) return;

        const itemsToReceive: ReceiveItemRequest[] = order.items
            .filter(item => {
                const qty = receiveQuantities[item.po_item_id!] || 0;
                return qty > 0;
            })
            .map(item => ({
                po_item_id: item.po_item_id!,
                quantity: receiveQuantities[item.po_item_id!] || 0
            }));

        if (itemsToReceive.length === 0) {
            setError('Please enter quantities to receive');
            return;
        }

        try {
            setReceiving(true);
            setError(null);
            await supplierService.receiveItems(order.po_id!, itemsToReceive);
            setShowReceiveModal(false);
            fetchOrder(); // Refresh order data
        } catch (err: any) {
            setError(err.message || 'Failed to receive items');
        } finally {
            setReceiving(false);
        }
    };

    const handleMarkOrdered = async () => {
        if (!order) return;

        try {
            await supplierService.markOrdered(order.po_id!);
            fetchOrder();
        } catch (err: any) {
            setError(err.message || 'Failed to mark as ordered');
        }
    };

    const handleCancel = async () => {
        if (!order) return;
        if (!confirm('Are you sure you want to cancel this purchase order?')) return;

        try {
            await supplierService.cancelPurchaseOrder(order.po_id!);
            fetchOrder();
        } catch (err: any) {
            setError(err.message || 'Failed to cancel order');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock size={16} /> },
            ordered: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Package size={16} /> },
            partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={16} /> },
            received: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} /> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} /> },
        };
        const style = styles[status] || styles.draft;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text} flex items-center gap-1 w-fit`}>
                {style.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

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

    if (!order) {
        return (
            <div className="p-6 text-center text-gray-500">
                Purchase order not found
            </div>
        );
    }

    const canReceive = order.status === 'ordered' || order.status === 'partial';
    const canCancel = order.status === 'draft' || order.status === 'ordered';
    const canMarkOrdered = order.status === 'draft';

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="text-blue-600" />
                            PO #{order.po_number}
                        </h1>
                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canMarkOrdered && (
                        <button
                            onClick={handleMarkOrdered}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            Mark as Ordered
                        </button>
                    )}
                    {canReceive && (
                        <button
                            onClick={() => setShowReceiveModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Receive Items
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                        >
                            Cancel PO
                        </button>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Supplier</p>
                            <p className="font-semibold">{order.supplier_name}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="font-semibold">{formatDate(order.order_date)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <DollarSign className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="font-semibold">{formatCurrency(order.total_amount || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Order Items</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Ordered</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Received</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Pending</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Unit Price</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => {
                            const pending = item.quantity_ordered - item.quantity_received;
                            return (
                                <tr key={item.po_item_id} className="border-b">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">{item.quantity_ordered}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={item.quantity_received > 0 ? 'text-green-600 font-medium' : ''}>
                                            {item.quantity_received}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={pending > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                            {pending}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal || 0)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={5} className="px-4 py-3 text-right font-medium">Subtotal</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.subtotal || 0)}</td>
                        </tr>
                        {order.tax_amount > 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Tax</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(order.tax_amount)}</td>
                            </tr>
                        )}
                        {order.shipping_cost > 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Shipping</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(order.shipping_cost)}</td>
                            </tr>
                        )}
                        {order.discount_amount > 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Discount</td>
                                <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(order.discount_amount)}</td>
                            </tr>
                        )}
                        <tr className="border-t-2">
                            <td colSpan={5} className="px-4 py-3 text-right text-lg font-bold">Total</td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">
                                {formatCurrency(order.total_amount || 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-2">Notes</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                </div>
            )}

            {/* Receive Items Modal */}
            {showReceiveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Receive Items</h2>
                            <button
                                onClick={() => setShowReceiveModal(false)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600 mb-4">
                                Enter the quantity received for each item. This will update your inventory stock.
                            </p>
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Product</th>
                                        <th className="text-center px-3 py-2 text-sm font-medium text-gray-600">Pending</th>
                                        <th className="text-center px-3 py-2 text-sm font-medium text-gray-600">Receive</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items
                                        .filter(item => item.quantity_ordered > item.quantity_received)
                                        .map((item) => {
                                            const pending = item.quantity_ordered - item.quantity_received;
                                            return (
                                                <tr key={item.po_item_id} className="border-b">
                                                    <td className="px-3 py-2">
                                                        <p className="font-medium">{item.product_name}</p>
                                                        <p className="text-xs text-gray-500">{item.product_sku}</p>
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-orange-600 font-medium">
                                                        {pending}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={pending}
                                                            value={receiveQuantities[item.po_item_id!] || 0}
                                                            onChange={(e) => setReceiveQuantities({
                                                                ...receiveQuantities,
                                                                [item.po_item_id!]: Math.min(parseInt(e.target.value) || 0, pending)
                                                            })}
                                                            className="w-20 px-2 py-1 border rounded text-center"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowReceiveModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReceiveItems}
                                disabled={receiving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                {receiving ? 'Receiving...' : 'Confirm Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderDetails;
