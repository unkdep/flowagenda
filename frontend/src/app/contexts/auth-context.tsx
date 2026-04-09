"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "../lib/api";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  clinic_id: number;
  clinic_name: string;
  role: "admin" | "staff" | "professional";
  professional_id: number | null;
  professional_name: string | null;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterClinicPayload = {
  clinic_name: string;
  full_name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  registerClinic: (payload: RegisterClinicPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiFetch<{ user: AuthUser }>("/api/auth/me/", {
        method: "GET",
      });
      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiFetch<{ message: string; user: AuthUser }>(
      "/api/auth/login/",
      {
        method: "POST",
        body: payload,
      }
    );

    setUser(response.user);
    return response.user;
  }, []);

  const registerClinic = useCallback(
    async (payload: RegisterClinicPayload) => {
      const response = await apiFetch<{ message: string; user: AuthUser }>(
        "/api/auth/register-clinic/",
        {
          method: "POST",
          body: payload,
        }
      );

      setUser(response.user);
      return response.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout/", {
      method: "POST",
    });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      registerClinic,
      logout,
      refreshUser,
    }),
    [user, loading, login, registerClinic, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}