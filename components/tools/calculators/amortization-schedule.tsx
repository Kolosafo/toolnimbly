'use client';

import { DataTable } from '@/components/tables/data-table';
import type { AmortizationRow, YearSummary } from '@/lib/calculators/amortization';
import { formatLongDate } from '@/lib/date/calendar';
import { formatCurrency } from '@/lib/formatting/number';

/**
 * The amortisation table and yearly summary, shared by the loan and mortgage
 * calculators (Appendix A). Both get the same CSV export.
 */
export function AmortizationSchedule({
  schedule,
  yearSummaries,
  currency,
  filename,
}: {
  schedule: readonly AmortizationRow[];
  yearSummaries: readonly YearSummary[];
  currency: string;
  filename: string;
}) {
  const money = (value: number) => formatCurrency(value, currency);

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="yearly-summary-heading">
        {/* h2, not h3: this is a top-level section of the page, a peer of
            "How to use" and "Worked example". An h3 here sits directly under
            the page h1 and skips a level. */}
        <h2 id="yearly-summary-heading" className="text-lg font-semibold">
          Yearly summary
        </h2>
        <div className="mt-3">
          <DataTable
            caption="Principal, interest and remaining balance for each year of the loan"
            rows={yearSummaries}
            rowKey={(row) => String(row.year)}
            initialRowLimit={12}
            columns={[
              { header: 'Year', cell: (row) => row.label },
              { header: 'Principal', cell: (row) => money(row.principal), numeric: true },
              { header: 'Interest', cell: (row) => money(row.interest), numeric: true },
              { header: 'Total paid', cell: (row) => money(row.payments), numeric: true },
              { header: 'Balance', cell: (row) => money(row.endingBalance), numeric: true },
            ]}
            csvColumns={[
              { header: 'Year', value: (row) => row.label },
              { header: 'Principal', value: (row) => row.principal.toFixed(2) },
              { header: 'Interest', value: (row) => row.interest.toFixed(2) },
              { header: 'Total paid', value: (row) => row.payments.toFixed(2) },
              { header: 'Ending balance', value: (row) => row.endingBalance.toFixed(2) },
            ]}
            csvFilename={`${filename}-yearly-summary`}
          />
        </div>
      </section>

      <section aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-lg font-semibold">
          Full amortisation schedule
        </h2>
        <p className="measure mt-2 text-sm text-muted">
          Every payment, split into the part that covers interest and the part that reduces what you
          owe. Watch the two columns cross over as the balance falls.
        </p>
        <div className="mt-3">
          <DataTable
            caption="Payment-by-payment breakdown of interest, principal and remaining balance"
            rows={schedule}
            rowKey={(row) => String(row.paymentNumber)}
            columns={[
              {
                header: '#',
                cell: (row) => row.paymentNumber,
                numeric: true,
              },
              ...(schedule[0]?.date
                ? [
                    {
                      header: 'Date',
                      cell: (row: AmortizationRow) => (row.date ? formatLongDate(row.date) : '—'),
                    },
                  ]
                : []),
              { header: 'Payment', cell: (row) => money(row.payment), numeric: true },
              { header: 'Principal', cell: (row) => money(row.principal), numeric: true },
              { header: 'Interest', cell: (row) => money(row.interest), numeric: true },
              { header: 'Balance', cell: (row) => money(row.balance), numeric: true },
            ]}
            csvColumns={[
              { header: 'Payment number', value: (row) => row.paymentNumber },
              {
                header: 'Date',
                value: (row) =>
                  row.date
                    ? `${row.date.year}-${String(row.date.month).padStart(2, '0')}-${String(row.date.day).padStart(2, '0')}`
                    : '',
              },
              { header: 'Payment', value: (row) => row.payment.toFixed(2) },
              { header: 'Principal', value: (row) => row.principal.toFixed(2) },
              { header: 'Interest', value: (row) => row.interest.toFixed(2) },
              { header: 'Remaining balance', value: (row) => row.balance.toFixed(2) },
            ]}
            csvFilename={`${filename}-schedule`}
          />
        </div>
      </section>
    </div>
  );
}
