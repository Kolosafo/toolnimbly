'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { features } from '@/lib/config/features';
import { documentLimits } from '@/lib/config/limits';
import {
  calculateTotals,
  createLineItem,
  roundTotals,
  type AdjustmentKind,
  type LineItem,
} from '@/lib/documents/model';
import type { CurrencyCode } from '@/lib/formatting/number';
import { moveItem } from '@/lib/files/queue';

export type DocumentDraft = {
  fromName: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  fromTaxId: string;

  toName: string;
  toAddress: string;
  toEmail: string;
  toPhone: string;
  toTaxId: string;

  number: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: string;
  currency: CurrencyCode;

  lineItems: LineItem[];

  discountKind: AdjustmentKind;
  discountValue: string;
  taxLabel: string;
  taxKind: AdjustmentKind;
  taxValue: string;
  tipKind: AdjustmentKind;
  tipValue: string;
  feeLabel: string;
  feeValue: string;
  paidValue: string;

  notes: string;
  terms: string;
  template: 'classic' | 'modern';
  layout: 'full' | 'compact';
};

/** The draft schema version, so old stored data can be rejected safely. */
const DRAFT_VERSION = 1;

export function createEmptyDraft(kind: 'invoice' | 'receipt'): DocumentDraft {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  return {
    fromName: '',
    fromAddress: '',
    fromEmail: '',
    fromPhone: '',
    fromTaxId: '',
    toName: '',
    toAddress: '',
    toEmail: '',
    toPhone: '',
    toTaxId: '',
    number: '',
    issueDate: iso,
    dueDate: '',
    paymentMethod: kind === 'receipt' ? 'Card' : '',
    currency: 'USD',
    lineItems: [createLineItem()],
    discountKind: 'percent',
    discountValue: '',
    taxLabel: kind === 'receipt' ? 'Sales tax' : 'Tax',
    taxKind: 'percent',
    taxValue: '',
    tipKind: 'percent',
    tipValue: '',
    feeLabel: kind === 'invoice' ? 'Shipping' : 'Service charge',
    feeValue: '',
    paidValue: '',
    notes: '',
    terms: '',
    template: 'classic',
    layout: kind === 'receipt' ? 'compact' : 'full',
  };
}

/**
 * Document editor state, with optional local draft persistence.
 *
 * Drafts live in `localStorage` only (spec §7.7): never transmitted, never
 * synced, and always removable through a visible control. Every access is
 * wrapped because storage throws in some privacy configurations.
 */
export function useDocumentState(kind: 'invoice' | 'receipt') {
  const storageKey = `toolnimbly:${kind}-draft`;

  const [draft, setDraft] = useState<DocumentDraft>(() => createEmptyDraft(kind));
  const [draftSaved, setDraftSaved] = useState(false);
  const [saveDrafts, setSaveDrafts] = useState(false);

  // Restore on mount. Done in an effect because localStorage is browser-only
  // and a server-rendered value would not match.
  useEffect(() => {
    if (!features.documentDraftsEnabled) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'version' in parsed &&
        (parsed as { version: number }).version === DRAFT_VERSION &&
        'draft' in parsed
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft({ ...createEmptyDraft(kind), ...(parsed as { draft: DocumentDraft }).draft });
         
        setDraftSaved(true);
         
        setSaveDrafts(true);
      } else {
        // An unrecognised or older schema is discarded rather than guessed at.
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Unreadable storage simply means starting from an empty document.
    }
  }, [kind, storageKey]);

  // Persist whenever the draft changes and saving is enabled.
  useEffect(() => {
    if (!features.documentDraftsEnabled || !saveDrafts) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: DRAFT_VERSION, draft }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftSaved(true);
    } catch {
      // Quota exceeded or storage blocked: the document still works.
    }
  }, [draft, saveDrafts, storageKey]);

  const update = useCallback(<K extends keyof DocumentDraft>(key: K, value: DocumentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const updateLineItem = useCallback((id: string, patch: Partial<LineItem>) => {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }, []);

  const addLineItem = useCallback(() => {
    setDraft((current) =>
      current.lineItems.length >= documentLimits.maxLineItems
        ? current
        : { ...current, lineItems: [...current.lineItems, createLineItem()] },
    );
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setDraft((current) => {
      const remaining = current.lineItems.filter((item) => item.id !== id);
      // Always leave one row, so the table never becomes unusable.
      return { ...current, lineItems: remaining.length > 0 ? remaining : [createLineItem()] };
    });
  }, []);

  const moveLineItem = useCallback((id: string, direction: -1 | 1) => {
    setDraft((current) => {
      const index = current.lineItems.findIndex((item) => item.id === id);
      if (index === -1) return current;
      return { ...current, lineItems: moveItem(current.lineItems, index, index + direction) };
    });
  }, []);

  const deleteDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing to do; the in-memory document is unaffected.
    }
    setDraftSaved(false);
    setSaveDrafts(false);
  }, [storageKey]);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft(kind));
  }, [kind]);

  const totals = useMemo(
    () =>
      roundTotals(
        calculateTotals({
          lineItems: draft.lineItems,
          currency: draft.currency,
          discountKind: draft.discountKind,
          discountValue: draft.discountValue,
          taxKind: draft.taxKind,
          taxValue: draft.taxValue,
          feeValue: draft.feeValue,
          ...(kind === 'receipt'
            ? { tipKind: draft.tipKind, tipValue: draft.tipValue }
            : {}),
          paidValue: draft.paidValue,
        }),
        draft.currency,
      ),
    [draft, kind],
  );

  /** Due before issue is unusual rather than impossible, so it warns. */
  const dueDateWarning =
    kind === 'invoice' &&
    draft.dueDate !== '' &&
    draft.issueDate !== '' &&
    draft.dueDate < draft.issueDate
      ? 'The due date is before the issue date. That is unusual — check both dates before sending.'
      : null;

  return {
    draft,
    totals,
    update,
    updateLineItem,
    addLineItem,
    removeLineItem,
    moveLineItem,
    reset,
    dueDateWarning,
    draftsEnabled: features.documentDraftsEnabled,
    saveDrafts,
    setSaveDrafts,
    draftSaved,
    deleteDraft,
  };
}
