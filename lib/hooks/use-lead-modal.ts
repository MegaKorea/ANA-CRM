import { useCallback, useState } from 'react';
import type { Lead } from '@/lib/services/lead.service';

export function useLeadModal() {
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);

  const openModal = useCallback((nextLead: Lead) => {
    setLead(nextLead);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setLead(null);
  }, []);

  return { open, lead, openModal, closeModal };
}
