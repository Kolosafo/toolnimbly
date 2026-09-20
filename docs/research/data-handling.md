# Research data handling — collection, storage, retention and deletion

**Status:** collection **not enabled** · **Date:** 2026-09-20
Applies to: the 2026 Small Business Invoice Payment Terms & Late-Payment
Benchmark, dataset contract `invoice-payment-terms-2026.v1`.

Read this together with
[`invoice-payment-terms-survey-spec.md`](./invoice-payment-terms-survey-spec.md),
which defines the instrument, and
[`../adr/0010-research-benchmark-data-pipeline.md`](../adr/0010-research-benchmark-data-pipeline.md),
which explains why the pipeline is shaped the way it is.

---

## 1. Current state

No survey has been fielded. There is no response store, no survey provider
account, no database, no form endpoint and no collected data. `lib/config/features.ts`
carries the configuration interface for a future approved method, and every
research flag is **off by default**:

| Flag                                       | Default | Effect when off                                                                                           |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED`      | `false` | `/research/invoice-payment-terms-survey` returns a real 404; no survey disclosure is added to `/privacy`  |
| `NEXT_PUBLIC_RESEARCH_SURVEY_URL`          | empty   | With it empty the survey route 404s even when the flag is on, so a broken or placeholder link cannot ship |
| `NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER`     | empty   | Provider name shown to the participant before they leave the site                                         |
| `NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED` | `false` | `/research/*` benchmark and index return a real 404 in production; both stay out of the sitemap           |

Those three survey variables are necessary and **not sufficient**. The survey
route also requires `PROVIDER_ASSURANCE` in `lib/research/survey.ts`, which is
`null` until somebody has actually checked the provider against §2.1 below.
Configuration cannot substitute for verification: the pages make claims about
how the provider behaves, and a hostname does not establish any of them.

## 2. The collection decision the owner still has to make

Section 3 of the task brief has three branches. This repository is in the third:
**neither collection method exists.** No vendor has been chosen, no account has
been created, and no database has been deployed — deliberately, because none of
those are Claude's to decide. The two viable options:

### Option A — approved external survey provider

The participant is sent to a provider-hosted form from a labelled landing page.

- Set `NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER` to the provider's name and
  `NEXT_PUBLIC_RESEARCH_SURVEY_URL` to the form URL, then turn
  `NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED` on. The landing page names the provider
  before the visitor leaves.
- The form must be built to §5 of the survey spec, with the §3 disclosure and
  the §4 consent wording shown before the first question.
- Do not embed the provider's widget. The site's CSP is `frame-src 'none'` and
  `connect-src 'self'`; a plain outbound link is both sufficient and honest
  about where the data goes.
- No provider secret, API key or token goes into client-side code or into any
  `NEXT_PUBLIC_*` variable.
- The provider becomes a processor of the response data. That relationship, and
  the provider's own retention behaviour, needs owner review before launch.

#### 2.1 The provider checklist

Record the answers in `PROVIDER_ASSURANCE` (`lib/research/survey.ts`) with the
date they were checked. Two of these are **fatal** — the survey cannot go live
without them — and the rest decide which sentences the pages are allowed to
print.

| Item                                                                | Field                           | If false                                                                                                              |
| ------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| The provider does not retain a request IP alongside a response      | `storesNoIpWithResponses`       | **Fatal.** Not collecting IP addresses is a promise the instrument makes                                              |
| The export carries exactly the documented columns                   | `exportMatchesContract`         | **Fatal.** Responses could not be validated                                                                           |
| Partial answers are discarded; nothing is kept until submit         | `recordsNothingBeforeSubmit`    | The "close the form and nothing is recorded" sentence is not printed                                                  |
| The confirmation screen shows an identifier a participant can quote | `showsResponseIdOnConfirmation` | Both pages say a submitted response cannot be located again, instead of offering a deletion route that would not work |
| Nobody is paid, credited or entered into a draw                     | `participationIsUnpaid`         | The word "unpaid" is dropped; "voluntary" stays                                                                       |
| Days the raw export is kept after the report publishes              | `rawRetentionDays`              | Must be set; the privacy page prints it                                                                               |
| Days the raw export is kept if the report never publishes           | `unpublishedRawRetentionDays`   | Must be set; see §5                                                                                                   |

An unverified claim is removed from the page, not softened. A hedged promise is
still a promise.

### Option B — first-party collection backend

A `POST` endpoint on this origin, writing to an access-controlled store.

Nothing of the sort exists yet, and building it is a larger decision than this
task carries authority for. If it is approved, it must meet all of the
following before it accepts a single response:

- Server-side validation of **every** field against the same enums the
  validator uses; unexpected fields and unexpected payload shapes rejected.
- Rate limiting and bot protection. The repository has neither today, so this
  means adding infrastructure, which is itself an owner decision.
- **No response body is ever logged.** No request IP address is stored with a
  response. A collection timestamp is stored only because fieldwork dates need
  it.
- The store is access-controlled and is not this Git repository.
- Deletion and retention behaviour per §5 below, implemented, not just
  documented.

## 3. Private files never enter Git

`.gitignore` excludes, under `data/research/`:

```
data/research/private/
data/research/**/*.private.csv
data/research/**/*.private.json
```

The expected private input is `data/research/private/invoice-payment-terms-responses.private.csv`.

Two independent safeguards back the ignore rule up:

1. `tests/unit/research-pipeline.test.ts` fails if any tracked file in the
   repository matches a private-data path or carries a response-level column
   layout.
2. The report page reads only the generated **aggregate** summary. Raw rows are
   never imported into a component, never serialised into a page payload and
   never served from `public/`.

## 4. Running the pipeline

```bash
pnpm research:validate   # validate only, prints the validation report
pnpm research:build      # validate, then write the aggregate outputs
pnpm research:publish    # copy the aggregate CSV into public/, if the gate allows
```

Both read `data/research/private/invoice-payment-terms-responses.private.csv`
unless `--input` says otherwise. `pnpm research:build` writes:

- `data/research/aggregates/invoice-payment-terms-benchmark-2026-summary.json`
  — the file the report page renders from.
- `data/research/aggregates/invoice-payment-terms-benchmark-2026-aggregates.csv`
  — the download, once it is published.

Neither is served. **`pnpm research:build` cannot put a file on the web**, which
is deliberate: producing aggregates is an analysis step and serving them is a
publication decision. `pnpm research:publish` is the only thing that puts the
CSV in `public/research/`, and it runs the same `publicationBlockers` the route
and the sitemap run, so all three agree. It does not copy the stored file: the
summary is the artefact that passed validation, so the published bytes are
regenerated from it with `aggregateCsvRows`, and the stored copy is rewritten
from the same source. A CSV edited by hand or merged badly cannot reach a public
URL, and the repository cannot end up holding two files that disagree. If the gate is shut it removes
any CSV a previous run left behind, because a live download beside a 404 report
is the exact failure it exists to prevent. `pnpm research:publish --check`
reports the gate without writing anything.

The validation report prints totals, rejection **reasons** and per-field missing
counts. It never prints a complete response row, and it never prints a value
from a rejected row — only the field name and the reason. That is a hard rule in
the pipeline, not a convention, and it is covered by a test.

## 5. Retention and deletion

| Item                         | Retention                                                                                                                   | Where                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Raw export (`*.private.csv`) | `rawRetentionDays` after the report publishes, **or** `unpublishedRawRetentionDays` after fieldwork closes if it never does | Owner's access-controlled storage, plus the local ignored `data/research/private/` working copy |
| Aggregate summary and CSV    | Published indefinitely as part of the report                                                                                | Committed; served from `public/research/`                                                       |
| Validation reports           | Kept only for the current fieldwork cycle, then deleted                                                                     | Local, ignored                                                                                  |

**Deletion requests.** A participant who wants their response removed emails the
site contact address given on `/privacy` with enough information to locate the
row — in practice, the `response_id` shown on the survey's confirmation screen.
Because responses carry no identifier of any kind, a request without that ID
cannot be matched to a row, and the survey page must say so plainly rather than
promising a lookup that is impossible.

Procedure on a valid request:

1. Remove the row from the raw export in the access-controlled store.
2. Re-run `pnpm research:build`.
3. Re-publish the regenerated summary and CSV, and update the report's
   `dateModified` and its "last reviewed" line.
4. If removal takes the valid count below 100, the report is unpublished until
   the count is restored.

After the raw export is deleted at the end of the retention window, no deletion
request can be honoured because nothing identifiable remains. The survey page
states this before a participant submits.

**The report never publishing is not a reason to keep the data.** If fieldwork
misses the 100-response floor, or the owner shelves the report, the raw export
is deleted `unpublishedRawRetentionDays` after the survey closes. Both deadlines
are recorded in `PROVIDER_ASSURANCE` and printed on `/privacy`, so the retention
the page promises and the retention actually practised are the same number.

## 6. Privacy copy

`/privacy` currently promises that tool input is processed on the device and is
never transmitted. That promise is true of every calculator, generator and file
tool, and it stays exactly as it is.

A survey is different: responses have to be sent somewhere to be counted. The
privacy page therefore carries a **survey-specific section that renders only
while `NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED` is on**, so the page can never
describe collection that is not happening, nor stay silent about collection that
is. The section states what is collected, what is not, where it is processed,
how long it is kept, what it is used for, and how to ask for deletion.

The owner must review that wording before collection begins. None of this is
legal advice.

## 6a. The fieldwork record

An export of anonymous answers cannot say how the people in it were found, and
that difference changes both what the sample is and what the report may claim. A
convenience sample from a newsletter and a paid panel are not the same thing.

So `FIELDWORK_RECORD` in `lib/research/pipeline.ts` records it, by hand, before
publication — and `null` blocks the report exactly as a missing review date
does:

```ts
export const FIELDWORK_RECORD: FieldworkRecord | null = {
  recordedOn: '2026-08-03',
  recruitment:
    'Participants were recruited through the Prolific panel and compensated ' +
    'for completing the survey.',
  participantsWereCompensated: true,
};
```

`recruitment` is printed verbatim in the report's methodology, so write it as a
sentence a reader will see, naming the channel. `participantsWereCompensated`
must agree with it; it also adds a limitation to the report saying that paying
people is its own selection effect, and it is cross-checked against
`PROVIDER_ASSURANCE.participationIsUnpaid` so the survey page and the report
cannot say opposite things about the same fieldwork.

The report no longer claims participation was unpaid. It never could have known
that, and with a paid panel it would have been false.

## 7. The real-data gate

Release B — the public report — may not ship until **all five** are true:

1. An approved survey provider or approved first-party backend exists.
2. The real anonymized export is available and passes validation.
3. The owner confirms in writing that responses were collected under the
   consent language in survey spec §4.
4. At least **100 valid responses** survive validation (150+ preferred).
5. The owner approves the aggregate findings, the wording, the methodology, the
   limitations and the publication date.

Plus two records that have to be written before the gate opens:
`BENCHMARK_REVIEWED_ON` (the date a person read the finished report) and
`FIELDWORK_RECORD` (§6a), both in `lib/research/pipeline.ts`.

Until then the report route returns a real 404 in production, stays out of the
sitemap, and renders no number of any kind. Stopping here is the intended
behaviour; filling the gap with simulated data or with generic market statistics
is not.
