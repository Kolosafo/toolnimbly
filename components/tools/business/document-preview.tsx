'use client';

import { formatMoney } from '@/lib/documents/money';
import type { DocumentTotals } from '@/lib/documents/model';
import { cn } from '@/lib/utils/cn';

import type { DocumentDraft } from './document-state';

/**
 * The on-screen and printed document.
 *
 * Every figure comes from the same rounded `DocumentTotals` the PDF renderer
 * uses, so the preview, the print output and the downloaded file cannot
 * disagree (spec §6.29, §6.30).
 *
 * User-entered text is rendered as text nodes throughout — never as HTML.
 */
export function DocumentPreview({
  kind,
  draft,
  totals,
  logoUrl,
}: {
  kind: 'invoice' | 'receipt';
  draft: DocumentDraft;
  totals: DocumentTotals;
  logoUrl: string | null;
}) {
  const isInvoice = kind === 'invoice';
  const compact = !isInvoice && draft.layout === 'compact';
  const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, draft.currency);
  const modern = draft.template === 'modern';

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: 'Subtotal', value: money(totals.subtotal) },
  ];

  if (!totals.discount.eq(0)) {
    rows.push({ label: 'Discount', value: `−${money(totals.discount)}` });
    rows.push({ label: 'Taxable amount', value: money(totals.taxableAmount) });
  }
  if (!totals.tax.eq(0)) rows.push({ label: draft.taxLabel || 'Tax', value: money(totals.tax) });
  if (!totals.tip.eq(0)) rows.push({ label: 'Tip', value: money(totals.tip) });
  if (!totals.fee.eq(0)) {
    rows.push({ label: draft.feeLabel || 'Fee', value: money(totals.fee) });
  }
  rows.push({ label: 'Total', value: money(totals.total), strong: true });

  if (!totals.paid.eq(0)) {
    rows.push({
      label: isInvoice ? 'Paid' : 'Amount tendered',
      value: money(totals.paid),
    });
  }

  if (isInvoice) {
    if (!totals.paid.eq(0)) {
      rows.push({ label: 'Balance due', value: money(totals.balanceDue), strong: true });
    }
  } else if (!totals.change.eq(0)) {
    rows.push({ label: 'Change', value: money(totals.change), strong: true });
  }

  return (
    <article
      data-document-preview
      className={cn(
        'mx-auto bg-white p-6 text-[#15181d] sm:p-8',
        compact ? 'max-w-[22rem] text-xs' : 'max-w-[52rem] text-sm',
        'print:max-w-none print:p-0',
      )}
    >
      {/* ---- Header ---- */}
      <header className={cn('flex gap-6', compact ? 'flex-col items-center text-center' : 'items-start justify-between')}>
        <div className={compact ? 'space-y-1' : 'min-w-0'}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={draft.fromName ? `${draft.fromName} logo` : 'Business logo'}
              className={cn('mb-3 w-auto object-contain', compact ? 'mx-auto h-10' : 'h-14')}
            />
          ) : null}
          {draft.fromName ? (
            <p className="text-base font-semibold">{draft.fromName}</p>
          ) : null}
          {draft.fromAddress
            ? draft.fromAddress.split('\n').map((line) => (
                <p key={line} className="text-[#5b6472]">
                  {line}
                </p>
              ))
            : null}
          {draft.fromEmail ? <p className="text-[#5b6472]">{draft.fromEmail}</p> : null}
          {draft.fromPhone ? <p className="text-[#5b6472]">{draft.fromPhone}</p> : null}
          {draft.fromTaxId ? <p className="text-[#5b6472]">{draft.fromTaxId}</p> : null}
        </div>

        <div className={compact ? 'mt-2' : 'shrink-0 text-right'}>
          <h2 className={cn('font-bold tracking-tight', compact ? 'text-lg' : 'text-3xl')}>
            {isInvoice ? 'INVOICE' : 'RECEIPT'}
          </h2>
          {draft.number ? <p className="mt-1 text-[#5b6472]">No. {draft.number}</p> : null}
        </div>
      </header>

      {/* ---- Parties and dates ---- */}
      {!compact ? (
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
              {isInvoice ? 'Bill to' : 'Customer'}
            </h3>
            <div className="mt-2 space-y-0.5">
              {draft.toName ? <p className="font-medium">{draft.toName}</p> : null}
              {draft.toAddress
                ? draft.toAddress.split('\n').map((line) => (
                    <p key={line} className="text-[#5b6472]">
                      {line}
                    </p>
                  ))
                : null}
              {draft.toEmail ? <p className="text-[#5b6472]">{draft.toEmail}</p> : null}
              {draft.toTaxId ? <p className="text-[#5b6472]">{draft.toTaxId}</p> : null}
            </div>
          </div>

          <dl className="space-y-1 sm:text-right">
            {draft.issueDate ? (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-[#5b6472]">{isInvoice ? 'Issued' : 'Date'}</dt>
                <dd className="font-medium sm:min-w-28">{draft.issueDate}</dd>
              </div>
            ) : null}
            {isInvoice && draft.dueDate ? (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-[#5b6472]">Due</dt>
                <dd className="font-medium sm:min-w-28">{draft.dueDate}</dd>
              </div>
            ) : null}
            {!isInvoice && draft.paymentMethod ? (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-[#5b6472]">Payment method</dt>
                <dd className="font-medium sm:min-w-28">{draft.paymentMethod}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : (
        <div className="mt-3 space-y-0.5 text-center text-[#5b6472]">
          {draft.issueDate ? <p>{draft.issueDate}</p> : null}
          {draft.toName ? <p>{draft.toName}</p> : null}
        </div>
      )}

      {/* ---- Line items ---- */}
      <section className="mt-6">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            {isInvoice ? 'Invoice' : 'Receipt'} line items with quantity, unit price and amount
          </caption>
          <thead>
            <tr className={cn('border-b', modern ? 'border-[#e6e8eb]' : 'border-[#15181d]')}>
              <th scope="col" className="py-2 text-left text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
                Description
              </th>
              <th scope="col" className="py-2 text-right text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
                Qty
              </th>
              <th scope="col" className="py-2 text-right text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
                Unit
              </th>
              <th scope="col" className="py-2 text-right text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.lines.map((line) => (
              <tr key={line.id} className={cn('border-b', modern ? 'border-[#f0f1f3]' : 'border-[#e6e8eb]')}>
                <td className="py-2 pr-3 align-top break-words">{line.description || '—'}</td>
                <td className="py-2 text-right align-top tabular-nums">{line.quantity.toString()}</td>
                <td className="py-2 pl-3 text-right align-top tabular-nums">{money(line.unitPrice)}</td>
                <td className="py-2 pl-3 text-right align-top font-medium tabular-nums">
                  {money(line.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ---- Totals ---- */}
      <section className={cn('mt-4 flex', compact ? '' : 'justify-end')}>
        <dl className={cn('space-y-1', compact ? 'w-full' : 'w-full max-w-xs')}>
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn(
                'flex justify-between gap-6 py-0.5',
                row.strong && 'border-t border-[#15181d] pt-1.5 text-base font-bold',
              )}
            >
              <dt className={row.strong ? undefined : 'text-[#5b6472]'}>{row.label}</dt>
              <dd className="tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Notes, terms and the scope statement ---- */}
      {draft.notes.trim() ? (
        <section className="mt-6">
          <h3 className="text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">Notes</h3>
          <p className="mt-1 whitespace-pre-wrap">{draft.notes}</p>
        </section>
      ) : null}

      {draft.terms.trim() ? (
        <section className="mt-4">
          <h3 className="text-[0.7rem] font-semibold tracking-wide text-[#5b6472] uppercase">
            {isInvoice ? 'Payment terms' : 'Terms'}
          </h3>
          <p className="mt-1 whitespace-pre-wrap">{draft.terms}</p>
        </section>
      ) : null}

      {!isInvoice ? (
        <p className="mt-6 text-center text-[0.65rem] text-[#5b6472]">
          This receipt records the details entered above. It is not, by itself, proof that a
          transaction took place.
        </p>
      ) : null}
    </article>
  );
}
