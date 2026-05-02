import { apiDelete, apiGet, apiPut } from '@/lib/api';
import type { PublicSiteContent } from '@mandys/shared';

export interface PendingContentDraft {
  id: string;
  created_at: string;
  author: string;
  section: string;
  estado: 'PENDING' | 'PUBLISHED' | 'REJECTED';
}

export async function getAdminSiteContent(token: string): Promise<PublicSiteContent> {
  const response = await apiGet('/api/site-content/admin', token);
  if (!response.ok) {
    throw new Error('Error obteniendo contenido web');
  }
  return response.json();
}

export async function saveAdminSiteContent(payload: PublicSiteContent, token: string): Promise<PublicSiteContent> {
  const response = await apiPut('/api/site-content', payload, token);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error guardando contenido web');
  }
  return data.content as PublicSiteContent;
}

export async function getPendingDrafts(token: string): Promise<PendingContentDraft[]> {
  const response = await apiGet('/api/site-content/drafts', token);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error cargando borradores pendientes');
  }
  return (Array.isArray(data) ? data : data.drafts ?? []) as PendingContentDraft[];
}

export async function publishDraft(id: string, token: string): Promise<PublicSiteContent> {
  const response = await apiPut(`/api/site-content/drafts/${id}/publish`, {}, token);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error publicando borrador');
  }
  return data.content as PublicSiteContent;
}

export async function discardDraft(id: string, token: string): Promise<void> {
  const response = await apiDelete(`/api/site-content/drafts/${id}`, undefined, token);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error descartando borrador');
  }
}
