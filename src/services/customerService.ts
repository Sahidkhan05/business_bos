import { apiService } from './api';

export interface Customer {
  customer_id: number;
  name: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  type?: string;
  spending_balance?: number;
  created_at?: string;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  type?: string;
}

export const customerService = {
  getCustomers: async () => {
    return apiService.get<Customer[]>('/api/sales/customers/');
  },

  getCustomer: async (id: number) => {
    return apiService.get<Customer>(`/api/sales/customers/${id}/`);
  },

  createCustomer: async (data: CreateCustomerData) => {
    return apiService.post<Customer>('/api/sales/customers/', data);
  },

  updateCustomer: async (id: number, data: Partial<CreateCustomerData>) => {
    return apiService.patch<Customer>(`/api/sales/customers/${id}/`, data);
  },

  deleteCustomer: async (id: number) => {
    return apiService.delete<{ success: boolean }>(`/api/sales/customers/${id}/`);
  },
};
