import { apiService } from './api';

// ============= Type Definitions =============

export interface Supplier {
    supplier_id?: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    alternate_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gst_number?: string;
    pan_number?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    payment_terms?: string;
    credit_limit?: number;
    status: 'active' | 'inactive' | 'blocked';
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SupplierListItem {
    supplier_id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    status: string;
}

export interface PurchaseOrderItem {
    po_item_id?: number;
    product: number;
    product_name?: string;
    product_sku?: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_price: number;
    tax_percent: number;
    discount_percent: number;
    subtotal?: number;
}

export interface PurchaseOrder {
    po_id?: number;
    po_number: string;
    supplier: number;
    supplier_name?: string;
    status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
    order_date: string;
    expected_delivery_date?: string;
    received_date?: string;
    subtotal?: number;
    tax_amount: number;
    discount_amount: number;
    shipping_cost: number;
    total_amount?: number;
    notes?: string;
    terms_and_conditions?: string;
    created_by?: number;
    created_by_name?: string;
    items: PurchaseOrderItem[];
    created_at?: string;
    updated_at?: string;
}

export interface PurchaseOrderListItem {
    po_id: number;
    po_number: string;
    supplier: number;
    supplier_name: string;
    status: string;
    order_date: string;
    expected_delivery_date?: string;
    total_amount: number;
    items_count: number;
}

export interface SupplierPayment {
    payment_id?: number;
    supplier: number;
    supplier_name?: string;
    purchase_order?: number;
    po_number?: string;
    amount: number;
    payment_type: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'other';
    payment_date: string;
    reference_number?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SupplierStats {
    total_suppliers: number;
    active_suppliers: number;
    pending_purchase_orders: number;
}

export interface POStats {
    total_purchase_orders: number;
    draft: number;
    ordered: number;
    partial: number;
    received: number;
    pending_value: number;
}

export interface ReceiveItemRequest {
    po_item_id: number;
    quantity: number;
}

export interface ReceiveItemsResponse {
    message: string;
    received_items: Array<{
        product: string;
        quantity: number;
        new_stock: number;
    }>;
    po_status: string;
}

// ============= Supplier Service =============

class SupplierService {
    private readonly baseUrl = '/api/suppliers';

    // ============= Suppliers =============

    async getSuppliers(): Promise<SupplierListItem[]> {
        return apiService.get<SupplierListItem[]>(`${this.baseUrl}/suppliers/`);
    }

    async getSupplier(id: number): Promise<Supplier> {
        return apiService.get<Supplier>(`${this.baseUrl}/suppliers/${id}/`);
    }

    async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
        return apiService.post<Supplier>(`${this.baseUrl}/suppliers/`, supplier);
    }

    async updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
        return apiService.put<Supplier>(`${this.baseUrl}/suppliers/${id}/`, supplier);
    }

    async deleteSupplier(id: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/suppliers/${id}/`);
    }

    async getSupplierStats(): Promise<SupplierStats> {
        return apiService.get<SupplierStats>(`${this.baseUrl}/suppliers/stats/`);
    }

    async getSupplierPurchaseOrders(supplierId: number): Promise<PurchaseOrderListItem[]> {
        return apiService.get<PurchaseOrderListItem[]>(
            `${this.baseUrl}/suppliers/${supplierId}/purchase-orders/`
        );
    }

    async getSupplierPayments(supplierId: number): Promise<SupplierPayment[]> {
        return apiService.get<SupplierPayment[]>(
            `${this.baseUrl}/suppliers/${supplierId}/payments/`
        );
    }

    // ============= Purchase Orders =============

    async getPurchaseOrders(filters?: {
        status?: string;
        supplier?: number;
        search?: string;
    }): Promise<PurchaseOrderListItem[]> {
        let url = `${this.baseUrl}/purchase-orders/`;
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        if (filters?.supplier) params.append('supplier', filters.supplier.toString());
        if (filters?.search) params.append('search', filters.search);

        if (params.toString()) url += `?${params.toString()}`;

        return apiService.get<PurchaseOrderListItem[]>(url);
    }

    async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
        return apiService.get<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/`);
    }

    async createPurchaseOrder(po: {
        po_number: string;
        supplier: number;
        order_date: string;
        expected_delivery_date?: string;
        tax_amount?: number;
        discount_amount?: number;
        shipping_cost?: number;
        notes?: string;
        items: Array<{
            product: number;
            quantity_ordered: number;
            unit_price: number;
            tax_percent?: number;
            discount_percent?: number;
        }>;
    }): Promise<PurchaseOrder> {
        return apiService.post<PurchaseOrder>(`${this.baseUrl}/purchase-orders/`, po);
    }

    async updatePurchaseOrder(id: number, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        return apiService.put<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/`, po);
    }

    async deletePurchaseOrder(id: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/purchase-orders/${id}/`);
    }

    async getPurchaseOrderStats(): Promise<POStats> {
        return apiService.get<POStats>(`${this.baseUrl}/purchase-orders/stats/`);
    }

    async receiveItems(poId: number, items: ReceiveItemRequest[]): Promise<ReceiveItemsResponse> {
        return apiService.post<ReceiveItemsResponse>(
            `${this.baseUrl}/purchase-orders/${poId}/receive-items/`,
            { items }
        );
    }

    async cancelPurchaseOrder(id: number): Promise<{ message: string; po_number: string }> {
        return apiService.post<{ message: string; po_number: string }>(
            `${this.baseUrl}/purchase-orders/${id}/cancel/`
        );
    }

    async markOrdered(id: number): Promise<{ message: string; po_number: string }> {
        return apiService.post<{ message: string; po_number: string }>(
            `${this.baseUrl}/purchase-orders/${id}/mark-ordered/`
        );
    }

    // ============= Payments =============

    async getPayments(filters?: {
        supplier?: number;
        payment_type?: string;
    }): Promise<SupplierPayment[]> {
        let url = `${this.baseUrl}/payments/`;
        const params = new URLSearchParams();

        if (filters?.supplier) params.append('supplier', filters.supplier.toString());
        if (filters?.payment_type) params.append('payment_type', filters.payment_type);

        if (params.toString()) url += `?${params.toString()}`;

        return apiService.get<SupplierPayment[]>(url);
    }

    async getPayment(id: number): Promise<SupplierPayment> {
        return apiService.get<SupplierPayment>(`${this.baseUrl}/payments/${id}/`);
    }

    async createPayment(payment: Partial<SupplierPayment>): Promise<SupplierPayment> {
        return apiService.post<SupplierPayment>(`${this.baseUrl}/payments/`, payment);
    }

    async updatePayment(id: number, payment: Partial<SupplierPayment>): Promise<SupplierPayment> {
        return apiService.put<SupplierPayment>(`${this.baseUrl}/payments/${id}/`, payment);
    }

    async deletePayment(id: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/payments/${id}/`);
    }
}

export const supplierService = new SupplierService();
