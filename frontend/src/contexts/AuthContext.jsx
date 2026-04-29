import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
