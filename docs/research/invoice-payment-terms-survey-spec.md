# Survey specification — 2026 Small Business Invoice Payment Terms & Late-Payment Benchmark

**Status:** specification complete · collection **not enabled** · **Date:** 2026-09-20
**Dataset contract version:** `invoice-payment-terms-2026.v1`
**Intended report URL:** `/research/invoice-payment-terms-benchmark-2026`

This document is the single source of truth for the survey instrument. The
machine-readable half of it — field names, allowed values, consent rule — is
implemented in [`lib/research/pipeline.ts`](../../lib/research/pipeline.ts) and
asserted by `tests/unit/research-pipeline.test.ts`. If a question changes here,
it changes there in the same commit, and the contract version is bumped.

No survey has been fielded. No responses exist. Nothing in this repository
contains a real respondent, and the report page cannot render until a validated
export passes the gate described in `docs/research/data-handling.md`.

---

## 1. Purpose and scope

The benchmark answers one narrow question: **what payment terms do very small
businesses put on their invoices, and how long do they actually wait to be
paid?** It exists so that journalists, bookkeeping educators, freelancer
communities and small-business publishers have a citable, methodologically
honest figure to point at.

It is a convenience sample of a self-selected audience. It is **not**
representative of any population, and the words _representative_,
_industry-wide_ and _statistically significant_ must not appear in the report or
in any outreach about it.

The survey supports, and does not duplicate, these existing pages:

- `/tools/invoice-generator`
- `/tools/receipt-generator`
- `/blog/invoice-payment-terms-explained-due-on-receipt-net-7-net-15-and-net-30`
- `/blog/invoice-vs-receipt-what-is-the-difference-and-when-do-you-use-each`

## 2. Design constraints

| Constraint                      | Reason                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ~3 minutes to complete          | 12 controlled-choice questions, no typing                                                                |
| Controlled choice only          | Every answer maps to a documented enum, so validation is total and no free text can carry personal data  |
| No free-text questions in v1    | Open text creates privacy, moderation and quotation-consent risk the benchmark does not need             |
| No email field                  | Out of scope by owner instruction; the dataset contract rejects any column that is not on the list in §5 |
| Region at continent granularity | Finer geography plus small cell sizes is re-identifying                                                  |
| Single mandatory consent        | A row without affirmative consent is rejected, not merely flagged                                        |

## 3. Required introductory disclosure

This text is shown before the first question, in full, without a "read more"
collapse:

> ToolNimbly is collecting anonymous, aggregate information about invoice
> payment terms and payment timing for a public research report. Do not enter
> names, email addresses, client information, invoice contents, account details,
> tax identifiers, or other personal or confidential information. Survey
> responses are submitted for aggregation and are not processed only on your
> device. Participation is voluntary. Results may be published only in
> aggregate, and small groups will be suppressed.

Alongside it, and also before the first question:

1. **Privacy link** — to `/privacy`, which carries the survey-specific
   disclosure described in `docs/research/data-handling.md` §6.
2. **Separation from the tools** — "This survey is separate from ToolNimbly's
   browser tools. The calculators, generators and file tools process what you
   enter on your own device and send nothing anywhere. This survey is the
   exception: your answers are transmitted so they can be counted."
3. **Age statement** — "You must be at least 18 years old to take part."
4. **Consent checkbox** — required, unticked by default, wording in §4.

A participant who does not tick the consent box cannot submit. A row that
somehow arrives without it is rejected by the validator and never counted.

## 4. Consent wording

The checkbox label, which is the text the consent record refers to:

> I am at least 18 years old, I am answering about a business I operate, and I
> agree that my anonymous answers may be published as part of aggregate
> statistics.

Stored as `consent_to_aggregate`, accepted values `yes` / `true` / `1`
(case-insensitive). **Anything else, including blank, rejects the row.**

Before Release B the owner must confirm in writing that every response in the
export was collected under this exact wording. That confirmation is one of the
five real-data gate conditions.

