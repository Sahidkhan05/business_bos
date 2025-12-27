import { apiService } from './api';

export interface BillItem {
    bill_item_id?: number;
    product: number;
    product_name?: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal?: number;
    cost_price?: number;
}

export interface Bill {
    bill_id: number;
    date: string;
    customer?: number;
    customer_name?: string;
    created_by?: number;
    item_total: number;
    bill_discount: number;
    gst_total: number;
    grand_total: number;
    payment_type?: string;
    items: BillItem[];
}

export interface CreateBillData {
    customer_id?: number;
    bill_discount?: number;
    payment_type?: string;
    items: {
        product_id: number;
        quantity: number;
        price?: number;
        discount?: number;
    }[];
}

export interface BillFilters {
    start_date?: string;
    end_date?: string;
    customer?: number;
    payment_type?: string;
    min_amount?: number;
    max_amount?: number;
}

export const billService = {
    getBills: async (filters?: BillFilters) => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        const url = queryString ? `/api/sales/bills/?${queryString}` : '/api/sales/bills/';
        return apiService.get<Bill[]>(url);
    },

    getBill: async (id: number) => {
        return apiService.get<Bill>(`/api/sales/bills/${id}/`);
    },

    createBill: async (data: CreateBillData) => {
        return apiService.post<Bill>('/api/sales/bills/', data);
    },
};
