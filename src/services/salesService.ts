import { billService, type Bill } from './billService';

export interface SalesAnalytics {
    totalRevenue: number;
    totalBills: number;
    averageOrderValue: number;
    totalCustomers: number;
}

export interface TopCustomer {
    customer_id: number;
    customer_name: string;
    total_spent: number;
    bills_count: number;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
}

export interface PaymentTypeDistribution {
    payment_type: string;
    count: number;
    total_amount: number;
}

export interface RevenueByDate {
    date: string;
    revenue: number;
    bills_count: number;
}

export interface SalesReportFilters {
    start_date?: string;
    end_date?: string;
    customer?: number;
    payment_type?: string;
}

export interface ProfitLossAnalytics {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    totalBills: number;
}

export interface ProductProfitData {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

export const salesService = {
    /**
     * Get sales analytics for a given date range
     */
    getSalesAnalytics: async (filters?: SalesReportFilters): Promise<SalesAnalytics> => {
        // Fetch bills with filters
        const bills = await billService.getBills(filters);

        // Calculate analytics
        const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.grand_total), 0);
        const totalBills = bills.length;
        const averageOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;

        // Get unique customers
        const uniqueCustomers = new Set(bills.filter(b => b.customer).map(b => b.customer));
        const totalCustomers = uniqueCustomers.size;

