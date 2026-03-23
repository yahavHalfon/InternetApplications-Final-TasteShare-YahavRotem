import React, { useState, useCallback, useRef, useEffect } from "react";
import { AuthContext } from "./useAuth";
import { authService } from "../services/authService";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken"),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem("refreshToken"),
  );
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // Sync React state when localStorage changes (from other tabs or axios interceptor)
  useEffect(() => {
    const syncFromStorage = () => {
      const storedAccess = localStorage.getItem("accessToken");
      const storedRefresh = localStorage.getItem("refreshToken");
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
    };

    window.addEventListener("storage", syncFromStorage);

    // Also listen for custom event dispatched from same tab
    window.addEventListener("tokens-updated", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("tokens-updated", syncFromStorage);
    };
  }, []);

  const login = useCallback(
    (newAccessToken: string, newRefreshToken: string) => {
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
    },
    [],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const validateAndRefreshToken = useCallback(async (): Promise<boolean> => {
    // If a refresh is already in progress, return the same promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doValidate = async (): Promise<boolean> => {
      // Read directly from localStorage to avoid stale closure values
      const currentToken = localStorage.getItem("accessToken");
      const currentRefreshToken = localStorage.getItem("refreshToken");

      if (!currentToken) {
        return false;
      }

      if (!isTokenExpired(currentToken)) {
        return true;
      }

      // Access token expired, try to refresh
      if (currentRefreshToken) {
        try {
          const response = await authService.refreshToken(currentRefreshToken);
          login(response.token, response.refreshToken);
          return true;
        } catch {
          logout();
          return false;
        }
      }

      logout();
      return false;
    };

    refreshPromiseRef.current = doValidate().finally(() => {
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, [login, logout]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
        validateAndRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
