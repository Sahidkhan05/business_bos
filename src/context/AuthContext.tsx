import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { UserInfo } from '../services/auth';

/**
 * Authentication context type
 */
interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore user session on mount
    useEffect(() => {
        const restoreSession = () => {
            try {
                // Check if user is authenticated
                if (authService.isAuthenticated()) {
                    const storedUser = authService.getUser();
                    if (storedUser) {
                        setUser(storedUser);
                    }
                } else {
                    // Clear invalid tokens
                    authService.logout();
                }
            } catch (error) {
                console.error('Failed to restore session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    /**
     * Login with email and password
     */
    const login = async (email: string, password: string) => {
        const { user: userInfo } = await authService.login(email, password);
        setUser(userInfo);
    };

    /**
     * Logout and clear session
     */
    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