## 5. Questions and field contract

Twelve fields. Field names are stable and machine-readable; they are the column
headers the validator expects. Values are matched case-insensitively after
trimming, but the canonical form is the one listed here.

### 5.1 `respondent_role` — required

Which best describes you?

| Value                                | Label                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| `freelancer_sole_proprietor`         | Freelancer or sole proprietor                               |
| `small_business_owner`               | Small-business owner                                        |
| `bookkeeper_accountant_own_business` | Bookkeeper or accountant answering about their own business |
| `agency_consultancy_operator`        | Agency or consultancy operator                              |
| `other_business_operator`            | Other business operator                                     |

### 5.2 `primary_customer_type` — required

Who do you invoice most often?

| Value               | Label                   |
| ------------------- | ----------------------- |
| `mostly_businesses` | Mostly businesses       |
| `mostly_consumers`  | Mostly consumers        |
| `equal_mix`         | Approximately equal mix |

### 5.3 `region` — required

Which region is your business based in?

| Value               | Label             |
| ------------------- | ----------------- |
| `africa`            | Africa            |
| `asia`              | Asia              |
| `europe`            | Europe            |
| `north_america`     | North America     |
| `south_america`     | South America     |
| `oceania`           | Oceania           |
| `prefer_not_to_say` | Prefer not to say |

**Never collect** city, postal code, street address, GPS coordinates or any
other precise location. Continent is the finest granularity permitted.

### 5.4 `monthly_invoice_volume` — required

How many invoices do you send in a typical month?

| Value          | Label        |
| -------------- | ------------ |
| `1_5`          | 1–5          |
| `6_10`         | 6–10         |
| `11_25`        | 11–25        |
| `26_50`        | 26–50        |
| `more_than_50` | More than 50 |

### 5.5 `usual_payment_terms` — required

What payment terms do you usually put on an invoice?

| Value                | Label              |
| -------------------- | ------------------ |
| `due_on_receipt`     | Due on receipt     |
| `net_7`              | Net 7              |
| `net_15`             | Net 15             |
| `net_30`             | Net 30             |
| `net_45`             | Net 45             |
| `net_60_or_longer`   | Net 60 or longer   |
| `varies_by_customer` | Varies by customer |
| `other_or_custom`    | Other or custom    |

### 5.6 `usual_days_to_payment` — required

How long do you usually wait to actually be paid, from the invoice date?

| Value          | Label             |
| -------------- | ----------------- |
| `0_7`          | 0–7 days          |
| `8_14`         | 8–14 days         |
| `15_30`        | 15–30 days        |
| `31_45`        | 31–45 days        |
| `46_60`        | 46–60 days        |
| `more_than_60` | More than 60 days |
| `not_sure`     | Not sure          |

These are **buckets, not measurements.** The report must not compute a mean or
median "days to payment" from them, and the aggregation code refuses to.

### 5.7 `late_payment_frequency` — required

Roughly how many of your invoices are paid after the due date?

| Value                   | Label                             |
| ----------------------- | --------------------------------- |
| `never_or_almost_never` | Never or almost never             |
| `less_than_a_quarter`   | Less than one quarter of invoices |
| `about_a_quarter`       | About one quarter                 |
| `about_half`            | About half                        |
| `more_than_half`        | More than half                    |
| `not_sure`              | Not sure                          |

### 5.8 `deposit_policy` — required

Do you ask for a deposit before starting work?

| Value            | Label                       |
| ---------------- | --------------------------- |
| `always`         | Always require a deposit    |
| `sometimes`      | Sometimes require a deposit |
| `never`          | Never require a deposit     |
| `not_applicable` | Not applicable              |

### 5.9 `late_fee_policy` — required

How do you handle late fees?

| Value                  | Label                                   |
| ---------------------- | --------------------------------------- |
| `state_and_enforce`    | State and enforce late fees             |
| `state_rarely_enforce` | State late fees but rarely enforce them |
| `do_not_state`         | Do not state late fees                  |
| `varies_by_customer`   | Varies by customer                      |

