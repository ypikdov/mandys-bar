import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PublicSiteContent } from '@mandys/shared';
import {
  getCachedPublicSiteContentSnapshot,
  getPublicSiteContent,
} from '@/modules/site-content/services/siteContentService';
import { useSiteContentRealtime } from '@/modules/site-content/hooks/useSiteContentRealtime';

interface SiteContentContextValue {
  content: PublicSiteContent | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<PublicSiteContent | null>(() => getCachedPublicSiteContentSnapshot());
  const [isLoading, setIsLoading] = useState(() => !getCachedPublicSiteContentSnapshot());
  const hasRevalidatedOnMount = useRef(false);

  const refresh = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const nextContent = await getPublicSiteContent({ force });
      setContent(nextContent);
    } catch (error) {
      console.error('Error fetching public site content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasRevalidatedOnMount.current) {
      return;
    }

    hasRevalidatedOnMount.current = true;
    void refresh(Boolean(content));
  }, [content, refresh]);

  useSiteContentRealtime({
    onContentChange: () => {
      void refresh(true);
    },
  });

  useEffect(() => {
    let lastRefreshAt = 0;

    const refreshIfStale = () => {
      const now = Date.now();
      if (now - lastRefreshAt < 10_000) {
        return;
      }
      lastRefreshAt = now;
      void refresh(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshIfStale();
      }
    };

    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  const value = useMemo(() => ({ content, isLoading, refresh }), [content, isLoading, refresh]);

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
};
