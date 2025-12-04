import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedEmail = localStorage.getItem("pennEmail");
    if (storedEmail) {
      setUser({ email: storedEmail });
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    localStorage.setItem("pennEmail", email);
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem("pennEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
