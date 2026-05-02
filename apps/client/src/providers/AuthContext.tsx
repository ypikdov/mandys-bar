import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  role: string;
  foto_perfil?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mandys_auth_token');
    localStorage.removeItem('mandys_auth_user');
  };

  // Utilidad para detectar token expirado sin verificar firma.
  // Solo lectura del campo `exp` del payload JWT (base64).
  // Esto es un resguardo de UX, no reemplaza la validación del backend.
  const isTokenExpired = (jwtToken: string): boolean => {
    try {
      const payloadBase64 = jwtToken.split('.')[1];
      if (!payloadBase64) return true;
      const payload = JSON.parse(atob(payloadBase64));
      if (!payload.exp) return true;
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Si no se puede decodificar, se trata como expirado
    }
  };

  useEffect(() => {
    // Check for saved token and user on mount
    const savedToken = localStorage.getItem('mandys_auth_token');
    const savedUser = localStorage.getItem('mandys_auth_user');
    
    if (savedToken && savedUser) {
      try {
        // Prevenir "sesiones zombie": si el token ya expiró, hacer logout limpio
        if (isTokenExpired(savedToken)) {
          console.warn('Token expirado detectado al restaurar sesión. Ejecutando logout limpio.');
          logout();
          return;
        }
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        console.error('No se pudo interpretar el usuario autenticado');
        logout();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mandys_auth_token', newToken);
    localStorage.setItem('mandys_auth_user', JSON.stringify(newUser));
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('mandys_auth_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, updateUser }}>
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
