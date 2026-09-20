import { describe, expect, it } from 'vitest';

import { guideContents } from '@/content/guides';
import { buildAmortization } from '@/lib/calculators/amortization';
import { guides, tools } from '@/lib/registry';

/**
 * Guides quote figures. Figures drift.
 *
 * Every number published in an article is recomputed here from the same
 * library the tool uses, so prose and implementation cannot part company
 * silently — the failure mode that previously let a tool page advertise a
 * payment the calculator never produced.
 */
describe('the loan interest guide agrees with the calculator', () => {
  const result = buildAmortization({ principal: 25000, annualRatePercent: 6, termMonths: 60 });
  const withExtra = buildAmortization({
    principal: 25000,
    annualRatePercent: 6,
    termMonths: 60,
    extraMonthlyPayment: 50,
  });

  if (!result.ok || !withExtra.ok) throw new Error('the worked example no longer computes');

  const article = guideContents.find((guide) => guide.slug === 'how-loan-interest-works');
  const prose = JSON.stringify(article);

  const money = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  it('quotes the payment, total interest and total paid', () => {
    expect(result.scheduledPayment.toFixed(2)).toBe('483.32');
    expect(prose).toContain(`$${money(result.scheduledPayment)}`);
    expect(prose).toContain(`$${money(result.totalInterest)}`);
  });

  it('quotes the first and last payment splits', () => {
    const first = result.schedule[0]!;
    const last = result.schedule.at(-1)!;

    expect(prose).toContain(`$${money(first.interest)}`);
    expect(prose).toContain(`$${money(first.principal)}`);
    expect(prose).toContain(`$${money(last.interest)}`);
    expect(prose).toContain(`$${money(last.principal)}`);

    // The article states this share to one decimal place.
    const share = ((first.interest / first.payment) * 100).toFixed(1);
    expect(prose).toContain(`${share}%`);
  });

  it('quotes the halfway balance and the share of principal repaid', () => {
    const halfway = result.schedule[29]!;
    expect(prose).toContain(`$${money(halfway.balance)}`);
    expect(prose).toContain(`$${money(25000 - halfway.balance)}`);

    const repaidShare = Math.round(((25000 - halfway.balance) / 25000) * 100);
    expect(prose).toContain(`${repaidShare}%`);
  });

  it('quotes what the extra payment saves', () => {
    expect(withExtra.monthsToPayoff).toBe(54);
    expect(prose).toContain(`${withExtra.monthsToPayoff} months`);
    expect(prose).toContain(`$${money(withExtra.totalInterest)}`);
    expect(prose).toContain(`$${money(withExtra.savings!.interestSaved)}`);
  });
});

describe('guide registry and content stay in step', () => {
  it('has exactly one content module per registered guide', () => {
    expect(guideContents.map((guide) => guide.slug).sort()).toEqual(
      guides.map((guide) => guide.slug).sort(),
    );
  });

  it('links only to tools that exist, and at least three of them', () => {
    const slugs = new Set(tools.map((tool) => tool.slug));
    for (const guide of guides) {
      expect(guide.relatedToolSlugs.length, guide.slug).toBeGreaterThanOrEqual(3);
      for (const slug of guide.relatedToolSlugs) {
        expect(slugs.has(slug), `${guide.slug} links to unknown tool ${slug}`).toBe(true);
      }
    }
  });

  it('keeps titles and descriptions within the limits the tool pages use', () => {
    for (const guide of guides) {
      expect(guide.title.length, `${guide.slug} title`).toBeLessThanOrEqual(60);
      expect(guide.description.length, `${guide.slug} description`).toBeGreaterThanOrEqual(110);
      expect(guide.description.length, `${guide.slug} description`).toBeLessThanOrEqual(165);
    }
  });

  it('gives every guide four to six FAQs and a unique slug', () => {
    const seen = new Set<string>();
    for (const guide of guideContents) {
      expect(guide.faqs.length, guide.slug).toBeGreaterThanOrEqual(4);
      expect(guide.faqs.length, guide.slug).toBeLessThanOrEqual(6);
      expect(seen.has(guide.slug)).toBe(false);
      seen.add(guide.slug);
    }
  });
});
