# ADR 0010 — The research benchmark, and the gates that keep it unpublished

**Status:** accepted · **Date:** 2026-09-20

## Context

The SEO brief asks for an original-data research asset — a benchmark of the
payment terms small businesses put on invoices and how long they wait to be
paid — at `/research/invoice-payment-terms-benchmark-2026`, as something
journalists and bookkeeping educators could cite.

Nothing about that is unusual. What is unusual is the failure mode. Every other
page on this site can be written from knowledge we have; a research report can
only be written from data we do not have. The tempting shortcuts — a "coming
soon" page on the canonical URL, sample figures marked as placeholders,
industry statistics borrowed from elsewhere and rounded — all produce something
that looks finished, and all of them are the same mistake: a page that says a
number nobody counted. A cited wrong number cannot be recalled.

Three things had to be decided: where the analysis code lives given it has three
very different callers, what stands between a build and publication, and how the
report stays honest once it does publish.

## Decision

**1. One alias-free pipeline module, because Node has to load it too.**

`lib/research/pipeline.ts` holds the field contract, the CSV reader, the
validator and the aggregator in a single file that imports nothing but `zod`.

It has four callers: Vitest, the report page (via `@/lib/research/pipeline`),
and the two scripts under `scripts/research/`. The scripts are the constraint. The
owner needs to run validation and aggregation over a private CSV from a
terminal, without a build step, and Node's type stripping can load a `.ts` file
only through an explicit `.ts` specifier — it resolves neither `@/` aliases nor
extensionless relative imports. TypeScript, meanwhile, rejects `.ts` specifiers
unless `allowImportingTsExtensions` is turned on repo-wide.

Splitting the pipeline across files would have forced that tsconfig change on
the whole project for the benefit of one script. Keeping it in one file costs
nothing and keeps the script a plain `.mjs` alongside the two that already
exist. The module does no file I/O at all, which also makes it trivially
testable: reading and writing belong to its callers.

The publication gate lives there too, for the same reason:
`scripts/research/publish-benchmark.mjs` has to run exactly the same check the
route runs before it copies anything into `public/`, and it can only load that
one module. `publication.ts` re-exports the gate and adds the route constants;
`report.ts` is `server-only` and reads the summary from disk. Neither is ever
loaded by Node, so both import normally.

**2. Publication needs four independent things, and any one missing is a 404.**

The route publishes only when all of these hold:

- a validated aggregate summary exists on disk, matching the current contract
  version, with at least 100 valid responses and real fieldwork dates;
- `BENCHMARK_REVIEWED_ON` in `lib/research/pipeline.ts` names a date a person
  actually read the finished report;
- `NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED` is on;
- and the summary parses against a strict schema that rejects any unexpected
  key and an arithmetic audit that rejects figures which do not add up.

Data without approval does not publish. Approval without data does not publish.
The review date is a checked-in constant rather than an environment variable
precisely because it is an editorial fact about the text in this repository: it
should move in a commit, next to whatever was reviewed.

When anything is outstanding, **production returns a real 404** and the route
stays out of the sitemap. Off production it renders a page headed
"Preview — not published" that lists what is missing, with no figure of any
kind. There is no "coming soon" state on the canonical URL, because that URL
being crawled and cited before the research exists is the one outcome that
cannot be undone.

The sitemap asks the same gate the route does, so the two cannot disagree.

**3. Aggregates only, and suppression that survives subtraction.**

The page renders from `data/research/aggregates/*-summary.json` and nothing
else. Raw rows are excluded from Git, never imported by a component, never
served from `public/`, and never printed by the validator — which reports
rejections by reason and column name and deliberately does not record the
offending value, since a value that fails validation is the one most likely to
contain something a participant should not have typed.

Segment cells below ten respondents are withheld — and then more are, because a
cross-tabulation is never published alone. The report also publishes the
distribution of the measure across the whole sample and the distribution of the
segment field, which are every column total and every row total. That hands a
reader one equation per row and one per column, and any line with a single
withheld figure gives it up to subtraction. Solving one cell can leave another
line with a single unknown, so the leak propagates.

Suppression therefore runs to a fixpoint in **both** directions, until no row
and no column has exactly one withheld cell. The aggregator then runs the attack
against its own output; if anything is still derivable the whole table is
withheld rather than published with a hole in it. The same check runs again
inside `parseBenchmarkSummary`, so a summary that leaks cannot be rendered
whatever produced it, and `tests/unit/research-pipeline.test.ts` carries the
attack written independently from the reader's side — including a case proving
the attack recovers a cell from row-only suppression, so the test is not
vacuous.

This models first-order propagation, which is the attack the published
marginals actually enable. It is not a full linear-programming attack that
narrows a cell to a range using non-negativity across many lines; that
machinery is not warranted here, and the code says so rather than implying
more.

**4. Shape validation is not integrity validation.**

`benchmarkSummarySchema` proves a summary has the right keys and types. It
cannot see that a base of 999 sits beside a sample of 124, that a percentage
does not match its own count, or that a withheld cell is derivable anyway — all
of which are well-formed JSON. `summaryIntegrityProblems` is the arithmetic
audit: bases against the sample size, counts against bases, percentages against
counts, options against the field contract, segment totals, suppression tallies,
fieldwork dates as real days in the right order, and the disclosure check above.
It runs on every parse, so a stale, hand-edited or substituted summary throws
instead of rendering, and the publication gate runs it again before the owner
can flip a flag.

