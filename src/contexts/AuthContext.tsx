import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { Customer, Business } from '../types';
import { getProfile } from '../api/customer';
import { getBusiness } from '../api/business';
import { logout as apiLogout } from '../api/auth';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  token: string | null;
  customer: Customer | null;
  business: Business | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, customer: Customer) => Promise<void>;
  logout: () => Promise<void>;
  updateCustomer: (customer: Customer) => void;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  token: null,
  customer: null,
  business: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateCustomer: () => {},
  refreshBusiness: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusiness = useCallback(async () => {
    try {
      const { data } = await getBusiness();
      setBusiness(data.data ?? data);
    } catch {
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          const { data } = await getProfile();
          setCustomer(data.data ?? data);
        }
        await fetchBusiness();
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [fetchBusiness]);

  const login = useCallback(
    async (newToken: string, newCustomer: Customer) => {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      setCustomer(newCustomer);
      await fetchBusiness();
    },
    [fetchBusiness]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  }, []);

  const updateCustomer = useCallback((updated: Customer) => {
    setCustomer(updated);
  }, []);

  const refreshBusiness = useCallback(async () => {
    await fetchBusiness();
  }, [fetchBusiness]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      customer,
      business,
      isLoading,
      isAuthenticated: !!token && !!customer,
      login,
      logout,
      updateCustomer,
      refreshBusiness,
    }),
    [token, customer, business, isLoading, login, logout, updateCustomer, refreshBusiness]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
