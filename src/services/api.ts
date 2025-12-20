import { config } from '../config/config';

/**
 * Base API service for making HTTP requests to the backend
 */
class ApiService {
    private baseUrl: string;
    private isRefreshing: boolean = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor() {
        this.baseUrl = config.apiBaseUrl;
    }

    /**
     * Get authorization header with access token if available
     */
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Subscribe to token refresh completion
     */
    private subscribeTokenRefresh(callback: (token: string) => void): void {
        this.refreshSubscribers.push(callback);
    }

    /**
     * Notify all subscribers that token has been refreshed
     */
    private onTokenRefreshed(token: string): void {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Attempt to refresh the access token
     */
    private async refreshAccessToken(): Promise<string | null> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access);

            // If a new refresh token is provided, update it too
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }

            return data.access;
        } catch (error) {
            // Refresh failed - clear tokens and redirect to login
            this.handleAuthFailure();
            return null;
        }
    }

    /**
     * Handle authentication failure - clear tokens and redirect to login
     */
    private handleAuthFailure(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }

    /**
     * Execute a fetch request with automatic token refresh on 401
     */
    private async fetchWithTokenRefresh(
        url: string,
        options: RequestInit
    ): Promise<Response> {
        let response = await fetch(url, options);

        // If 401 Unauthorized, try to refresh token and retry
        if (response.status === 401) {
            if (!this.isRefreshing) {
                this.isRefreshing = true;
                const newToken = await this.refreshAccessToken();
                this.isRefreshing = false;

                if (newToken) {
                    this.onTokenRefreshed(newToken);

                    // Retry the original request with new token
                    const newHeaders = { ...options.headers } as Record<string, string>;
                    newHeaders['Authorization'] = `Bearer ${newToken}`;
                    options.headers = newHeaders;

                    response = await fetch(url, options);
                }
            } else {
                // Wait for the ongoing refresh to complete
                const newToken = await new Promise<string>((resolve) => {
                    this.subscribeTokenRefresh(resolve);
                });

                // Retry with the new token
                const newHeaders = { ...options.headers } as Record<string, string>;
                newHeaders['Authorization'] = `Bearer ${newToken}`;
                options.headers = newHeaders;

                response = await fetch(url, options);
            }
        }

        return response;
    }

    /**
     * Make a GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Make a POST request
     */
    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            // Try to parse error message from response
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                // Handle different error response formats
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'object') {
                    // Handle field-specific errors (e.g., {"email": ["This field is required"]})
                    const firstError = Object.values(errorData)[0];
                    if (Array.isArray(firstError) && firstError.length > 0) {
                        errorMessage = firstError[0] as string;
                    }
                }
            } catch {
                // If parsing fails, use default error message
            }
            throw new Error(errorMessage);
        }

        // Handle 205 Reset Content (logout response)
        if (response.status === 205) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Make a PUT request
     */
    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Make a PATCH request
     */
    async patch<T>(endpoint: string, data?: unknown): Promise<T> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // DELETE might return empty response
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);
    }

    /**
     * Upload file(s) using FormData
     */
    async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Don't set Content-Type for FormData - browser will set it with boundary

        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get response as a Blob (for file downloads)
     */
    async getBlob(endpoint: string): Promise<Blob> {
        const response = await this.fetchWithTokenRefresh(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.blob();
    }
}

export const apiService = new ApiService();