### 5.10 `reminder_timing` — required

When do you usually send a payment reminder?

| Value                    | Label                               |
| ------------------------ | ----------------------------------- |
| `before_due_date`        | Before the due date                 |
| `on_due_date`            | On the due date                     |
| `1_7_days_after`         | 1–7 days after the due date         |
| `more_than_7_days_after` | More than 7 days after the due date |
| `no_consistent_process`  | No consistent reminder process      |

### 5.11 `invoice_creation_method` — required

How do you usually create an invoice?

| Value                     | Label                            |
| ------------------------- | -------------------------------- |
| `accounting_software`     | Accounting or invoicing software |
| `online_generator`        | Online invoice generator         |
| `spreadsheet_or_template` | Spreadsheet or document template |
| `manual`                  | Manually written                 |
| `other`                   | Other                            |

### 5.12 `consent_to_aggregate` — required, affirmative

See §4. Required affirmative response; no row without it is ever counted.

## 6. Optional export-only columns

These are produced by the collection tool, not asked of the participant. Both
are optional; if present they must validate.

| Column         | Type                                      | Purpose                                                                                              |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `response_id`  | opaque string, ≤64 chars, `[A-Za-z0-9_-]` | De-duplication only. Must not encode anything about the respondent. Duplicates reject the later row. |
| `submitted_at` | ISO 8601 date or datetime                 | Establishes fieldwork start and end dates. Only the **date** reaches any published output.           |

Any other column in the export is a validation failure for the whole file, not a
warning. That rule exists specifically so an export that accidentally includes
an email address, an IP address or a free-text comment cannot be processed by
mistake.

## 7. Explicitly not collected

Name · email address · telephone number · client or customer name · invoice
contents or amounts · revenue or turnover · bank or account details · tax
identifiers · IP address · precise location · browser fingerprint · marketing
opt-in · any free text.

## 8. Question order as presented

Disclosure → consent → `respondent_role` → `primary_customer_type` → `region` →
`monthly_invoice_volume` → `usual_payment_terms` → `usual_days_to_payment` →
`late_payment_frequency` → `deposit_policy` → `late_fee_policy` →
`reminder_timing` → `invoice_creation_method` → submit.

Consent is asked first so that nobody answers questions they have not agreed to
have counted.

## 9. Publication rules the instrument commits to

These are promises made to the participant on the survey page, and each one is
enforced in code:

- **Aggregate only.** No row is ever published, exposed through an API, embedded
  in a page payload or committed to this repository.
- **Small groups suppressed.** Any segmented cell with fewer than 10 respondents
  is withheld, and the report says so where it happens. Because the report also
  publishes the overall distribution of every question, suppression runs across
  both rows and columns until no line has a single withheld figure that could be
  recovered by subtraction; a table that cannot meet that is withheld in full.
- **Minimum sample.** Nothing publishes below 100 valid responses. 150+ is the
  preferred target. 100 is a publication floor, not a claim of
  representativeness.
- **No invented numbers.** The report route returns a real 404 in production
  until a validated dataset and written owner approval both exist.

## 10. Recruitment

How participants are found is not part of the instrument, but it is part of the
report: the methodology prints it, and the limitations change if people were
paid. It is recorded in `FIELDWORK_RECORD` (`lib/research/pipeline.ts`) before
publication, and publication is blocked until it is. See
`docs/research/data-handling.md` §6a.

The current plan is a paid panel, which means the report will state that
respondents were compensated and will carry the corresponding limitation. It
will not describe participation as unpaid.

## 11. Open owner decisions

1. **Collection method.** Neither an approved external survey provider nor a
   first-party collection backend exists in this repository today. See
   `docs/research/data-handling.md` §2 for the two options and what each one
   requires.
2. **Fieldwork window.** Not scheduled.
3. **Indexing of the survey landing page.** Defaults to `noindex, follow`
   during collection; indexing needs explicit approval.
