// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CrossTabTable } from '@/components/research/cross-tab-table';
import { DistributionFigure } from '@/components/research/distribution-figure';
import {
  FIELD_DEFINITIONS,
  SUPPRESSION_THRESHOLD,
  aggregate,
  type ValidResponse,
} from '@/lib/research/pipeline';

/**
 * Chart accessibility (task phase 7).
 *
 * The rule the report has to meet is that the information survives without the
 * graphic: a screen reader, a text browser and a page whose CSS failed must all
 * still get the numbers. These tests assert the table is the real thing rather
 * than a caption on a picture.
 */

function response(answers: Record<string, string>): ValidResponse {
  const filled: Record<string, string> = {};
  for (const field of FIELD_DEFINITIONS) {
    filled[field.name] = answers[field.name] ?? field.options[0]?.value ?? '';
  }
  return { responseId: null, submittedOn: '2026-07-10', answers: filled };
}

function many(count: number, answers: Record<string, string>): ValidResponse[] {
  return Array.from({ length: count }, () => response(answers));
}

const summary = aggregate([
  ...many(40, { usual_payment_terms: 'net_30', respondent_role: 'freelancer_sole_proprietor' }),
  ...many(30, { usual_payment_terms: 'net_15', respondent_role: 'freelancer_sole_proprietor' }),
  ...many(20, { usual_payment_terms: 'due_on_receipt', respondent_role: 'small_business_owner' }),
  ...many(6, { usual_payment_terms: 'net_7', respondent_role: 'agency_consultancy_operator' }),
  ...many(4, { usual_payment_terms: 'other_or_custom', respondent_role: 'small_business_owner' }),
]);

const terms = summary.distributions.find((entry) => entry.field === 'usual_payment_terms')!;

describe('a distribution figure', () => {
  it('puts every value in a real table, not only in the bars', () => {
    render(<DistributionFigure distribution={terms} headingId="terms-heading" />);

    const table = screen.getByRole('table');
    for (const row of terms.rows) {
      const cell = within(table).getByRole('rowheader', { name: new RegExp(row.label, 'i') });
      const tableRow = cell.closest('tr');
      expect(tableRow?.textContent, row.label).toContain(String(row.count));
      expect(tableRow?.textContent, row.label).toContain(row.percent.toFixed(1));
    }
  });

  it('states its base and its units in the caption', () => {
    render(<DistributionFigure distribution={terms} headingId="terms-heading" />);
    const caption = screen.getByRole('table').querySelector('caption');
    expect(caption?.textContent).toContain(`Base: all ${terms.base} valid responses`);
    expect(screen.getByRole('table').textContent).toContain('%');
  });

  it('hides the bars from assistive technology, since the table carries the data', () => {
    const { container } = render(
      <DistributionFigure distribution={terms} headingId="terms-heading" />,
    );
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    // The table itself must not be inside the hidden subtree.
    expect(hidden?.querySelector('table')).toBeNull();
  });

  it('conveys nothing by colour alone', () => {
    const { container } = render(
      <DistributionFigure distribution={terms} headingId="terms-heading" />,
    );
    // Every bar carries only a width; the category comes from its text label.
    for (const bar of container.querySelectorAll('[style*="width"]')) {
      expect(bar.getAttribute('style')).toMatch(/^width: [\d.]+%;?$/);
    }
    for (const row of terms.rows) {
      expect(screen.getAllByText(new RegExp(row.label, 'i')).length).toBeGreaterThan(0);
    }
  });

  it('is reachable and scrollable from the keyboard on a narrow screen', () => {
    render(<DistributionFigure distribution={terms} headingId="terms-heading" />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.getAttribute('aria-label')).toContain(terms.question);
  });

  it('labels the denominator when an answer is "Other"', () => {
    render(<DistributionFigure distribution={terms} headingId="terms-heading" />);
    expect(screen.getByText(/kept in the denominator rather than dropped/)).toBeInTheDocument();
  });

  it('animates nothing and fixes every width at render time', () => {
    const { container } = render(
      <DistributionFigure distribution={terms} headingId="terms-heading" />,
    );
    expect(container.innerHTML).not.toContain('animate-');
    expect(container.innerHTML).not.toContain('transition');
  });
});

describe('a segment comparison', () => {
  const crossTab = summary.crossTabs.find((entry) => entry.id === 'payment-terms-by-role')!;

  it('says "withheld" rather than leaving a suppressed cell blank', () => {
    render(<CrossTabTable crossTab={crossTab} />);
    expect(screen.getAllByText('withheld').length).toBeGreaterThan(0);
  });

  it('drops a segment that falls below the threshold entirely', () => {
    render(<CrossTabTable crossTab={crossTab} />);
    // Six agency respondents is under the threshold, so the row is not rendered.
    expect(crossTab.segments.find((s) => s.value === 'agency_consultancy_operator')?.base).toBe(6);
    expect(screen.queryByRole('rowheader', { name: /Agency or consultancy operator/ })).toBeNull();
  });

  it('shows each surviving group with its own base', () => {
    render(<CrossTabTable crossTab={crossTab} />);
    const header = screen.getByRole('rowheader', { name: /Freelancer or sole proprietor/ });
    expect(header.closest('tr')?.textContent).toContain('70');
  });

  it('accounts for what it withheld, and refuses a causal reading', () => {
    render(<CrossTabTable crossTab={crossTab} />);
    expect(
      screen.getByText(/are withheld because they represent too few respondents/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/an association in this sample, not evidence that one causes the other/i),
    ).toBeInTheDocument();
  });

  it('publishes nothing when no group clears the threshold', () => {
    const thin = aggregate(
      many(SUPPRESSION_THRESHOLD - 1, { respondent_role: 'other_business_operator' }),
    );
    const empty = thin.crossTabs.find((entry) => entry.id === 'payment-terms-by-role')!;

    render(<CrossTabTable crossTab={empty} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText(/falls below the reporting threshold/i)).toBeInTheDocument();
  });
});
