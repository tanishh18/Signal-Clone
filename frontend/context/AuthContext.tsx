"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@/types";
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "@/lib/auth";
import {
  getCurrentUser,
  loginWithOtp,
  registerUser,
  logoutUser,
  RegisterPayload,
} from "@/lib/api";
import { signalWs } from "@/lib/websocket";

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, otp: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on initial load
  useEffect(() => {
    let isCancelled = false;
    const initAuth = async () => {
      const savedToken = getStoredToken();
      if (!savedToken) {
        if (!isCancelled) setIsLoading(false);
        return;
      }

      if (!isCancelled) setToken(savedToken);
      try {
        const user = await getCurrentUser(savedToken);
        if (!isCancelled) {
          setCurrentUser(user);
          signalWs.connect(savedToken);
        }
      } catch {
        removeStoredToken();
        if (!isCancelled) {
          setToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, otp: string) => {
    const response = await loginWithOtp(identifier, otp);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setCurrentUser(response.user);
    signalWs.connect(response.access_token);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerUser(payload);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setCurrentUser(response.user);
    signalWs.connect(response.access_token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(token);
    } finally {
      signalWs.disconnect();
      removeStoredToken();
      setToken(null);
      setCurrentUser(null);
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const user = await getCurrentUser(token);
      setCurrentUser(user);
    } catch {
      // ignore refresh error
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
