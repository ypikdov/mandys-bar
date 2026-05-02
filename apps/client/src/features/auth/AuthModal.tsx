import { Dialog, DialogContent, DialogTitle } from '@mandys/ui';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/providers/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
}

export type AuthMode = 'login';

export const AuthModal = ({ isOpen, onOpenChange }: AuthModalProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const close = () => onOpenChange(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-[95vw] flex-col overflow-hidden rounded-3xl border-none bg-[#111] p-0 md:h-[80vh] md:max-w-5xl md:flex-row">
        <DialogTitle className="sr-only">Autenticacion</DialogTitle>
        <div className="relative flex w-full flex-1 flex-col overflow-y-auto bg-black px-6 py-10 md:w-1/2 md:px-12 md:py-12">
          <button
            onClick={close}
            className="absolute right-4 top-4 z-50 p-2 text-zinc-400 transition-colors hover:text-white md:hidden"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            {isAuthenticated ? (
              <div className="animate-in text-center fade-in slide-in-from-bottom-4 duration-500 md:text-left">
                <h2 className="mb-2 text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">Tu cuenta</h2>
                <div className="mb-8 mt-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-black text-white">
                      {user?.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{user?.nombre}</p>
                      <p className="text-sm text-zinc-500">{user?.correo}</p>
                      <span className="mt-2 inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase text-primary">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => { close(); navigate('/perfil'); }} className="w-full rounded-xl bg-zinc-800 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-zinc-700">
                      Mis pedidos
                    </button>
                    <button onClick={() => { close(); navigate('/perfil'); }} className="w-full rounded-xl bg-zinc-800 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-zinc-700">
                      Ver mi perfil
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); close(); }}
                  className="w-full rounded-xl border border-red-500/30 py-4 text-sm font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                >
                  Cerrar sesion
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center md:text-left">
                  <h2 className="mb-2 text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">
                    Bienvenido de vuelta
                  </h2>
                  <p className="text-sm font-medium text-zinc-400 md:text-base">
                    Ingresa tus credenciales para acceder a tu cuenta. Si aun no tienes credenciales, solicita tu registro al personal.
                  </p>
                  <div className="flex justify-center gap-2 pt-4 md:justify-start">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-4 w-1.5 -skew-x-[30deg] bg-primary" />
                    ))}
                  </div>
                </div>

                <LoginForm onClose={close} />
              </>
            )}
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#0a0a0a] p-8 md:flex">
          <div className="relative z-10 aspect-[4/5] w-full max-w-sm">
            <div className="absolute -inset-4 border-[4px] border-primary shadow-[0_0_30px_rgba(249,115,22,0.15)]" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-8 backdrop-blur-sm">
              <img
                src="/images/logo mandys.jpg"
                alt="Mandy's Bar Logo"
                className="w-full max-w-[250px] rounded-full border-4 border-primary/20 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <button
            onClick={close}
            className="absolute right-6 top-6 z-50 rounded-full border border-white/10 bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-primary"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