**5. Generating aggregates is not publishing them.**

`pnpm research:build` writes only into `data/research/aggregates/`, which is not
served, and it is structurally incapable of putting a file on the web.
`pnpm research:publish` is the only thing that copies the CSV into `public/`,
and it runs the same `publicationBlockers` the route and the sitemap run.

They are separate commands because they are separate decisions. A CSV sitting at
a public URL while the report it belongs to still returns 404 can be crawled,
cached and cited — the same failure the 404 exists to prevent, arriving through
a file rather than a page. When the gate closes again, the publish command
removes the file it previously wrote.

The publish command does not copy the stored CSV either. The summary is what
passed the schema, the arithmetic audit and the disclosure check; the CSV beside
it is a rendering that nothing re-checks, so a file edited by hand, merged badly
or contaminated with response-level rows would go straight to a public URL. The
published bytes are regenerated from the summary with `aggregateCsvRows`, and
the stored copy is rewritten from the same source so the repository cannot hold
two files that disagree about what the research found.

**5a. Recruitment is recorded, not assumed.**

The report used to say participation was "voluntary and unpaid". Nothing in an
export of anonymous answers establishes that, and with a paid panel it is false.
`FIELDWORK_RECORD` now carries a sentence naming the recruitment channel, which
the methodology prints verbatim, and a flag for whether people were compensated,
which adds a limitation about the selection effect of paying them. A missing
record blocks publication, and the flag is cross-checked against
`PROVIDER_ASSURANCE.participationIsUnpaid` so the survey page and the report
cannot contradict each other about the same fieldwork.

**6. The findings are computed, not written.**

`lib/research/findings.ts` assembles the summary bullets and the meta
description from counts in the summary. Grouped shares only ever add documented
buckets together. No mean or median is derived from `usual_days_to_payment`,
because that question offered ranges and nobody was asked for a number of days.

A hand-written summary is exactly where an unsupported claim gets in. Deriving
it means the sentence cannot exist before the data does, and tests assert that
every finding names its denominator and uses no causal or representativeness
language.

**7. Charts are HTML, and the table is the real artefact.**

`components/research/distribution-figure.tsx` draws bars as server-rendered
`div`s sized by percentage width, `aria-hidden`, with the same numbers in a
semantic table immediately below — the same reasoning as
`components/charts/growth-chart.tsx`. No chart library was added; none was
needed for a bar chart of eight categories, and a canvas would have made the
report useless without JavaScript.

Colour carries no meaning: every bar is the same accent and the category comes
from its text label. Cross-tabulations get a table and no chart at all, because
a withheld cell drawn as a missing bar reads as zero.

**8. Configuration is not verification.**

Neither an approved survey provider nor a first-party collection backend exists
in this repository. Picking a vendor, creating an account or deploying a
database is an owner decision with contractual and privacy consequences, so this
work ships the configuration interface and stops.

But configuration alone must not turn the pages on, because of what the pages
say. "Your IP address is not stored alongside your answers", "nothing is
recorded until you submit", "quote the identifier on the confirmation screen and
we will delete your response", "participation is unpaid" — every one is a claim
about a third party's software or about how people were recruited, and a
hostname establishes none of them.

So `PROVIDER_ASSURANCE` in `lib/research/survey.ts` records each fact
individually, with the date someone checked it, and each sentence renders only
if its own flag is true. Two of the facts are fatal rather than claim-level: a
provider that keeps IP addresses beside responses cannot be used at all, because
not collecting them is a promise the instrument makes, and an export that does
not match the column contract cannot be validated. An unverified claim is absent
from the page, not hedged — a qualified promise is still a promise.

The privacy page's survey disclosure is gated on the same object, so the page
can never describe collection that is not happening, nor stay silent about
collection that is, nor promise behaviour nobody confirmed.

## Consequences

- The report is code-complete and cannot publish. That is the intended state,
  and `pnpm test` asserts it: `BENCHMARK_REVIEWED_ON` is null and the gate is
  shut.
- Publishing is a reviewable commit — aggregates, a review date, a flag — not a
  deploy-time toggle.
- Two-way suppression is expensive at this sample size. On a 124-response
  rehearsal, 4 of 40 cells survived in one cross-tab and 3 of 48 in the other.
  That is the honest cost of publishing the marginals, and it raises the value
  of reaching 150+ responses considerably. If the real sample lands near the
  floor, collapsing the eight payment terms into four broader groups for the
  cross-tabs only — a documented analytic choice, not a change to the data —
  would put far more cells above the threshold; it is not implemented, because
  there is no data yet to know whether it is needed.
- One 600-line pipeline module is larger than this codebase's average. The
  alternative was a repo-wide tsconfig change to serve one script, and the
  module has a single job.
- Blog links from the report render only when `NEXT_PUBLIC_BLOG_ENABLED` is on,
  since `/blog/*` is not built otherwise. The two post slugs live in
  `lib/registry/blog-posts.ts` so the link-integrity test can check them.
