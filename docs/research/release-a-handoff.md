# Release A handoff — invoice payment terms benchmark

**Date:** 2026-09-20 · **Release A: complete. Release B: blocked, correctly.**
**Revised 2026-09-20** after two review rounds — see §13 for the eight defects
found and fixed.

Release A builds the survey specification, the data contract, the validation and
aggregation pipeline, the private preview and the publication controls. Release B
— the public report — cannot proceed, because no survey has been fielded and no
responses exist. That is the expected outcome, not a shortfall.

---

## 1. Repository and branch

- Repository: `/Users/daudakolo/Documents/toolNimbly`
- Branch: `research/invoice-payment-terms-benchmark`, created from
  `seo/embed-guides-and-technical-foundation`
- Nothing is committed. The work is in the working tree for review. The tree was
  clean before this task and no unrelated change was touched.

## 2. Files changed

**Modified (12)**

| File                                         | Change                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| `lib/config/features.ts`                     | Four research flags, all off                                  |
| `lib/seo/metadata.ts`                        | `followWhenNoIndexed` option, for `noindex, follow`           |
| `lib/seo/structured-data.ts`                 | `datasetSchema()`                                             |
| `components/seo/tool-social-image.tsx`       | Extracted `renderSocialImage()` so the report reuses the card |
| `components/tool-shell/tool-page-layout.tsx` | Renders `BenchmarkCallout`, which is null until publication   |
| `app/sitemap.ts`                             | Research routes enter the sitemap only when the gate opens    |
| `app/(site)/(marketing)/privacy/page.tsx`    | Survey disclosure, gated on collection actually being enabled |
| `.gitignore`                                 | Raw exports excluded                                          |
| `.env.example`                               | The four research variables documented                        |
| `package.json`                               | `research:validate`, `research:build`, `research:publish`     |
| `tests/unit/internal-links.test.ts`          | Knows the research routes and the two CMS post paths          |
| `README.md`                                  | Commands, a Research section, documentation pointers          |

**New (25)**

- Routes: `app/(site)/research/page.tsx`,
  `.../invoice-payment-terms-benchmark-2026/page.tsx`,
  `.../invoice-payment-terms-benchmark-2026/social-image/route.ts`,
  `.../invoice-payment-terms-survey/page.tsx`
- Library: `lib/research/{pipeline,publication,report,findings,survey}.ts`,
  `lib/registry/blog-posts.ts`
- Components: `components/research/{distribution-figure,cross-tab-table,benchmark-callout}.tsx`
- Scripts: `scripts/research/{build-benchmark,publish-benchmark}.mjs`
- Docs: `docs/research/{invoice-payment-terms-survey-spec,data-handling,outreach-package,release-a-handoff}.md`,
  `docs/adr/0010-research-benchmark-data-pipeline.md`, `data/research/README.md`
- Tests and fixtures: `tests/unit/research-{pipeline,publication,survey}.test.ts`,
  `tests/component/research-figures.test.tsx`, `tests/e2e/research.spec.ts`,
  `tests/fixtures/research/{README.md,generate-synthetic-responses.mjs,synthetic-responses.csv}`

## 3. Collection method: still an owner decision

**Neither branch of the brief applies. There is no approved survey provider and
no first-party collection backend in this repository.** Verified by inspection:
no vendor SDK, no form endpoint, no database, no queue, no rate limiter, no bot
protection, and no related environment variable in `.env.example` or
`.env.production`. The site's CSP is `connect-src 'self'`, `form-action 'self'`,
`frame-src 'none'`, so an embedded third-party form would not work even if one
were configured.

Nothing was chosen, no account was created and nothing was deployed. What
shipped is the configuration interface:

| Variable                                   | Default |
| ------------------------------------------ | ------- |
| `NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED`      | `false` |
| `NEXT_PUBLIC_RESEARCH_SURVEY_URL`          | empty   |
| `NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER`     | empty   |
| `NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED` | `false` |

All three survey values are required together — and they are still not enough.
The survey route also requires `PROVIDER_ASSURANCE` in `lib/research/survey.ts`,
which is `null` until somebody has checked the provider against the checklist in
`docs/research/data-handling.md` §2.1. Configuration cannot substitute for
verification, because the pages make claims about how the provider behaves.

## 4. Survey specification

`docs/research/invoice-payment-terms-survey-spec.md`, dataset contract
`invoice-payment-terms-2026.v1`.

Twelve controlled-choice questions and nothing else — no free text in v1, no
email field. The required introductory disclosure is reproduced verbatim,
alongside the privacy link, the statement that the survey is separate from the
locally-processed tools, the 18+ requirement, and required consent wording.
Region is collected at continent level only.

