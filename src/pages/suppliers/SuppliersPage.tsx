import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck, Plus, Search, Phone, Mail, MoreVertical,
    Edit, Trash2, Eye, Package, DollarSign, AlertCircle
} from 'lucide-react';
import {
    supplierService,
    type SupplierListItem,
    type SupplierStats
} from '../../services/supplierService';

const SuppliersPage: React.FC = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
    const [stats, setStats] = useState<SupplierStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [suppliersData, statsData] = await Promise.all([
                supplierService.getSuppliers(),
                supplierService.getSupplierStats()
            ]);
            setSuppliers(suppliersData);
            setStats(statsData);
            setError(null);
        } catch (err) {
            setError('Failed to load suppliers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;

        try {
            await supplierService.deleteSupplier(id);
            setSuppliers(suppliers.filter(s => s.supplier_id !== id));
            // Refresh stats
            const statsData = await supplierService.getSupplierStats();
            setStats(statsData);
        } catch (err) {
            alert('Failed to delete supplier. They may have existing purchase orders.');
        }
        setActiveMenu(null);
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (supplier.phone?.includes(searchQuery)) ||
            (supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = !statusFilter || supplier.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-700',
            blocked: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
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
                        <Truck className="text-blue-600" />
                        Suppliers
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your suppliers and vendors
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Package size={18} />
                        Purchase Orders
                    </button>
                    <button
                        onClick={() => navigate('/suppliers/add')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Suppliers</p>
                                <p className="text-2xl font-bold">{stats.total_suppliers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Truck className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active Suppliers</p>
                                <p className="text-2xl font-bold">{stats.active_suppliers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Package className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending POs</p>
                                <p className="text-2xl font-bold">{stats.pending_purchase_orders}</p>
                            </div>
                        </div>
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
                                placeholder="Search suppliers..."
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
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Supplier</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    {searchQuery || statusFilter ? 'No suppliers found matching your filters' : 'No suppliers yet. Add your first supplier!'}
                                </td>
                            </tr>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <tr key={supplier.supplier_id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{supplier.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {supplier.contact_person || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {supplier.phone ? (
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <Phone size={14} />
                                                {supplier.phone}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {supplier.email ? (
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <Mail size={14} />
                                                {supplier.email}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(supplier.status)}
                                    </td>
                                    <td className="px-4 py-3 text-right relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === supplier.supplier_id ? null : supplier.supplier_id)}
                                            className="p-2 hover:bg-gray-100 rounded"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === supplier.supplier_id && (
                                            <div className="absolute right-4 top-12 bg-white border rounded-lg shadow-lg py-1 z-10 w-40">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/suppliers/${supplier.supplier_id}`);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Eye size={16} />
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigate(`/suppliers/${supplier.supplier_id}?edit=true`);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.supplier_id)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
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

export default SuppliersPage;
