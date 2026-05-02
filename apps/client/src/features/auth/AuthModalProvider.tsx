import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthMode } from "@/features/auth/AuthModal";

const AuthModal = lazy(() =>
  import("@/features/auth/AuthModal").then((module) => ({ default: module.AuthModal }))
);

interface AuthModalContextValue {
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [shouldRender, setShouldRender] = useState(false);

  const openAuthModal = useCallback((nextMode: AuthMode = "login") => {
    setMode(nextMode);
    setShouldRender(true);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {shouldRender && (
        <Suspense fallback={null}>
          <AuthModal isOpen={isOpen} onOpenChange={setIsOpen} initialMode={mode} />
        </Suspense>
      )}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
};
