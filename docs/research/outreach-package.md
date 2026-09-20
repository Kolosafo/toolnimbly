# Outreach package — invoice payment terms benchmark

**Status: NOT READY TO SEND.** The report is unpublished, so five of the nine
fields below cannot be filled without inventing them. This file is the template
and the checklist, not a draft to send. Nothing here is to be sent as part of
the task that created it — no outreach is automated, queued or scheduled by any
code in this repository.

**Date:** 2026-09-20 · Prepared for the Priority 5 outreach task.

---

## The rule this package exists to enforce

**Every claim in an outreach message must match the published report exactly.**
Same sample size, same percentage, same denominator, same caveat. If a sentence
in a pitch cannot be pointed at a sentence on the page, it does not go in the
pitch.

Two phrasings that are specifically forbidden, in the report and in any message
about it: that the sample is _representative_ or _industry-wide_, and that any
result is _statistically significant_. It is a self-selected convenience sample.
Saying so up front is the reason a careful journalist would trust the rest.

Do not offer, buy, exchange, require or reciprocate a link. The report is the
offer.

## 1. One-sentence summary

> **PENDING REAL DATA.** Fill from the published page's opening paragraph.

Template, to be completed with the verified figures:

> ToolNimbly surveyed **[N]** people who invoice for their own business between
> **[fieldwork start]** and **[fieldwork end]**, and published what terms they
> use, how long they actually wait to be paid, and how often they are paid late
> — with the method, the base and the limitations attached.

## 2. Three to five verified findings

> **PENDING REAL DATA.** These are generated, not written: the published page's
> "What the responses show" section is produced by `keyFindings()` in
> `lib/research/findings.ts` from the aggregate summary. Copy those bullets
> verbatim. Do not paraphrase a percentage, and do not drop a denominator to
> make a sentence shorter.

## 3. Methodology summary

Ready now, and true whatever the data turns out to be:

> An online, self-completed questionnaire of twelve multiple-choice questions,
> open to people aged 18 or over who send invoices for a business they operate.
> No free-text questions. No name, email address, client name, invoice content,
> revenue figure, bank detail, tax identifier or IP address was collected;
> location was collected at continent level only. Every respondent gave explicit
> consent to aggregate publication before answering. Responses without consent,
> with a missing required answer, with an answer outside the documented options,
> or with a duplicate response identifier were discarded. Percentages are
> rounded to one decimal place and calculated independently, so a column may
> total 99.9% or 100.1%. Any segment cell representing fewer than ten
> respondents is withheld. Payment timing was asked as ranges, so no average or
> median number of days is reported.

Add, in the same breath, every time:

> This is a convenience sample of a self-selected audience. It is not
> representative of small businesses generally, of any country or of any
> industry, and no margin of error is quoted because none can be calculated for
> a sample of this kind.

## 4. Sample size and fieldwork dates

> **PENDING REAL DATA.** `totalValidResponses`, `fieldwork.start` and
> `fieldwork.end` from
> `data/research/aggregates/invoice-payment-terms-benchmark-2026-summary.json`.
> Publication floor is 100 valid responses; 150 or more is the target.

## 5. Canonical report URL

`https://www.toolnimbly.com/research/invoice-payment-terms-benchmark-2026`

Live only after publication. Until then this URL returns a real 404 — do not
share it, and do not pre-announce it.

## 6. Public aggregate data URL

`https://www.toolnimbly.com/research/invoice-payment-terms-benchmark-2026-aggregates.csv`

Long-format CSV: question, answer, respondent count, percentage, base, and a
flag on every withheld cell. Individual responses are not in it and are not
published anywhere. Offer this link in the pitch, so anyone who wants to check
a figure can do so without asking.

## 7. Social image URL

`https://www.toolnimbly.com/research/invoice-payment-terms-benchmark-2026/social-image`

1200×630. Before publication it carries no statistic at all; after publication
it carries the title and the verified sample size, and nothing else.

## 8. Suggested audiences

- **Bookkeeping and accounting education** — course authors and trainers
  teaching invoicing and receivables basics, who need a current citable figure
  rather than an anecdote.
- **Freelancer communities** — forums, newsletters and associations for
  self-employed people, whose members invoice for themselves.
- **Small-business publications** — reporters covering cash flow and payment
  practice, who need a named method and a downloadable dataset.
- **Accounting blogs** — practitioners writing about payment terms and
  collections.
- **Accounts-receivable specialists** — analysts and consultants who already
  publish on days-sales-outstanding and want a small-business counterpoint.

Approach each on the merits of the data. If it is not useful to them, the right
answer is not to send it.

## 9. What to have open when writing a pitch

1. The published report, to quote from.
2. The summary JSON, to check a number against.
3. This file's §3 caveat, to paste into every message.

## Before any of this is sent

- [ ] The report is published and returns 200 at its canonical URL.
- [ ] The owner has approved the findings, wording, methodology, limitations and
      publication date in writing.
- [ ] Every figure in the pitch has been checked against the live page, not
      against a draft.
- [ ] The caveat in §3 is in the message, not only in the report.
- [ ] Nothing in the message promises, requests or offers a link.
