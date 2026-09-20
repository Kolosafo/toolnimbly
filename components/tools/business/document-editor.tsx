'use client';

import { ArrowDown, ArrowUp, Download, Plus, Printer, Trash2, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { controlClasses, Field } from '@/components/forms/field';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { SelectField } from '@/components/forms/select-field';
import { SwitchField } from '@/components/forms/switch-field';
import { documentLimits } from '@/lib/config/limits';
import { formatMoney } from '@/lib/documents/money';
import { downloadBlob, sanitizeFilename } from '@/lib/download/file';
import { CURRENCIES, type CurrencyCode } from '@/lib/formatting/number';
import { decodeImage, encodeCanvas, renderToCanvas } from '@/lib/image/codec';
import { containWithin } from '@/lib/image/geometry';
import { cn } from '@/lib/utils/cn';

import { useDocumentState, type DocumentDraft } from './document-state';
import { DocumentPreview } from './document-preview';

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.label}`,
}));

const ADJUSTMENT_OPTIONS = [
  { value: 'percent' as const, label: 'Percent (%)' },
  { value: 'amount' as const, label: 'Fixed amount' },
];

const TEMPLATE_OPTIONS = [
  { value: 'classic' as const, label: 'Classic', description: 'Ruled table, conventional layout' },
  { value: 'modern' as const, label: 'Modern', description: 'Lighter rules, more whitespace' },
];

const LAYOUT_OPTIONS = [
  { value: 'full' as const, label: 'Full page', description: 'A4 or Letter, for filing or email' },
  { value: 'compact' as const, label: 'Compact', description: '80 mm till roll' },
];

export function DocumentEditor({ kind }: { kind: 'invoice' | 'receipt' }) {
  const state = useDocumentState(kind);
  const { draft, totals } = state;

  const [logo, setLogo] = useState<{ data: Uint8Array; type: 'image/jpeg' | 'image/png'; url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const logoUrl = useRef<string | null>(null);

  const isInvoice = kind === 'invoice';
  const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, draft.currency);

  /**
   * Downscales a logo in the browser before embedding it.
   * The file is never uploaded; only the resized pixels go into the PDF.
   */
  async function addLogo(file: File) {
    setError(null);

    if (file.size > documentLimits.maxLogoBytes) {
      setError(`That logo is too large. The limit is ${documentLimits.maxLogoBytes / 1024 / 1024} MB.`);
      return;
    }

    try {
      const decoded = await decodeImage(file);
      const target = containWithin(
        { width: decoded.width, height: decoded.height },
        { width: documentLimits.maxLogoEdgePixels, height: documentLimits.maxLogoEdgePixels },
      );

      const canvas = renderToCanvas(decoded.bitmap, { output: target });
      decoded.bitmap.close();

      const blob = await encodeCanvas(canvas, 'image/png', 0.92);
      const data = new Uint8Array(await blob.arrayBuffer());

      if (logoUrl.current) URL.revokeObjectURL(logoUrl.current);
      const url = URL.createObjectURL(blob);
      logoUrl.current = url;

      setLogo({ data, type: 'image/png', url });
    } catch {
      setError('That logo could not be read. Try a PNG or JPG file.');
    }
  }

  function buildInput() {
    return {
      meta: {
        kind,
        number: draft.number,
        issueDate: draft.issueDate,
        ...(isInvoice ? { dueDate: draft.dueDate } : { paymentMethod: draft.paymentMethod }),
        currency: draft.currency,
        notes: draft.notes,
        terms: draft.terms,
        logo: logo ? { data: logo.data, type: logo.type } : null,
      },
      from: {
        name: draft.fromName,
        address: draft.fromAddress,
        email: draft.fromEmail,
        phone: draft.fromPhone,
        taxId: draft.fromTaxId,
      },
      to: {
        name: draft.toName,
        address: draft.toAddress,
        email: draft.toEmail,
        phone: draft.toPhone,
        taxId: draft.toTaxId,
      },
      totals,
      layout: isInvoice ? ('full' as const) : draft.layout,
    };
  }

  async function downloadPdf() {
    setWorking(true);
    setError(null);

    try {
      /*
       * pdf-lib is imported here rather than at the top of the file.
       *
       * It is ~170 KB and is only needed once someone actually downloads. A
       * static import puts it in the page's initial JavaScript, so every
       * visitor pays to download a PDF writer before they have typed a single
       * line item — and on a throttled mobile connection that dominated the
       * page's largest-contentful-paint. Deferring it to the click is what
       * spec §7.8 means by loading large renderers after user interaction.
       */
      const { buildDocumentPdf } = await import('@/lib/documents/pdf');
      const bytes = await buildDocumentPdf(buildInput());
      const base = sanitizeFilename(
        `${kind}-${draft.number || draft.issueDate || 'document'}`,
      );
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${base}.pdf`);
    } catch {
      setError('The PDF could not be generated. Check the document and try again.');
    } finally {
      setWorking(false);
    }
  }

  const field = <K extends keyof DocumentDraft>(key: K) => ({
    value: draft[key] as string,
    onChange: (value: string) => state.update(key, value as DocumentDraft[K]),
  });

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---- Editor ----
            min-w-0 is load-bearing: a grid item defaults to min-width:auto, so
            without it the widest control — the file input — sets the column's
            minimum and pushes the whole page past 320px. */}
        <div className="min-w-0 space-y-6 print:hidden">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Your details</legend>

            <Field label="Business name">
              {(props) => (
                <input {...props} type="text" {...field('fromName')} onChange={(e) => state.update('fromName', e.target.value)} value={draft.fromName} className={controlClasses} />
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="from-address" className="text-sm font-medium">
                Address
              </label>
              <textarea
                id="from-address"
                rows={3}
                value={draft.fromAddress}
                onChange={(event) => state.update('fromAddress', event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                {(props) => (
                  <input {...props} type="email" value={draft.fromEmail} onChange={(e) => state.update('fromEmail', e.target.value)} className={controlClasses} />
                )}
              </Field>
              <Field label="Phone">
                {(props) => (
                  <input {...props} type="tel" value={draft.fromPhone} onChange={(e) => state.update('fromPhone', e.target.value)} className={controlClasses} />
                )}
              </Field>
            </div>

            <Field label="Tax or business ID">
              {(props) => (
                <input {...props} type="text" value={draft.fromTaxId} onChange={(e) => state.update('fromTaxId', e.target.value)} className={controlClasses} />
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="logo-input" className="text-sm font-medium">
                Logo
              </label>
              <input
                id="logo-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void addLogo(file);
                }}
                className="w-full max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:text-sm file:font-medium"
              />
              <p className="text-xs text-muted">
                Downscaled in your browser and embedded directly. Never uploaded.
              </p>
              {logo ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.url} alt="Your logo" className="h-12 w-auto rounded border border-border-default" />
                  <button
                    type="button"
                    onClick={() => {
                      if (logoUrl.current) URL.revokeObjectURL(logoUrl.current);
                      logoUrl.current = null;
                      setLogo(null);
                    }}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
                  >
                    Remove logo
                  </button>
                </div>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border-default pt-5">
            <legend className="text-sm font-semibold">
              {isInvoice ? 'Bill to' : 'Customer (optional)'}
            </legend>

            <Field label={isInvoice ? 'Client name' : 'Customer name'}>
              {(props) => (
                <input {...props} type="text" value={draft.toName} onChange={(e) => state.update('toName', e.target.value)} className={controlClasses} />
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="to-address" className="text-sm font-medium">
                Address
              </label>
              <textarea
                id="to-address"
                rows={3}
                value={draft.toAddress}
                onChange={(event) => state.update('toAddress', event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
              />
            </div>

            {isInvoice ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client email">
                  {(props) => (
                    <input {...props} type="email" value={draft.toEmail} onChange={(e) => state.update('toEmail', e.target.value)} className={controlClasses} />
                  )}
                </Field>
                <Field label="Client tax ID">
                  {(props) => (
                    <input {...props} type="text" value={draft.toTaxId} onChange={(e) => state.update('toTaxId', e.target.value)} className={controlClasses} />
                  )}
                </Field>
              </div>
            ) : null}
          </fieldset>

          <fieldset className="space-y-4 border-t border-border-default pt-5">
            <legend className="text-sm font-semibold">Document details</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={isInvoice ? 'Invoice number' : 'Receipt number'}
                helper="Numbering is yours to manage — nothing is stored between visits."
              >
                {(props) => (
                  <input {...props} type="text" value={draft.number} onChange={(e) => state.update('number', e.target.value)} className={controlClasses} />
                )}
              </Field>
              <SelectField
                label="Currency"
                value={draft.currency}
                onChange={(value) => state.update('currency', value as CurrencyCode)}
                options={CURRENCY_OPTIONS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isInvoice ? 'Issue date' : 'Transaction date'}>
                {(props) => (
                  <input {...props} type="date" value={draft.issueDate} onChange={(e) => state.update('issueDate', e.target.value)} className={controlClasses} />
                )}
              </Field>

              {isInvoice ? (
                <Field label="Due date" error={state.dueDateWarning}>
                  {(props) => (
                    <input {...props} type="date" value={draft.dueDate} onChange={(e) => state.update('dueDate', e.target.value)} className={controlClasses} />
                  )}
                </Field>
              ) : (
                <Field label="Payment method">
                  {(props) => (
                    <input {...props} type="text" value={draft.paymentMethod} onChange={(e) => state.update('paymentMethod', e.target.value)} className={controlClasses} />
                  )}
                </Field>
              )}
            </div>
          </fieldset>

          {/* ---- Line items ---- */}
          <fieldset className="border-t border-border-default pt-5">
            <legend className="text-sm font-semibold">Line items</legend>

            <ul className="mt-3 space-y-3">
              {draft.lineItems.map((item, index) => (
                <li key={item.id} className="rounded-lg border border-border-default bg-surface-sunken p-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <Field label={`Description ${index + 1}`}>
                      {(props) => (
                        <input
                          {...props}
                          type="text"
                          value={item.description}
                          onChange={(event) =>
                            state.updateLineItem(item.id, { description: event.target.value })
                          }
                          className={controlClasses}
                        />
                      )}
                    </Field>
                    <NumberField
                      label={`Quantity ${index + 1}`}
                      value={item.quantity}
                      onChange={(value) => state.updateLineItem(item.id, { quantity: value })}
                    />
                    <NumberField
                      label={`Unit price ${index + 1}`}
                      value={item.unitPrice}
                      onChange={(value) => state.updateLineItem(item.id, { unitPrice: value })}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="tabular text-sm">
                      Line total:{' '}
                      <span className="font-semibold">
                        {money(totals.lines[index]?.total ?? totals.subtotal.times(0))}
                      </span>
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => state.moveLineItem(item.id, -1)}
                        disabled={index === 0}
                        className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                        <span className="sr-only">Move line {index + 1} up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => state.moveLineItem(item.id, 1)}
                        disabled={index === draft.lineItems.length - 1}
                        className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                        <span className="sr-only">Move line {index + 1} down</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => state.removeLineItem(item.id)}
                        className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="sr-only">Remove line {index + 1}</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={state.addLineItem}
              disabled={draft.lineItems.length >= documentLimits.maxLineItems}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-sunken disabled:opacity-55"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add line item
            </button>
          </fieldset>

          {/* ---- Adjustments ---- */}
          <fieldset className="space-y-4 border-t border-border-default pt-5">
            <legend className="text-sm font-semibold">Discount, tax and fees</legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Discount type"
                value={draft.discountKind}
                onChange={(value) => state.update('discountKind', value)}
                options={ADJUSTMENT_OPTIONS}
              />
              <NumberField
                label="Discount"
                value={draft.discountValue}
                onChange={(value) => state.update('discountValue', value)}
                unit={draft.discountKind === 'percent' ? '%' : draft.currency}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tax label">
                {(props) => (
                  <input {...props} type="text" value={draft.taxLabel} onChange={(e) => state.update('taxLabel', e.target.value)} className={controlClasses} />
                )}
              </Field>
              <SelectField
                label="Tax type"
                value={draft.taxKind}
                onChange={(value) => state.update('taxKind', value)}
                options={ADJUSTMENT_OPTIONS}
              />
              <NumberField
                label="Tax"
                value={draft.taxValue}
                onChange={(value) => state.update('taxValue', value)}
                unit={draft.taxKind === 'percent' ? '%' : draft.currency}
              />
            </div>

            <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-xs">
              Tax is applied <strong>after</strong> the discount, which is standard practice in most
              jurisdictions. The taxable amount is shown on the document so the order used is
              visible.
            </p>

            {!isInvoice ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Tip type"
                  value={draft.tipKind}
                  onChange={(value) => state.update('tipKind', value)}
                  options={ADJUSTMENT_OPTIONS}
                />
                <NumberField
                  label="Tip or service charge"
                  value={draft.tipValue}
                  onChange={(value) => state.update('tipValue', value)}
                  unit={draft.tipKind === 'percent' ? '%' : draft.currency}
                  helper="Calculated on the pre-tax subtotal."
                />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fee label">
                {(props) => (
                  <input {...props} type="text" value={draft.feeLabel} onChange={(e) => state.update('feeLabel', e.target.value)} className={controlClasses} />
                )}
              </Field>
              <NumberField
                label="Fee amount"
                value={draft.feeValue}
                onChange={(value) => state.update('feeValue', value)}
                unit={draft.currency}
              />
            </div>

            <NumberField
              label={isInvoice ? 'Amount already paid' : 'Amount tendered'}
              value={draft.paidValue}
              onChange={(value) => state.update('paidValue', value)}
              unit={draft.currency}
              helper={isInvoice ? 'Shows a balance due on the document.' : 'Change is calculated for you.'}
            />
          </fieldset>

          {/* ---- Notes and presentation ---- */}
          <fieldset className="space-y-4 border-t border-border-default pt-5">
            <legend className="text-sm font-semibold">Notes and presentation</legend>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="doc-notes"
                rows={3}
                value={draft.notes}
                onChange={(event) => state.update('notes', event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-terms" className="text-sm font-medium">
                {isInvoice ? 'Payment instructions and terms' : 'Return policy and terms'}
              </label>
              <textarea
                id="doc-terms"
                rows={3}
                value={draft.terms}
                onChange={(event) => state.update('terms', event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
              />
            </div>

            <SegmentedControl
              legend="Template"
              value={draft.template}
              onChange={(value) => state.update('template', value)}
              options={TEMPLATE_OPTIONS}
            />

            {!isInvoice ? (
              <SegmentedControl
                legend="Layout"
                value={draft.layout}
                onChange={(value) => state.update('layout', value)}
                options={LAYOUT_OPTIONS}
              />
            ) : null}
          </fieldset>

          {/* ---- Drafts ---- */}
          {state.draftsEnabled ? (
            <fieldset className="space-y-3 border-t border-border-default pt-5">
              <legend className="text-sm font-semibold">Saved draft</legend>
              <SwitchField
                label="Keep a draft in this browser"
                checked={state.saveDrafts}
                onChange={state.setSaveDrafts}
                helper="Stored in this browser only. Never transmitted, and not available on another device."
              />
              {state.draftSaved ? (
                <button
                  type="button"
                  onClick={state.deleteDraft}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-danger-border bg-danger-surface px-3 text-sm font-medium"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete saved draft
                </button>
              ) : null}
            </fieldset>
          ) : null}
        </div>

        {/* ---- Preview ---- */}
        <div className="min-w-0">
          <div className="sticky top-20 space-y-4">
            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-surface-sunken"
              >
                <Printer className="size-4" aria-hidden="true" />
                Print
              </button>
              <button
                type="button"
                onClick={() => void downloadPdf()}
                disabled={working}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                <Download className="size-4" aria-hidden="true" />
                {working ? 'Generating…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={state.reset}
                className="inline-flex min-h-12 items-center rounded-md px-3 text-sm text-muted hover:bg-surface-sunken hover:text-foreground"
              >
                Start a new {kind}
              </button>
            </div>

            {error ? <InlineError message={error} /> : null}

            {state.dueDateWarning ? (
              <p className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm print:hidden">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>{state.dueDateWarning}</span>
              </p>
            ) : null}

            {totals.underpaid && !isInvoice ? (
              <p className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm print:hidden">
                The amount tendered does not cover the total, so no change is due.
              </p>
            ) : null}

            <div
              tabIndex={0}
              role="region"
              aria-label="Document preview"
              className={cn(
                'w-full max-w-full overflow-x-auto rounded-lg border border-border-default bg-white',
                'print:border-0 print:shadow-none',
              )}
            >
              <DocumentPreview
                kind={kind}
                draft={draft}
                totals={totals}
                logoUrl={logo?.url ?? null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
