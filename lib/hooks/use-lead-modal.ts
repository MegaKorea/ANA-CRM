import { useCallback, useState } from 'react';
import type { Lead } from '@/lib/services/lead.service';

/**
 * Open/close state for a single lead-scoped modal (detail, notes, images,
 * attendance, appointment, conversation, payment...). The lead page wires up
 * one instance per modal instead of a hand-rolled `isXOpen`/`xLead` pair.
 */
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
