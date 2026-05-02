import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import type { UserRole } from '@mandys/shared';

type StaffRole = Exclude<UserRole, 'USER'>;

interface NewWorkerFormState {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  role: StaffRole;
  puesto: string;
}

interface StaffCreateModalProps {
  onCreateWorker: (data: NewWorkerFormState) => Promise<void>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const INITIAL_FORM: NewWorkerFormState = {
  nombre: '',
  correo: '',
  telefono: '',
  password: '',
  role: 'VENTAS',
  puesto: 'Mesero',
};

export const StaffCreateModal: React.FC<StaffCreateModalProps> = React.memo(({
  onCreateWorker,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<NewWorkerFormState>({ ...INITIAL_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateWorker(form);
      onSuccess('Trabajador registrado y listo para operar.');
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(event) => event.stopPropagation()}>
        <div className="bg-black px-6 py-4 text-white">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5" /> Registrar Personal</h3>
          <p className="mt-1 text-sm text-zinc-400">Crea una cuenta para un trabajador nuevo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-bold text-black">Nombre completo *</label>
            <input type="text" aria-label="Nombre completo" placeholder="Nombre completo" required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })}
              className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-black">Correo electronico *</label>
              <input type="email" aria-label="Correo electronico" placeholder="Correo electronico" required value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })}
                className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-black">Telefono *</label>
              <input type="tel" aria-label="Telefono" placeholder="Telefono" required minLength={8} value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })}
                className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-black">Contrasena temporal *</label>
            <input
              type="password"
              required
              minLength={8}
              pattern="(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
              title="Debe tener al menos 8 caracteres, una mayuscula, un numero y un simbolo."
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary"
              placeholder="Temporal#2026"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-black">Puesto en el local *</label>
              <select aria-label="Puesto en el local" value={form.puesto} onChange={(event) => setForm({ ...form, puesto: event.target.value })}
                className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary">
                <option value="Administrador">Administrador</option>
                <option value="Capitan de Salon">Capitan de Salon</option>
                <option value="Mesero">Mesero</option>
                <option value="Cajero">Cajero</option>
                <option value="Bartender">Bartender</option>
                <option value="Cocinero">Cocinero</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-black">Rol en sistema *</label>
              <select aria-label="Rol en sistema" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}
                className="w-full rounded-lg border-zinc-200 bg-zinc-50 p-3 text-sm focus:ring-2 focus:ring-primary">
                <option value="VENTAS">VENTAS (Operativo)</option>
                <option value="MANAGER">MANAGER (Gerencial)</option>
                <option value="ADMIN">ADMIN (Acceso total)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 font-bold text-zinc-600 transition hover:bg-zinc-100">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 font-black text-white shadow-lg shadow-black/20 transition hover:bg-zinc-800 disabled:opacity-50">
              {isSubmitting ? 'Registrando...' : 'Crear trabajador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

StaffCreateModal.displayName = 'StaffCreateModal';
