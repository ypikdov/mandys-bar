/**
 * UsersTab — Feature Component
 *
 * Vista de la pestaña de clientes registrados (solo lectura).
 * Usa useUsers para obtener datos de clientes.
 */

import { DataTableShell } from '@mandys/ui';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthContext';
import { useUsers } from '@/modules/users/hooks/useUsers';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const ClientCreateModal = React.lazy(() =>
  import('./ClientCreateModal').then((module) => ({ default: module.ClientCreateModal })),
);

const ITEMS_PER_PAGE = 10;

interface UsersTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const { clients, isLoading, pagination, fetchClients, createClient } = useUsers();
  const isAdmin = user?.role === 'ADMIN';

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    fetchClients({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      q: debouncedSearchQuery,
    });
  }, [currentPage, debouncedSearchQuery, fetchClients]);

  const currentUsers = clients;
  const userTotalPages = pagination.totalPages;

  const columns = [
    {
      header: 'Cliente',
      cell: (u: any) => <span className="font-semibold text-black">{u.nombre}</span>,
    },
    {
      header: 'Contacto',
      cell: (u: any) => (
        <span className="text-zinc-600">
          {u.correo} <br /> <span className="text-xs text-zinc-400">{u.telefono}</span>
        </span>
      ),
    },
    {
      header: 'Fecha de Registro',
      cell: (u: any) => <span className="text-zinc-600">{format(new Date(u.created_at), 'dd/MM/yyyy')}</span>,
    },
  ];

  return (
    <>
      <DataTableShell
        title="Clientes Registrados"
        headerActions={isAdmin ? (
          <button onClick={() => setShowNewClientModal(true)} className="rounded-lg bg-black px-4 py-2 font-bold text-white transition hover:bg-zinc-800">
            Nuevo Cliente
          </button>
        ) : undefined}
        searchPlaceholder="Buscar cliente o correo..."
        searchValue={searchQuery}
        onSearchChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
        onRefresh={() => fetchClients({ page: currentPage, limit: ITEMS_PER_PAGE, q: debouncedSearchQuery })}
        isLoading={isLoading}
        data={currentUsers}
        keyExtractor={(u) => u.id}
        columns={columns}
        emptyMessage="No se encontraron clientes."
        currentPage={currentPage}
        totalPages={userTotalPages}
        onPageChange={setCurrentPage}
      />

      {showNewClientModal && (
        <React.Suspense fallback={null}>
          <ClientCreateModal
            onCreateClient={createClient}
            onClose={() => setShowNewClientModal(false)}
            onSuccess={onSuccess}
            onError={onError}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default UsersTab;
