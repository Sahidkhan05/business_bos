import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Plus, Search, Calendar, MoreVertical,
    Eye, XCircle, CheckCircle, Clock, AlertCircle, Truck
} from 'lucide-react';
import {
    supplierService,
    type PurchaseOrderListItem,
    type POStats,
    type SupplierListItem
} from '../../services/supplierService';

const PurchaseOrderList: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
    const [stats, setStats] = useState<POStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [supplierFilter, setSupplierFilter] = useState<string>('');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [statusFilter, supplierFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersData, statsData, suppliersData] = await Promise.all([
                supplierService.getPurchaseOrders({
                    status: statusFilter || undefined,
                    supplier: supplierFilter ? Number(supplierFilter) : undefined,
                }),
                supplierService.getPurchaseOrderStats(),
                supplierService.getSuppliers()
            ]);
            setOrders(ordersData);
            setStats(statsData);
            setSuppliers(suppliersData);
            setError(null);
        } catch (err) {
            setError('Failed to load purchase orders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this purchase order?')) return;

        try {
            await supplierService.cancelPurchaseOrder(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Failed to cancel purchase order');
        }
        setActiveMenu(null);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock size={14} /> },
            ordered: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Package size={14} /> },
            partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={14} /> },
            received: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} /> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} /> },
        };
        const style = styles[status] || styles.draft;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} flex items-center gap-1 w-fit`}>
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
            maximumFractionDigits: 0
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
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-blue-600" />
                        Purchase Orders
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage orders from your suppliers
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/suppliers')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Truck size={18} />
                        Suppliers
                    </button>
                    <button
                        onClick={() => navigate('/purchase-orders/create')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create PO
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Total POs</p>
                        <p className="text-2xl font-bold">{stats.total_purchase_orders}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Draft</p>
                        <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Ordered</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.ordered}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Partial</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Pending Value</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.pending_value)}</p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by PO number or supplier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="ordered">Ordered</option>
                        <option value="partial">Partially Received</option>
                        <option value="received">Fully Received</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map(s => (
                            <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">PO Number</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Supplier</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order Date</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Expected</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Items</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-500">
                                    {searchQuery || statusFilter || supplierFilter
                                        ? 'No purchase orders found matching your filters'
                                        : 'No purchase orders yet. Create your first PO!'}
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.po_id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-blue-600">#{order.po_number}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {order.supplier_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {formatDate(order.order_date)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {order.items_count} items
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-4 py-3 text-right relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === order.po_id ? null : order.po_id)}
                                            className="p-2 hover:bg-gray-100 rounded"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === order.po_id && (
                                            <div className="absolute right-4 top-12 bg-white border rounded-lg shadow-lg py-1 z-10 w-44">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/purchase-orders/${order.po_id}`);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Eye size={16} />
                                                    View Details
                                                </button>
                                                {order.status !== 'cancelled' && order.status !== 'received' && (
                                                    <button
                                                        onClick={() => handleCancel(order.po_id)}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                                    >
                                                        <XCircle size={16} />
                                                        Cancel PO
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchaseOrderList;
