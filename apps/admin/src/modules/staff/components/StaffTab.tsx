import { DataTableShell } from '@mandys/ui';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { useStaff } from '@/modules/staff/hooks/useStaff';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const StaffCreateModal = React.lazy(() =>
  import('./StaffCreateModal').then((module) => ({ default: module.StaffCreateModal })),
);

interface StaffTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const StaffTab: React.FC<StaffTabProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const {
    staff,
    isLoading,
    pagination,
    fetchStaff,
    createStaffMember,
    changeUserRole,
  } = useStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    fetchStaff({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      q: debouncedSearchQuery,
    });
  }, [currentPage, debouncedSearchQuery, fetchStaff]);

  const currentStaff = staff;
  const staffTotalPages = pagination.totalPages;

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await changeUserRole(userId, newRole);
      alert('Rol actualizado correctamente.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const columns = [
    { header: 'Usuario', cell: (u: any) => <span className="font-semibold text-black">{u.nombre}</span> },
    { header: 'Contacto', cell: (u: any) => (
        <span className="text-zinc-600">
          {u.correo} <br /> <span className="text-xs text-zinc-400">{u.telefono}</span>
        </span>
      ) },
    { header: 'Puesto', cell: (u: any) => <span className="font-medium text-zinc-800">{u.puesto || 'No asignado'}</span> },
    { header: 'Rol de Acceso', cell: (u: any) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
          ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'MANAGER' ? 'bg-yellow-100 text-yellow-700' : u.role === 'VENTAS' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>
          {u.role}
        </span>
      ) },
    { header: 'Acciones', cell: (u: any) => (
        <div className="flex items-center">
          {isAdmin && user?.id !== u.id ? (
            <select className="rounded-lg border-none bg-zinc-100 px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-primary"
              value={u.role} onChange={(event) => handleRoleChange(u.id, event.target.value)} aria-label="Cambiar rol de usuario" title="Cambiar rol">
              <option value="VENTAS">VENTAS</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          ) : <span className="text-xs text-zinc-400">{user?.id === u.id ? 'Tu cuenta' : 'Solo ADMIN'}</span>}
        </div>
      ) },
  ];

  const headerActions = isAdmin ? (
    <button onClick={() => setShowNewWorkerModal(true)} className="rounded-lg bg-black px-4 py-2 font-bold text-white transition hover:bg-zinc-800">
      Nuevo Trabajador
    </button>
  ) : undefined;

  return (
    <>
      <DataTableShell
        title="Personal del Negocio"
        headerActions={headerActions}
        searchPlaceholder="Buscar trabajador o correo..."
        searchValue={searchQuery}
        onSearchChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
        onRefresh={() => fetchStaff({ page: currentPage, limit: ITEMS_PER_PAGE, q: debouncedSearchQuery })}
        isLoading={isLoading}
        data={currentStaff}
        keyExtractor={(s) => s.id}
        columns={columns}
        emptyMessage="No se encontro personal registrado."
        currentPage={currentPage}
        totalPages={staffTotalPages}
        onPageChange={setCurrentPage}
      />

      {showNewWorkerModal && (
        <React.Suspense fallback={null}>
          <StaffCreateModal
            onCreateWorker={createStaffMember}
            onClose={() => setShowNewWorkerModal(false)}
            onSuccess={onSuccess}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default StaffTab;
