import { apiService } from './api';

/**
 * Token response from backend
 */
export interface TokenResponse {
    access: string;
    refresh: string;
}

/**
 * Decoded JWT token payload
 */
export interface TokenPayload {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    user_id: number;
    tenant_id?: number;
    role?: string;
}

/**
 * User information extracted from token
 */
export interface UserInfo {
    userId: number;
    tenantId?: number;
    role?: string;
    email: string;
}

/**
 * Authentication service for handling login, logout, and token management
 */
class AuthService {
    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<{ tokens: TokenResponse; user: UserInfo }> {
        const tokens = await apiService.post<TokenResponse>('/api/token/', {
            email,
            password,
        });

        // Decode the access token to extract user information
        const userInfo = this.decodeToken(tokens.access);
        const user: UserInfo = {
            userId: userInfo.user_id,
            tenantId: userInfo.tenant_id,
            role: userInfo.role,
            email,
        };

        // Store tokens in localStorage
        this.storeTokens(tokens);
        this.storeUser(user);

        return { tokens, user };
    }

    /**
     * Logout by blacklisting the refresh token
     */
    async logout(): Promise<void> {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            try {
                await apiService.post('/api/auth/logout/', {
                    refresh: refreshToken,
                });
            } catch (error) {
                console.error('Logout error:', error);
                // Continue with local cleanup even if API call fails
            }
        }

        // Clear tokens and user data from localStorage
        this.clearTokens();
    }

    /**
     * Refresh the access token using the refresh token
     */
    async refreshToken(): Promise<TokenResponse> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const tokens = await apiService.post<TokenResponse>('/api/token/refresh/', {
            refresh: refreshToken,
        });

        // Store new tokens
        this.storeTokens(tokens);

        return tokens;
    }

    /**
     * Store tokens in localStorage
     */
    private storeTokens(tokens: TokenResponse): void {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    }

    /**
     * Store user information in localStorage
     */
    private storeUser(user: UserInfo): void {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Get access token from localStorage
     */
    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    /**
     * Get refresh token from localStorage
     */
    getRefreshToken(): string | null {
        return localStorage.getItem('refresh_token');
    }

    /**
     * Get user information from localStorage
     */
    getUser(): UserInfo | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    /**
     * Clear all tokens and user data from localStorage
     */
    private clearTokens(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    /**
     * Decode JWT token to extract payload
     */
    private decodeToken(token: string): TokenPayload {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            throw new Error('Failed to decode token');
        }
    }

    /**
     * Check if user is authenticated (has valid access token)
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            const payload = this.decodeToken(token);
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch {
            return false;
        }
    }
}

export const authService = new AuthService();
