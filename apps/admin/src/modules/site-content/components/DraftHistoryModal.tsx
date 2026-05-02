import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@mandys/ui';
import { useAuth } from '@/providers/AuthContext';
import { getPendingDrafts, publishDraft, discardDraft } from '../services/siteContentService';

interface DraftHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function DraftHistoryModal({ isOpen, onClose, onPublished, onSuccess, onError }: DraftHistoryModalProps) {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      loadDrafts();
    }
  }, [isOpen, token]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await getPendingDrafts(token!);
      setDrafts(data);
    } catch (error: any) {
      onError(error.message || 'Error cargando borradores');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setLoading(true);
      await publishDraft(id, token!);
      onSuccess('Cambios publicados exitosamente');
      onPublished();
      loadDrafts();
      onClose();
    } catch (error: any) {
      onError(error.message || 'Error al publicar borrador');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (id: string) => {
    if (!confirm('¿Estás seguro de descartar este borrador?')) return;
    try {
      setLoading(true);
      await discardDraft(id, token!);
      onSuccess('Borrador descartado');
      loadDrafts();
    } catch (error: any) {
      onError(error.message || 'Error al descartar borrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white border-none shadow-[0_24px_70px_rgba(15,23,42,0.16)] rounded-[32px] p-0 overflow-hidden flex flex-col h-[min(860px,calc(100vh-2rem))]">
        <div className="border-b border-zinc-100 px-6 py-5">
          <DialogHeader className="mx-auto max-w-3xl space-y-2 text-center">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              Historial de Cambios Pendientes
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 bg-zinc-50/30">
          {loading && drafts.length === 0 ? (
            <div className="text-center py-12 font-medium text-zinc-500 uppercase tracking-widest text-sm">Cargando borradores...</div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12 font-medium text-zinc-500 uppercase tracking-widest text-sm">
              <span className="text-3xl block mb-4">✨</span>
              No hay cambios pendientes por revisar
            </div>
          ) : (
            <div className="space-y-6">
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-800">Cambiado por: {draft.author}</h3>
                    <p className="mt-2 text-sm font-medium text-zinc-500 flex items-center gap-2">
                      <span>{new Date(draft.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                      className="inline-flex min-w-[156px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleDiscard(draft.id)} 
                      disabled={loading}
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={() => handlePublish(draft.id)} 
                      disabled={loading} 
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Aprobar y Publicar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
