import ContentManager from './ContentManager';

interface SiteContentTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const SiteContentTab = ({ onSuccess, onError }: SiteContentTabProps) => (
  <ContentManager onSuccess={onSuccess} onError={onError} />
);

export default SiteContentTab;
