import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Truck, Building2, Phone,
    MapPin, CreditCard, FileText, AlertCircle
} from 'lucide-react';
import { supplierService, type Supplier } from '../../services/supplierService';

const SupplierDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = searchParams.get('edit') === 'true' || !id;
    const isNewSupplier = !id;

    const [supplier, setSupplier] = useState<Partial<Supplier>>({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        alternate_phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gst_number: '',
        pan_number: '',
        bank_name: '',
        bank_account_number: '',
        bank_ifsc: '',
        payment_terms: '',
        credit_limit: 0,
        status: 'active',
        notes: '',
    });

    const [loading, setLoading] = useState(!isNewSupplier);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(isEditMode);

    useEffect(() => {
        if (id) {
            fetchSupplier();
        }
    }, [id]);

    const fetchSupplier = async () => {
        try {
            setLoading(true);
            const data = await supplierService.getSupplier(Number(id));
            setSupplier(data);
            setError(null);
        } catch (err) {
            setError('Failed to load supplier details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!supplier.name?.trim()) {
            setError('Supplier name is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (isNewSupplier) {
                await supplierService.createSupplier(supplier);
            } else {
                await supplierService.updateSupplier(Number(id), supplier);
            }

            navigate('/suppliers');
        } catch (err: any) {
            setError(err.message || 'Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSupplier(prev => ({
            ...prev,
            [name]: name === 'credit_limit' ? parseFloat(value) || 0 : value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/suppliers')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Truck className="text-blue-600" />
                            {isNewSupplier ? 'Add Supplier' : editing ? 'Edit Supplier' : supplier.name}
                        </h1>
                        {!isNewSupplier && !editing && (
                            <p className="text-gray-500 text-sm mt-1">{supplier.status}</p>
                        )}
                    </div>
                </div>
                {!isNewSupplier && !editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Edit Supplier
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-gray-500" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={supplier.name || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Person
                            </label>
                            <input
                                type="text"
                                name="contact_person"
                                value={supplier.contact_person || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={supplier.status || 'active'}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Phone size={20} className="text-gray-500" />
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={supplier.phone || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alternate Phone
                            </label>
                            <input
                                type="tel"
                                name="alternate_phone"
                                value={supplier.alternate_phone || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={supplier.email || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-gray-500" />
                        Address
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                name="address"
                                value={supplier.address || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={supplier.city || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={supplier.state || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pincode
                            </label>
                            <input
                                type="text"
                                name="pincode"
                                value={supplier.pincode || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-gray-500" />
                        Business Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GST Number
                            </label>
                            <input
                                type="text"
                                name="gst_number"
                                value={supplier.gst_number || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PAN Number
                            </label>
                            <input
                                type="text"
                                name="pan_number"
                                value={supplier.pan_number || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Terms
                            </label>
                            <input
                                type="text"
                                name="payment_terms"
                                value={supplier.payment_terms || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="e.g., Net 30, COD"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credit Limit (₹)
                            </label>
                            <input
                                type="number"
                                name="credit_limit"
                                value={supplier.credit_limit || 0}
                                onChange={handleChange}
                                disabled={!editing}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Banking Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-gray-500" />
                        Banking Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                name="bank_name"
                                value={supplier.bank_name || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                name="bank_account_number"
                                value={supplier.bank_account_number || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IFSC Code
                            </label>
                            <input
                                type="text"
                                name="bank_ifsc"
                                value={supplier.bank_ifsc || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Notes</h2>
                    <textarea
                        name="notes"
                        value={supplier.notes || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        rows={3}
                        placeholder="Add any additional notes..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                </div>

                {/* Actions */}
                {editing && (
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => isNewSupplier ? navigate('/suppliers') : setEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Supplier'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default SupplierDetails;