The machine-readable half of the spec is implemented in
`lib/research/pipeline.ts` and asserted by `tests/unit/research-pipeline.test.ts`,
so the document and the validator cannot drift.

## 5. Private-data storage and exclusion

- Expected private input:
  `data/research/private/invoice-payment-terms-responses.private.csv`
- `.gitignore` excludes `/data/research/private/`,
  `data/research/**/*.private.csv`, `data/research/**/*.private.json` and
  `/data/research/validation-reports/`
- A test fails the build if any tracked file matches a private-data path, and
  another asserts no tracked file under `data/` or `public/` carries a
  response-level column layout
- The report page reads only the aggregate summary, through a `server-only`
  module, parsed by a strict schema that rejects any unexpected key
- The validation report prints counts, reason codes and column names, and never
  a cell value or a response ID — asserted by test, including for rejected rows
- Retention and the deletion procedure are in `docs/research/data-handling.md` §5

The checked-in fixture `tests/fixtures/research/synthetic-responses.csv` is 124
machine-generated rows, labelled synthetic in its own README and in the seeded
generator beside it. It is never an input to `pnpm research:build`, and a test
asserts nothing synthetic reaches `data/` or `public/`.

## 6. Validation and aggregation

```bash
pnpm research:validate   # validate only
pnpm research:build      # validate, then write the aggregates (not served)
pnpm research:publish    # copy the CSV into public/, if the gate allows
```

**Validation** accepts only the documented columns; any other column rejects the
whole file, because the likeliest extra column is an email address or a comment.
It rejects rows without affirmative consent, with a blank required answer, with
a value outside the enum, with a malformed or duplicate response ID, with an
unparseable timestamp, or with the wrong field count. The report gives totals,
rejections by reason and column, per-field blank counts, and whether the
100-response floor is met.

**Aggregation** produces counts and shares only: eleven distributions plus two
cross-tabulations (payment terms by role; late payment by terms). Rules enforced
in code and covered by tests:

- Segment cells below 10 respondents are withheld, as are segments below 10 in
  total. Suppression then runs to a fixpoint across **both rows and columns**,
  because the report publishes the marginals too; a table that still leaks is
  withheld in full.
- No mean or median from a bucketed answer. `usual_days_to_payment` offered
  ranges; nobody was asked for a number of days.
- "Not sure", "Other" and "Prefer not to say" stay in the denominator and are
  labelled, rather than being dropped.
- Percentages are rounded to one decimal, half away from zero, calculated
  independently; the page states that a column may total 99.9% or 100.1%.

`pnpm research:build` writes the summary JSON and the aggregate CSV to
`data/research/aggregates/`, which is not served, and is structurally incapable
of putting a file on the web. `pnpm research:publish` is the only thing that
copies the CSV into `public/research/`, and it runs the same
`publicationBlockers` the route and the sitemap run — removing a stale published
file if the gate has closed again.

**Every parse of a summary also runs an arithmetic audit**
(`summaryIntegrityProblems`): bases against the sample size, counts against
bases, percentages against counts, options against the field contract, segment
totals, suppression tallies, fieldwork dates as real days in the right order,
and a reconstruction check against the published marginals. A summary that does
not add up throws instead of rendering.

## 7. Preview route and indexing

`/research/invoice-payment-terms-benchmark-2026`, `/research` and
`/research/invoice-payment-terms-survey` all **return HTTP 404 in a production
build** today. Verified against a real build (`.meta` status 404) and by
Playwright against `pnpm start`.

Off production the report renders a page headed **"Preview — not published"**
listing the outstanding blockers, with `noindex, nofollow`, no figure of any
kind, and no synthetic data. Verified by building with
`NEXT_PUBLIC_VERCEL_ENV=preview` and reading the generated HTML.

The sitemap asks the same gate the route does, so the two cannot disagree. The
current production sitemap has 52 URLs and no research entry. The survey landing
page is never listed, and uses `noindex, follow` when live.

The published path was also verified end to end in a throwaway build fed by the
synthetic fixture, then fully reverted: exactly one `<h1>`, exactly one
`BreadcrumbList`, one `Dataset`, zero `FAQPage`, a self-referencing canonical,
`index, follow`, a 1200×630 OG image with alt text, and 13 accessible tables. No
synthetic artefact remains — `data/` contains only its README and `public/` only
`icon.svg`.

## 8. Privacy copy

The local-processing claims are untouched and remain true: they describe the
calculators, generators and file tools, none of which transmit anything.

