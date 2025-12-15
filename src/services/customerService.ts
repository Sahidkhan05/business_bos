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
    return apiService.get<Customer[]>('/sales/customers/');
  },
  
  getCustomer: async (id: number) => {
    return apiService.get<Customer>(`/sales/customers/${id}/`);
  },

  createCustomer: async (data: CreateCustomerData) => {
    return apiService.post<Customer>('/sales/customers/', data);
  },

  updateCustomer: async (id: number, data: Partial<CreateCustomerData>) => {
    return apiService.patch<Customer>(`/sales/customers/${id}/`, data);
  },

  deleteCustomer: async (id: number) => {
    return apiService.delete<{ success: boolean }>(`/sales/customers/${id}/`);
  },
};
