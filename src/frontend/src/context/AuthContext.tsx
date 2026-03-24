import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

export interface AuthUser {
  username: string;
  fullName: string;
  city: string;
  role:
    | "guest"
    | "user"
    | "buyer"
    | "seller"
    | "bankOfficer"
    | "banker"
    | "admin";
  mobile?: string;
  email?: string;
  bankOfficerStatus?: "pending" | "approved" | "rejected";
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
  intendedPortal: "buyer" | "seller" | "banker" | null;
  showLoginModal: boolean;
  showRoleSelect: boolean;
  openLoginModal: (portal?: "buyer" | "seller" | "banker") => void;
  closeLoginModal: () => void;
  openRoleSelect: () => void;
  closeRoleSelect: () => void;
  setUserRole: (role: "buyer" | "seller" | "banker") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  intendedPortal: null,
  showLoginModal: false,
  showRoleSelect: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  openRoleSelect: () => {},
  closeRoleSelect: () => {},
  setUserRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("valubrix_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [intendedPortal, setIntendedPortal] = useState<
    "buyer" | "seller" | "banker" | null
  >(null);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("valubrix_user", JSON.stringify(userData));
    // Also save to user DB keyed by mobile/email
    const key = userData.mobile || userData.email || userData.username;
    if (key) {
      try {
        const db = JSON.parse(localStorage.getItem("valubrix_user_db") || "{}");
        db[key] = userData;
        localStorage.setItem("valubrix_user_db", JSON.stringify(db));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("valubrix_user");
  }, []);

  const openLoginModal = useCallback(
    (portal?: "buyer" | "seller" | "banker") => {
      setIntendedPortal(portal ?? null);
      setShowLoginModal(true);
    },
    [],
  );

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const openRoleSelect = useCallback(() => {
    setShowRoleSelect(true);
  }, []);

  const closeRoleSelect = useCallback(() => {
    setShowRoleSelect(false);
    setIntendedPortal(null);
  }, []);

  const setUserRole = useCallback((role: "buyer" | "seller" | "banker") => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        role,
        ...(role === "banker" ? { bankOfficerStatus: "pending" } : {}),
      };
      localStorage.setItem("valubrix_user", JSON.stringify(updated));
      // Update user DB
      const key = updated.mobile || updated.email || updated.username;
      if (key) {
        try {
          const db = JSON.parse(
            localStorage.getItem("valubrix_user_db") || "{}",
          );
          db[key] = updated;
          localStorage.setItem("valubrix_user_db", JSON.stringify(db));
        } catch {
          /* ignore */
        }
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        intendedPortal,
        showLoginModal,
        showRoleSelect,
        openLoginModal,
        closeLoginModal,
        openRoleSelect,
        closeRoleSelect,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
