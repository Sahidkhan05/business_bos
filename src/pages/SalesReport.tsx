import React, { useEffect, useState, useRef } from 'react';
import { salesService, type SalesAnalytics, type TopCustomer, type TopProduct, type PaymentTypeDistribution, type RevenueByDate, type ProfitLossAnalytics, type ProductProfitData } from '../services/salesService';
import { billService, type Bill } from '../services/billService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SalesReport: React.FC = () => {
    // Ref for PDF export
    const reportRef = useRef<HTMLDivElement>(null);

    // State
    const [loading, setLoading] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [error, setError] = useState('');

    // Analytics data
    const [analytics, setAnalytics] = useState<SalesAnalytics>({
        totalRevenue: 0,
        totalBills: 0,
        averageOrderValue: 0,
        totalCustomers: 0,
    });
    const [profitLoss, setProfitLoss] = useState<ProfitLossAnalytics>({
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        profitMargin: 0,
        totalBills: 0,
    });
    const [productProfits, setProductProfits] = useState<ProductProfitData[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [paymentDistribution, setPaymentDistribution] = useState<PaymentTypeDistribution[]>([]);
    const [revenueByDate, setRevenueByDate] = useState<RevenueByDate[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);

    // Filter states
    const [dateFilter, setDateFilter] = useState('7days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Load data on mount and filter change
    useEffect(() => {
        loadSalesData();
    }, [dateFilter, customStartDate, customEndDate, paymentTypeFilter]);

    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate = '';
        let endDate = new Date().toISOString().split('T')[0];

        switch (dateFilter) {
            case 'today':
                startDate = today.toISOString().split('T')[0];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = yesterday.toISOString().split('T')[0];
                endDate = yesterday.toISOString().split('T')[0];
                break;
            case '7days':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case '30days':
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                startDate = monthAgo.toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = customStartDate;
                endDate = customEndDate;
                break;
            default:
                startDate = '';
                endDate = '';
        }

        return { start_date: startDate, end_date: endDate };
    };

    const loadSalesData = async () => {
        setLoading(true);
        setError('');

        try {
            const dateRange = getDateRange();
            const filters = {
                ...dateRange,
                payment_type: paymentTypeFilter || undefined,
            };

            // Load all data in parallel
            const [analyticsData, profitLossData, productProfitData, topCustomersData, topProductsData, paymentDistData, revenueData, billsData] = await Promise.all([
                salesService.getSalesAnalytics(filters),
                salesService.getProfitLossAnalytics(filters),
                salesService.getProductProfitBreakdown(filters, 10),
                salesService.getTopCustomers(filters, 5),
                salesService.getTopProducts(filters, 5),
                salesService.getPaymentTypeDistribution(filters),
                salesService.getRevenueByDate(filters),
                billService.getBills(filters),
            ]);

            setAnalytics(analyticsData);
            setProfitLoss(profitLossData);
            setProductProfits(productProfitData);
            setTopCustomers(topCustomersData);
            setTopProducts(topProductsData);
            setPaymentDistribution(paymentDistData);
            setRevenueByDate(revenueData);
            setBills(billsData);
        } catch (err: any) {
            console.error('Failed to load sales data:', err);
            setError(err.message || 'Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const dateRange = getDateRange();
        const filename = `sales_report_${dateRange.start_date || 'all'}_to_${dateRange.end_date || 'today'}.csv`;
        salesService.exportToCSV(filteredBills, filename);
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setExportingPDF(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f9fafb',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;

            // Handle multi-page if content is too tall
            const pageHeight = pdfHeight * (imgWidth / pdfWidth);
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
                heightLeft -= pageHeight;
            }

            const dateRange = getDateRange();
            pdf.save(`profit_loss_report_${dateRange.start_date || 'all'}_to_${dateRange.end_date || 'today'}.pdf`);
        } catch (err) {
            console.error('Failed to export PDF:', err);
            setError('Failed to export PDF. Please try again.');
        } finally {
            setExportingPDF(false);
        }
    };

    const clearFilters = () => {
        setDateFilter('7days');
        setCustomStartDate('');
        setCustomEndDate('');
        setPaymentTypeFilter('');
        setSearchQuery('');
    };

    // Filter bills by search query
    const filteredBills = bills.filter(bill => {
        if (!searchQuery) return true;
        return (
            bill.bill_id.toString().includes(searchQuery) ||
            bill.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Pagination
    const indexOfLastBill = currentPage * itemsPerPage;
    const indexOfFirstBill = indexOfLastBill - itemsPerPage;
    const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

    // Format currency
    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Payment type badge
    const getPaymentTypeBadge = (type?: string) => {
        if (!type) return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'N/A' };

        const types: Record<string, { bg: string; text: string }> = {
            Cash: { bg: 'bg-green-100', text: 'text-green-700' },
            UPI: { bg: 'bg-blue-100', text: 'text-blue-700' },
            Card: { bg: 'bg-purple-100', text: 'text-purple-700' },
            Credit: { bg: 'bg-orange-100', text: 'text-orange-700' },
        };

        const style = types[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
        return { ...style, label: type };
    };

    // Get profit/loss status color
    const getProfitStatusColor = (profit: number) => {
        if (profit > 0) return 'text-green-600';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 bg-gray-50 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📊 Sales & Profit Report</h1>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={loadSalesData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        disabled={loading || bills.length === 0}
                    >
                        💾 Export CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        disabled={loading || exportingPDF}
                    >
                        {exportingPDF ? '⏳ Generating...' : '📄 Export PDF'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Quick Date Filter */}
                    <select
                        className="border p-2 rounded w-full"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                        <>
                            <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                placeholder="End Date"
                            />
                        </>
                    )}

                    {/* Payment Type Filter */}
                    <select
                        className="border p-2 rounded w-full"
                        value={paymentTypeFilter}
                        onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    >
                        <option value="">All Payment Types</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Credit">Credit</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="bg-gray-100 border p-2 rounded hover:bg-gray-200"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Report Content - This will be exported to PDF */}
            <div ref={reportRef}>
                {/* Profit/Loss Summary Section */}
                <div className="bg-white p-5 rounded-xl shadow mb-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">💰 Profit & Loss Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Revenue */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                            <p className="text-sm opacity-90 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold">{formatCurrency(profitLoss.totalRevenue)}</p>
                        </div>

                        {/* Total Cost */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                            <p className="text-sm opacity-90 mb-1">Total Cost</p>
                            <p className="text-3xl font-bold">{formatCurrency(profitLoss.totalCost)}</p>
                        </div>

                        {/* Gross Profit */}
                        <div className={`p-6 rounded-xl shadow-lg text-white ${profitLoss.grossProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <p className="text-sm opacity-90 mb-1">Gross Profit</p>
                            <p className="text-3xl font-bold">{formatCurrency(profitLoss.grossProfit)}</p>
                        </div>

                        {/* Profit Margin */}
                        <div className={`p-6 rounded-xl shadow-lg text-white ${profitLoss.profitMargin >= 0 ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <p className="text-sm opacity-90 mb-1">Profit Margin</p>
                            <p className="text-3xl font-bold">{profitLoss.profitMargin.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>

                {/* Product Profit Breakdown */}
                <div className="bg-white p-5 rounded-xl shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">📦 Product Profit Breakdown</h3>
                    {productProfits.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qty Sold</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cost</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Profit</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {productProfits.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{product.product_name}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{product.quantity_sold}</td>
                                            <td className="px-4 py-3 text-right text-blue-600 font-medium">{formatCurrency(product.revenue)}</td>
                                            <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(product.cost)}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${getProfitStatusColor(product.profit)}`}>
                                                {formatCurrency(product.profit)}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${getProfitStatusColor(product.margin)}`}>
                                                {product.margin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No product profit data available</p>
                    )}
                </div>

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-sm opacity-90 mb-1">Total Sales Revenue</p>
                        <p className="text-3xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                    </div>

                    {/* Total Bills */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-sm opacity-90 mb-1">Total Bills</p>
                        <p className="text-3xl font-bold">{analytics.totalBills}</p>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-sm opacity-90 mb-1">Avg Order Value</p>
                        <p className="text-3xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
                    </div>

                    {/* Total Customers */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-sm opacity-90 mb-1">Unique Customers</p>
                        <p className="text-3xl font-bold">{analytics.totalCustomers}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Customers */}
                    <div className="bg-white p-5 rounded-xl shadow">
                        <h3 className="text-lg font-semibold mb-4">🏆 Top Customers</h3>
                        {topCustomers.length > 0 ? (
                            <div className="space-y-3">
                                {topCustomers.map((customer, idx) => (
                                    <div key={customer.customer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{customer.customer_name}</p>
                                                <p className="text-sm text-gray-600">{customer.bills_count} bills</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No customer data available</p>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="bg-white p-5 rounded-xl shadow">
                        <h3 className="text-lg font-semibold mb-4">📦 Top Products</h3>
                        {topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {topProducts.map((product, idx) => (
                                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{product.product_name}</p>
                                                <p className="text-sm text-gray-600">{product.quantity_sold} units sold</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No product data available</p>
                        )}
                    </div>
                </div>

                {/* Payment Distribution */}
                <div className="bg-white p-5 rounded-xl shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">💳 Payment Type Distribution</h3>
                    {paymentDistribution.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {paymentDistribution.map((payment) => {
                                const badge = getPaymentTypeBadge(payment.payment_type);
                                const percentage = analytics.totalRevenue > 0
                                    ? ((payment.total_amount / analytics.totalRevenue) * 100).toFixed(1)
                                    : 0;

                                return (
                                    <div key={payment.payment_type} className="p-4 border rounded-lg">
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${badge.bg} ${badge.text}`}>
                                            {badge.label}
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(payment.total_amount)}</p>
                                        <p className="text-sm text-gray-600">{payment.count} bills ({percentage}%)</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No payment data available</p>
                    )}
                </div>

                {/* Revenue Trend */}
                <div className="bg-white p-5 rounded-xl shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">📈 Revenue Trend</h3>
                    {revenueByDate.length > 0 ? (
                        <div className="overflow-x-auto">
                            <div className="flex gap-2 min-w-max">
                                {revenueByDate.map((data) => {
                                    const maxRevenue = Math.max(...revenueByDate.map(d => d.revenue));
                                    const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 200 : 0;

                                    return (
                                        <div key={data.date} className="flex flex-col items-center gap-2">
                                            <div className="text-xs text-gray-600">{formatCurrency(data.revenue)}</div>
                                            <div
                                                className="w-12 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                                style={{ height: `${height}px` }}
                                            ></div>
                                            <div className="text-xs text-gray-600 transform -rotate-45 origin-top-left mt-2">
                                                {formatDate(data.date)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No revenue trend data available</p>
                    )}
                </div>
            </div>

            {/* Sales Table - Outside PDF export area for better formatting */}
            <div className="bg-white p-5 rounded-xl shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold">📋 Sales Transactions</h3>
                    <input
                        type="text"
                        placeholder="Search bill ID or customer..."
                        className="border p-2 rounded w-full sm:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Loading sales data...</p>
                    </div>
                ) : currentBills.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bill ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {currentBills.map((bill) => {
                                        const badge = getPaymentTypeBadge(bill.payment_type);
                                        return (
                                            <tr key={bill.bill_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">#{bill.bill_id}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(bill.date)}</td>
                                                <td className="px-4 py-3 text-sm">{bill.customer_name || 'Walk-in'}</td>
                                                <td className="px-4 py-3 text-sm">{bill.items.length}</td>
                                                <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(Number(bill.grand_total))}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 bg-white border rounded">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">No sales transactions found.</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesReport;