A survey-specific section was added to `/privacy` that renders **only when
`surveyCollection()` reports a live, verified provider**. It states what is
collected, what is not, where it is processed, retention, the aggregation
purpose and the deletion route, and two shorter conditional paragraphs qualify
the "your rights" and "children" sections. With collection off, none of it
renders — asserted by an e2e test.

Each individual claim is gated on a specific verified fact in
`PROVIDER_ASSURANCE`: the IP sentence, the "nothing is recorded before you
submit" sentence, the deletion-by-identifier route and the word "unpaid" each
appear only if someone checked and recorded that item. Where a fact is not
verified, the sentence is absent rather than hedged. Retention is printed from
the recorded numbers, including a deadline for **raw data when the report never
publishes at all**.

No marketing consent, no mailing list, no cross-product profiling.
**The owner must review this wording before collection begins. None of it is
legal advice.**

## 9. Commands run

| Command                                                                                        | Result                                       |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `pnpm lint`                                                                                    | pass                                         |
| `pnpm typecheck`                                                                               | pass                                         |
| `pnpm test`                                                                                    | **529 passed, 23 files** (up from 429 in 20) |
| `pnpm build`                                                                                   | pass, 94 static pages                        |
| `pnpm exec playwright test tests/e2e/research.spec.ts --project=chromium`                      | **8 passed**                                 |
| `pnpm exec playwright test site/privacy/accessibility/regressions/security --project=chromium` | **63 passed**                                |
| `pnpm verify`                                                                                  | pass                                         |
| `prettier --check` on every file added or changed                                              | pass                                         |

Note: `pnpm format:check` fails repo-wide on 144 files, which is pre-existing —
`README.md` was the only file this task made non-conforming and it was
reformatted. `tests/unit/internal-links.test.ts` was already non-conforming and
was left as found apart from the lines added.

New coverage: data-contract validation, consent enforcement, unexpected-column
rejection, duplicate IDs, minimum sample gating, every aggregation and all
suppression rules, prevention of raw-response publication, preview `noindex`,
sitemap exclusion before and inclusion after publication, one self-referencing
canonical, exactly one H1, exactly one `BreadcrumbList`, `Dataset` accuracy,
accessible table alternatives for every chart, internal-link destinations, and
social metadata with 1200×630 dimensions — plus, from the review: calendar-date
rejection, an independently written reconstruction attack on both cross-tabs
(with a case proving the attack has teeth), nine summary-integrity tamper cases,
the publish gate, and eighteen provider-assurance cases.

## 10. Is Release A complete?

**Yes.** Specification, data contract, validation, aggregation, private preview,
publication controls, privacy gating, sitemap gating, documentation and tests are
all in place, and no invented finding is exposed anywhere.

## 11. What is blocking Release B

All five gate conditions are outstanding:

1. **An approved collection method.** No survey provider and no first-party
   backend exists. This is a decision only the owner can make; see
   `docs/research/data-handling.md` §2.
2. **A real anonymized export.** None exists. No survey has been fielded.
3. **Written confirmation** that responses were collected under the consent
   wording in survey spec §4.
4. **At least 100 valid responses** after validation (150+ preferred).
5. **Owner approval** of the aggregate findings, wording, methodology,
   limitations and publication date.

Two additional mechanical steps at publication time:

- Set `BENCHMARK_REVIEWED_ON` in `lib/research/publication.ts` to the date a
  person actually reviewed the finished report. It is `null` today and null
  blocks publication.
- Set `NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED=true` **after** that approval.

One thing to know before Release B, and it got sharper after the review:
two-way suppression is expensive. On a 124-response rehearsal, **4 of 40 cells
survived** in one cross-tab and 3 of 48 in the other. That is the honest cost of
publishing the marginals alongside the tables. Reaching 150+ responses now
matters considerably more than it did. If the real sample lands near the floor,
collapsing the eight payment terms into four broader groups for the cross-tabs
only — a documented analytic choice, not a change to the data — would put far
more cells above the threshold; it is not implemented, because there is no data
yet to know whether it is needed.

Also add `PROVIDER_ASSURANCE` in `lib/research/survey.ts` when a provider is
approved, using the checklist in `docs/research/data-handling.md` §2.1. Note
that a paid panel makes `participationIsUnpaid: false`, which must agree with
`FIELDWORK_RECORD.participantsWereCompensated` — the two records are
cross-checked so the survey page and the report cannot contradict each other.

Also outside this task: the two supporting blog posts are Marble CMS content, so
adding a contextual link from the payment-terms article is a CMS edit, not a code
change. The link from the invoice and receipt generators is already implemented
and appears automatically on publication.

## 12. Nothing was invented

No respondent, response, percentage, average, median, count, date, quote,
finding, trend, provider, credential or token was fabricated at any point.

