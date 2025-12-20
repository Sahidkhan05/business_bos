import { apiService } from './api';

// Type definitions
export interface Category {
    category_id: number;
    name: string;
    description?: string;
    status: string;
    created_at: string;
}

export interface Product {
    product_id?: number;
    name: string;
    sku: string;
    brand?: string;
    size?: string;
    description?: string;
    unit: string;
    category: number; // category_id
    purchase_price: number | string;
    selling_price: number | string;
    mrp?: number | string;
    current_stock?: number;
    low_stock_alert?: number | string;
    hsn_code?: string;
    gst_percent: number | string;
    status: string;
    created_at?: string;
}

export interface ProductImage {
    image_id: number;
    product: number;
    image: string;
    uploaded_at: string;
}

export interface StockMovement {
    movement_id: number;
    product: number;
    type: 'IN' | 'OUT' | 'SALE' | 'RETURN';
    quantity: number;
    reference_type?: string;
    reason?: string;
    date: string;
}

export interface InventoryFilters {
    search?: string;
    category?: number;
    status?: string;
    stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    min_price?: number;
    max_price?: number;
    ordering?: string;
}

export interface InventoryStats {
    total_products: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_stock_movements: number;
}

export interface ImportResult {
    message: string;
    success_count: number;
    error_count: number;
    errors: string[];
}

/**
 * Product Service - handles all product-related API calls
 */
class ProductService {
    private readonly baseUrl = '/api/inventory';

    /**
     * Get all products
     */
    async getProducts(): Promise<Product[]> {
        return apiService.get<Product[]>(`${this.baseUrl}/products/`);
    }

    /**
     * Get a single product by ID
     */
    async getProduct(id: number): Promise<Product> {
        return apiService.get<Product>(`${this.baseUrl}/products/${id}/`);
    }

    /**
     * Create a new product
     */
    async createProduct(product: Product): Promise<Product> {
        return apiService.post<Product>(`${this.baseUrl}/products/`, product);
    }

    /**
     * Update an existing product
     */
    async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
        return apiService.put<Product>(`${this.baseUrl}/products/${id}/`, product);
    }

    /**
     * Partially update a product
     */
    async patchProduct(id: number, product: Partial<Product>): Promise<Product> {
        return apiService.patch<Product>(`${this.baseUrl}/products/${id}/`, product);
    }

    /**
     * Delete a product
     */
    async deleteProduct(id: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/products/${id}/`);
    }

    /**
     * Get all categories
     */
    async getCategories(): Promise<Category[]> {
        return apiService.get<Category[]>(`${this.baseUrl}/categories/`);
    }

    /**
     * Create a new category
     */
    async createCategory(category: { name: string; description?: string }): Promise<Category> {
        return apiService.post<Category>(`${this.baseUrl}/categories/`, category);
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/categories/${categoryId}/`);
    }

    /**
     * Upload product image
     */
    async uploadProductImage(productId: number, imageFile: File): Promise<ProductImage> {
        const formData = new FormData();
        formData.append('product', productId.toString());
        formData.append('image', imageFile);

        return apiService.postFormData<ProductImage>(`${this.baseUrl}/product-images/`, formData);
    }


    /**
     * Get product images
     */
    async getProductImages(productId: number): Promise<ProductImage[]> {
        return apiService.get<ProductImage[]>(`${this.baseUrl}/products/${productId}/images/`);
    }

    /**
     * Delete a product image
     */
    async deleteProductImage(imageId: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/product-images/${imageId}/`);
    }
    /**
     * Add stock to a product
     */
    async addStock(productId: number, quantity: number, reason?: string): Promise<{ message: string; new_stock: number }> {
        return apiService.post<{ message: string; new_stock: number }>(
            `${this.baseUrl}/products/${productId}/add-stock/`,
            { quantity, reason }
        );
    }

    /**
     * Remove stock from a product
     */
    async removeStock(productId: number, quantity: number, reason?: string): Promise<{ message: string; new_stock: number }> {
        return apiService.post<{ message: string; new_stock: number }>(
            `${this.baseUrl}/products/${productId}/remove-stock/`,
            { quantity, reason }
        );
    }

    /**
     * Get stock movements for a product or all products
     */
    async getStockMovements(productId?: number, filters?: { type?: string }): Promise<StockMovement[]> {
        let url = `${this.baseUrl}/stock-movements/`;
        const params = new URLSearchParams();

        if (productId) {
            params.append('product', productId.toString());
        }
        if (filters?.type) {
            params.append('type', filters.type);
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return apiService.get<StockMovement[]>(url);
    }

    /**
     * Get stock history for a specific product
     */
    async getProductStockHistory(productId: number): Promise<StockMovement[]> {
        return apiService.get<StockMovement[]>(`${this.baseUrl}/products/${productId}/stock-history/`);
    }

    /**
     * Get products with advanced filters
     */
    async getProductsWithFilters(filters: InventoryFilters): Promise<Product[]> {
        const params = new URLSearchParams();

        if (filters.search) {
            params.append('search', filters.search);
        }
        if (filters.category) {
            params.append('category', filters.category.toString());
        }
        if (filters.status) {
            params.append('status', filters.status);
        }
        if (filters.ordering) {
            params.append('ordering', filters.ordering);
        }

        const queryString = params.toString();
        const url = queryString ? `${this.baseUrl}/products/?${queryString}` : `${this.baseUrl}/products/`;

        return apiService.get<Product[]>(url);
    }

    /**
     * Calculate inventory statistics from products
     */
    calculateInventoryStats(products: Product[]): InventoryStats {
        const stats: InventoryStats = {
            total_products: products.length,
            total_value: 0,
            low_stock_count: 0,
            out_of_stock_count: 0,
            total_stock_movements: 0
        };

        products.forEach(product => {
            const currentStock = product.current_stock || 0;
            const sellingPrice = Number(product.selling_price) || 0;
            const lowStockThreshold = Number(product.low_stock_alert) || 0;

            // Calculate total inventory value
            stats.total_value += currentStock * sellingPrice;

            // Count stock status
            if (currentStock === 0) {
                stats.out_of_stock_count++;
            } else if (currentStock <= lowStockThreshold && currentStock > 0) {
                stats.low_stock_count++;
            }
        });

        return stats;
    }

    /**
     * Export products as CSV - triggers file download
     */
    async exportProductsCSV(): Promise<void> {
        const response = await apiService.getBlob(`${this.baseUrl}/products/export-csv/`);

        // Create a download link and click it
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'products_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Import products from CSV file
     */
    async importProductsCSV(file: File): Promise<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        return apiService.postFormData<ImportResult>(`${this.baseUrl}/products/import-csv/`, formData);
    }
}

export const productService = new ProductService();
