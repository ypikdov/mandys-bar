import { loginSchema, type LoginFormValues } from '@mandys/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@mandys/ui';
import { useAuth } from '@/providers/AuthContext';
import { login as loginService } from '@/services/api/authService';

interface LoginFormProps {
  onClose: () => void;
}

export const LoginForm = ({ onClose }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await loginService({ correo: data.email, password: data.password });
      login(result.token, result.user);
      onClose();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full animate-in flex-col gap-6 fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-400">Correo electronico</label>
          <input
            {...register('email')}
            type="email"
            placeholder=""
            className={`w-full rounded-xl border bg-zinc-900 px-4 py-3.5 text-white transition-colors focus:border-primary focus:outline-none ${errors.email ? 'border-red-500' : touchedFields.email ? 'border-green-500/50' : 'border-zinc-800'}`}
          />
          {errors.email && <p className="ml-1 mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-end justify-between">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-400">Contrasena</label>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              className={`w-full rounded-xl border bg-zinc-900 px-4 py-3.5 pr-12 text-white transition-colors focus:border-primary focus:outline-none ${errors.password ? 'border-red-500' : 'border-zinc-800'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {authError && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-500">
            {authError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-6 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Iniciar sesion'}
        </Button>
      </form>
    </div>
  );
};