- Every number rendered by the report comes from
  `data/research/aggregates/`, which is empty.
- The headline findings and the meta description are computed from the summary
  by `lib/research/findings.ts`, so they cannot exist before the data does.
- The only rows in the repository are 124 clearly-labelled synthetic test rows
  that are structurally barred from the published outputs.
- No environment variable was read for its value, printed or changed.
  `NEXT_PUBLIC_JURISDICTION` and `NEXT_PUBLIC_LEGAL_ENTITY` were not touched,
  and no Vercel configuration was altered.
- No outreach was sent, drafted for sending, queued or scheduled. No backlink
  was sought, offered or generated.

No claim is made about rankings or backlinks. Those can only be measured after
publication and outreach.

---

## 13. Review fixes (2026-09-20)

Six defects were found in review and all six are fixed, with tests.

**1. The aggregate CSV bypassed the publication gate.** `research:build` wrote
straight into `public/research/`, so the download could be live while the report
returned 404. The build command now writes only to `data/research/aggregates/`
and cannot put a file on the web at all; `pnpm research:publish` is a separate
command that runs the same `publicationBlockers` the route and the sitemap run,
and removes a stale published file when the gate closes. Verified end to end on
synthetic data, then reverted.

**2. Small-cell suppression was reversible.** It ran within rows only, while the
report also publishes both marginals — so a withheld cell that was the lone
unknown in its _column_ could be recovered by subtraction, and solving one could
unlock another. Suppression now runs to a fixpoint across rows and columns; the
aggregator runs the attack against its own output and withholds the whole table
if anything is still derivable. `tests/unit/research-pipeline.test.ts` carries
the attack written independently from the reader's side, plus a case proving it
recovers a cell from row-only suppression so the test is not vacuous.

**3. The summary validator checked shape, not arithmetic.** A base of 999 beside
a sample of 124 parsed cleanly. `summaryIntegrityProblems` now audits bases,
counts, percentages, labels, section assignment, segment totals, suppression
tallies, fieldwork dates and reconstruction on every parse, and the publication
gate runs it again. Nine tamper cases are tested.

**4. Privacy promises outran the configuration.** Three environment variables
activated claims about IP storage, partial-response recording, deletion
identifiers and unpaid participation — all facts about a third party.
`PROVIDER_ASSURANCE` (`lib/research/survey.ts`) now records each one with the
date it was checked; two are fatal (IP retention, export format) and the rest
gate their own sentence, which is absent rather than hedged when unverified. Raw
data now also has a retention deadline for the case where the report never
publishes.

**5. Unsupported factual claims.** "ToolNimbly's tools are used mostly by people
who invoice for themselves", "impressions of waiting tend to be worse than the
ledger" and "sending the wrong document is a surprisingly common reason a
payment stalls" were all assertions with nothing behind them, as were two lines
in the outreach package. All are now neutral. A test scans every research source
for a list of unsourced phrasings.

**6. Invalid calendar dates passed validation.** `2026-02-31` was accepted, and
in the date-time branch it was silently reported as 3 March. Dates now round-trip
through UTC components, the schema requires `fieldwork.start <= fieldwork.end`,
and a timestamp with no offset is read as UTC rather than the build machine's
local zone.

### Second round

**7. The publish command trusted the stored CSV.** It validated the summary and
then copied a separate file that nothing re-checked, so a CSV edited by hand,
merged badly or contaminated with response-level rows would have gone straight
to a public URL. `pnpm research:publish` now regenerates the published bytes
from the validated summary with `aggregateCsvRows`, rewrites the stored copy
from the same source so the repository cannot hold two files that disagree, and
warns when it finds drift. Verified by tampering with the stored CSV — inserting
a fabricated `9999` figure and a `respondent_row` line — and publishing: neither
reached the published file, and the stored copy was realigned.

**8. The report still claimed participation was unpaid.** The survey and privacy
pages had been made conditional, but the methodology hardcoded "voluntary and
unpaid" — which a paid panel falsifies. `FIELDWORK_RECORD` now carries a
recruitment sentence the methodology prints verbatim and a compensation flag,
publication is blocked until both are recorded, and paying respondents adds a
limitation saying so plainly. Verified: the report renders "Participants were
recruited through the Prolific panel and compensated for completing the survey",
carries the paid-panel limitation, and no longer asserts anyone was unpaid.

Documentation cleanup in the same pass: `data/research/README.md` and the
`publication.ts` header no longer describe the build command copying into
`public/`, and every file this branch touches is Prettier-clean, including the
long line in `tests/unit/internal-links.test.ts`. The repository's wider
formatting debt — 140-odd files that were already non-conforming — was left
alone.
