import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/user';
import { mockUsers } from '../mocks/data';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    switchRole: (role: UserRole) => void; // For demo/dev only
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(mockUsers[0]); // Default to SEO Analyst for demo

    const login = async (email: string, _password: string) => {
        // Mock login - find user by email
        const foundUser = mockUsers.find(u => u.email === email);
        if (foundUser) {
            setUser(foundUser);
        } else {
            throw new Error('Invalid credentials');
        }
    };

    const logout = () => {
        setUser(null);
    };

    const switchRole = (role: UserRole) => {
        const foundUser = mockUsers.find(u => u.role === role);
        if (foundUser) {
            setUser(foundUser);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
                switchRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