        return {
            totalRevenue,
            totalBills,
            averageOrderValue,
            totalCustomers,
        };
    },

    /**
     * Get top customers by spending
     */
    getTopCustomers: async (filters?: SalesReportFilters, limit: number = 5): Promise<TopCustomer[]> => {
        const bills = await billService.getBills(filters);

        // Group by customer
        const customerMap = new Map<number, { name: string; total: number; count: number }>();

        bills.forEach(bill => {
            if (bill.customer) {
                const existing = customerMap.get(bill.customer) || {
                    name: bill.customer_name || 'Unknown',
                    total: 0,
                    count: 0
                };
                existing.total += Number(bill.grand_total);
                existing.count += 1;
                customerMap.set(bill.customer, existing);
            }
        });

        // Convert to array and sort
        const topCustomers: TopCustomer[] = Array.from(customerMap.entries())
            .map(([customer_id, data]) => ({
                customer_id,
                customer_name: data.name,
                total_spent: data.total,
                bills_count: data.count,
            }))
            .sort((a, b) => b.total_spent - a.total_spent)
            .slice(0, limit);

        return topCustomers;
    },

    /**
     * Get top selling products
     */
    getTopProducts: async (filters?: SalesReportFilters, limit: number = 5): Promise<TopProduct[]> => {
        const bills = await billService.getBills(filters);

        // Group by product
        const productMap = new Map<number, { name: string; quantity: number; revenue: number }>();

        bills.forEach(bill => {
            bill.items.forEach(item => {
                const existing = productMap.get(item.product) || {
                    name: item.product_name || 'Unknown',
                    quantity: 0,
                    revenue: 0
                };
                existing.quantity += item.quantity;
                existing.revenue += Number(item.subtotal || 0);
                productMap.set(item.product, existing);
            });
        });

        // Convert to array and sort by revenue
        const topProducts: TopProduct[] = Array.from(productMap.entries())
            .map(([product_id, data]) => ({
                product_id,
                product_name: data.name,
                quantity_sold: data.quantity,
                revenue: data.revenue,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return topProducts;
    },

    /**
     * Get payment type distribution
     */
    getPaymentTypeDistribution: async (filters?: SalesReportFilters): Promise<PaymentTypeDistribution[]> => {
        const bills = await billService.getBills(filters);

        // Group by payment type
        const paymentMap = new Map<string, { count: number; total: number }>();

        bills.forEach(bill => {
            const type = bill.payment_type || 'Not Specified';
            const existing = paymentMap.get(type) || { count: 0, total: 0 };
            existing.count += 1;
            existing.total += Number(bill.grand_total);
            paymentMap.set(type, existing);
        });

        // Convert to array
        const distribution: PaymentTypeDistribution[] = Array.from(paymentMap.entries())
            .map(([payment_type, data]) => ({
                payment_type,
                count: data.count,
                total_amount: data.total,
            }))
            .sort((a, b) => b.total_amount - a.total_amount);

        return distribution;
    },

    /**
     * Get revenue by date
     */
    getRevenueByDate: async (filters?: SalesReportFilters): Promise<RevenueByDate[]> => {
        const bills = await billService.getBills(filters);

        // Group by date
        const dateMap = new Map<string, { revenue: number; count: number }>();

        bills.forEach(bill => {
            const date = new Date(bill.date).toISOString().split('T')[0];
            const existing = dateMap.get(date) || { revenue: 0, count: 0 };
            existing.revenue += Number(bill.grand_total);
            existing.count += 1;
            dateMap.set(date, existing);
        });

        // Convert to array and sort by date
        const revenueByDate: RevenueByDate[] = Array.from(dateMap.entries())
            .map(([date, data]) => ({
                date,
                revenue: data.revenue,
                bills_count: data.count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return revenueByDate;
    },

    /**
     * Export sales report to CSV
     */
    exportToCSV: (bills: Bill[], filename: string = 'sales_report.csv') => {
        // Create CSV header
        const headers = [
            'Bill ID',
            'Date',
            'Customer',
            'Items Count',
            'Item Total',
            'GST',
            'Discount',
            'Grand Total',
            'Payment Type',
        ];

        // Create CSV rows
        const rows = bills.map(bill => [
            bill.bill_id,
            new Date(bill.date).toLocaleString('en-IN'),
            bill.customer_name || 'Walk-in Customer',
            bill.items.length,
            Number(bill.item_total).toFixed(2),
            Number(bill.gst_total).toFixed(2),
            Number(bill.bill_discount).toFixed(2),
            Number(bill.grand_total).toFixed(2),
            bill.payment_type || 'N/A',
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Get profit/loss analytics
     */
    getProfitLossAnalytics: async (filters?: SalesReportFilters): Promise<ProfitLossAnalytics> => {
        const bills = await billService.getBills(filters);

        let totalRevenue = 0;
        let totalCost = 0;

        bills.forEach(bill => {
            bill.items.forEach(item => {
                const itemRevenue = Number(item.subtotal || 0);
                const itemCost = (Number(item.cost_price) || 0) * item.quantity;
                totalRevenue += itemRevenue;
                totalCost += itemCost;
            });
        });

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalCost,
            grossProfit,
            profitMargin,
            totalBills: bills.length,
        };
    },

    /**
     * Get profit breakdown by product
     */
    getProductProfitBreakdown: async (filters?: SalesReportFilters, limit: number = 10): Promise<ProductProfitData[]> => {
        const bills = await billService.getBills(filters);

        const productMap = new Map<number, {
            name: string;
            quantity: number;
            revenue: number;
            cost: number;
        }>();

        bills.forEach(bill => {
            bill.items.forEach(item => {
                const existing = productMap.get(item.product) || {
                    name: item.product_name || 'Unknown',
                    quantity: 0,
                    revenue: 0,
                    cost: 0
                };
                existing.quantity += item.quantity;
                existing.revenue += Number(item.subtotal || 0);
                existing.cost += (Number(item.cost_price) || 0) * item.quantity;
                productMap.set(item.product, existing);
            });
        });

        const productProfits: ProductProfitData[] = Array.from(productMap.entries())
            .map(([product_id, data]) => {
                const profit = data.revenue - data.cost;
                const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
                return {
                    product_id,
                    product_name: data.name,
                    quantity_sold: data.quantity,
                    revenue: data.revenue,
                    cost: data.cost,
                    profit,
                    margin,
                };
            })
            .sort((a, b) => b.profit - a.profit)
            .slice(0, limit);

        return productProfits;
    },
};
