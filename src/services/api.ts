import { config } from '../config/config';

/**
 * Base API service for making HTTP requests to the backend
 */
class ApiService {
    private baseUrl: string;

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
     * Make a GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
}

export const apiService = new ApiService();
