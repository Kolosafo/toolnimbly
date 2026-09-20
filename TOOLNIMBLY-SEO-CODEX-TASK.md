# ToolNimbly SEO implementation task for Codex

## Mission

Implement the high-confidence, in-app SEO improvements for these existing pages:

- `/tools/invoice-generator`
- `/tools/receipt-generator`
- `/tools/compound-interest-calculator`
- `/tools/salary-calculator`
- `/tools/loan-calculator`

Work from the ToolNimbly repository root. Inspect the existing framework, components, metadata helpers, content models, tests, and conventions before editing. Reuse shared abstractions instead of duplicating page code.

The objective is to align each URL with a distinct search intent, improve trust and source transparency, remove structured-data duplication, strengthen contextual internal links, and preserve the working tools.

## Explicitly out of scope

- Do **not** edit, add, rename, log, or expose `NEXT_PUBLIC_LEGAL_ENTITY` or `NEXT_PUBLIC_JURISDICTION`.
- Do **not** modify Vercel project settings or environment variables. They have already been configured by the owner.
- Do **not** change any of the five existing URLs or add redirects for them.
- Do **not** add country-specific tax, legal-compliance, or take-home-pay calculations.
- Do **not** create pages for counterfeit, fake, or branded-store receipts.
- Do **not** invent an author, reviewer, professional credential, customer count, rating, testimonial, or usage statistic.
- Do **not** add exact-match backlink widgets, hidden links, or forced followed attribution to the embed feature.
- Do **not** change calculator formulas unless a failing test proves a formula bug. Preserve all existing calculation tests.
- Do **not** pad pages with repetitive SEO copy or create near-duplicate keyword pages.

If the public deployment notice still appears after deployment, report it in the handoff but do not change the environment-variable implementation as part of this task.

## Execution order

Complete sections 1–7 in order. Run the verification suite in section 8 before handing off. Do not stop after merely changing metadata.

## 1. Align the privacy page with production analytics

Production currently loads Cloudflare's `static.cloudflareinsights.com/beacon.min.js`, while the privacy page says that no analytics, page-view recording, or third-party analytics script is present.

Update the privacy copy so it accurately describes the production behavior while preserving the important promise that tool inputs and files are processed locally.

Use wording materially equivalent to:

> ## Analytics
>
> ToolNimbly uses Cloudflare Web Analytics to measure aggregate page views and page-performance metrics. Cloudflare supplies a small browser beacon for this purpose. The values you enter into a tool, the contents of files you process, generated passwords, invoice or receipt fields, and calculator inputs are not included in these analytics events.
>
> Cloudflare describes Web Analytics as privacy-first analytics that does not collect or use visitors' personal data. Standard page requests and performance measurements may still be processed by Cloudflare as the site's network and hosting provider. See Cloudflare's Web Analytics documentation for technical details.

Link `Cloudflare's Web Analytics documentation` to:

`https://developers.cloudflare.com/web-analytics/about/`

Implementation requirements:

- Remove statements that say no page views are recorded or no third-party analytics script is loaded.
- Do not weaken the separate claim that uploaded files and entered tool values are not transmitted, provided the code still supports that claim.
- Keep the existing server-log disclosure.
- Do not claim that the site has no cookies unless that has been verified across the application and Cloudflare configuration.
- Do not add new analytics libraries or custom tracking as part of this task.
- Treat this as factual product copy, not legal advice; mention in the handoff that the operator should review the final policy wording.

## 2. Remove duplicate breadcrumb structured data

Every audited tool page currently emits two `BreadcrumbList` objects with inconsistent labels. Locate both emitters and make one component or metadata layer the single source of truth.

Required result for each tool page:

- Exactly one `BreadcrumbList` JSON-LD object.
- Exactly one `WebApplication` object.
- FAQ markup may remain only when every question and answer is visibly present on the page.
- Site-wide `WebSite` and `Organization` data may remain, but must not be duplicated by nested layouts.
- Breadcrumb names and URLs must match the visible breadcrumb.
- JSON-LD must parse as valid JSON and must not contain placeholder values.

Preferred breadcrumb paths:

- Invoice: Home → Business Tools → Invoice Generator
- Receipt: Home → Business Tools → Receipt Generator
- Compound interest: Home → Calculators → Compound Interest Calculator
- Salary: Home → Calculators → Salary to Hourly Calculator
- Loan: Home → Calculators → Loan Calculator with Extra Payments

Add or update automated tests so a regression that produces two `BreadcrumbList` objects fails.

## 3. Apply the keyword-to-page metadata map

Keep all canonical URLs unchanged. Update the HTML title, meta description, Open Graph title/description, Twitter title/description, H1, and opening hero copy as specified below. Keep the tool visible above the long-form explanation.

### Invoice generator

Primary intent: `free invoice generator`

- Title: `Free Invoice Generator — PDF, No Signup | ToolNimbly`
- H1: `Free Invoice Generator`
- Meta description: `Create a professional PDF invoice with line items, tax, discounts and payment terms. Free, no signup, and processed in your browser.`
- Hero copy: `Create a professional PDF invoice with automatic totals, tax, discounts and payment terms. No signup, and your invoice data stays in your browser.`

If the generated PDF has been tested and confirmed to contain no watermark in every template, add `no watermark` naturally to the hero and meta description. Otherwise do not make the claim.

Secondary phrases to cover naturally in visible copy, examples, or FAQs:

- invoice generator PDF
- invoice generator with no signup
- printable invoice maker

### Receipt generator

Primary intent: `free receipt generator`

- Title: `Free Receipt Generator — Payment Receipt PDF | ToolNimbly`
- H1: `Free Receipt Generator`
- Meta description: `Create a printable payment receipt with line items, tax, tips and change, then print or download a PDF. Free, private and no signup.`
- Hero copy: `Create a printable payment receipt for a completed transaction. Add business details, line items, tax, tips and payment information, then print it or download a PDF.`

Secondary phrases to cover naturally:

- payment receipt generator
- business receipt maker
- printable receipt PDF
- cash receipt generator

Keep the existing anti-fraud and jurisdictional disclaimers prominent. Never optimize for `fake receipt`, named retailers, or deceptive use.

### Compound interest calculator

Primary intent: `compound interest calculator with contributions`

- Title: `Compound Interest Calculator with Contributions | ToolNimbly`
- H1: `Compound Interest Calculator with Contributions`
- Meta description: `Calculate compound interest with regular contributions and daily, monthly or annual compounding. See yearly growth and download the results.`
- Hero copy: `Calculate how savings can grow with compound interest and regular weekly, monthly or annual contributions. Compare deposits, interest earned and the projected balance year by year.`

Secondary phrases to cover naturally:

- compound interest calculator with monthly contributions
- savings growth calculator
- daily compound interest calculator

### Salary calculator

Primary intent: `salary to hourly calculator`

- Title: `Salary to Hourly & Hourly to Salary Calculator | ToolNimbly`
- H1: `Salary to Hourly Calculator`
- Meta description: `Convert annual salary to hourly, monthly, weekly, biweekly or daily gross pay—or convert an hourly wage back to annual salary.`
- Hero copy: `Convert annual salary to hourly, monthly, weekly, biweekly or daily gross pay. You can also convert an hourly wage back to annual salary using your actual working hours and paid weeks.`

Secondary phrases to cover naturally:

- hourly to salary calculator
- gross pay calculator
- annual to monthly salary calculator

Make `gross pay before tax and deductions` visible next to the inputs/results, not only in the long-form disclaimer. Do not use `take-home pay calculator`, `paycheck calculator`, or tax-calculator wording.

### Loan calculator

Primary intent: `loan calculator with extra payments`

- Title: `Loan Calculator with Extra Payments & Amortization | ToolNimbly`
- H1: `Loan Calculator with Extra Payments`
- Meta description: `Calculate monthly loan payments, total interest and a full amortization schedule. Add extra payments to compare payoff time and savings.`
- Hero copy: `Calculate monthly loan payments, total interest and a full amortization schedule. Add an extra payment to see how much interest and repayment time it could save.`

Secondary phrases to cover naturally:

- loan payment calculator
- amortization schedule calculator
- loan payoff calculator

### Metadata acceptance criteria

- Metadata must be present in the server-rendered HTML.
- Each page must have exactly one H1.
- Each page must retain a self-referencing canonical.
- Each title and description must be unique.
- Do not add meta-keywords tags.
- Do not repeat the primary keyword unnaturally.
- Update any metadata snapshot or route tests.

## 4. Add visible methodology and authoritative sources

The finance pages currently explain their methods but provide no external source links. Add a small visible `Sources and methodology` subsection near the existing formula/method section. Links should be ordinary contextual links; do not add `nofollow` to trusted citations.

### Compound interest sources

Use these only for claims they actually support:

- Investor.gov compound interest calculator: `https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator`
- Investor.gov compound-interest definition: `https://www.investor.gov/introduction-investing/investing-basics/glossary/compound-interest`

Explain that ToolNimbly performs its own calculation locally and that the external links are references, not endorsements.

### Loan sources

Use this CFPB explanation for amortization mechanics:

- `https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/`

Clearly state that the linked CFPB page discusses mortgages, while the principal-versus-interest amortization mechanism also illustrates the fixed-rate method used by this general calculator. Do not imply CFPB validation of ToolNimbly's results.

### Salary sources and assumptions

The arithmetic does not need decorative citations. Instead:

- Show the formulas clearly.
- State that 40 hours and 52 paid weeks are defaults, not universal rules.
- If mentioning US overtime rules, cite the Department of Labor and label the statement as US-specific: `https://www.dol.gov/agencies/whd/compliance-assistance/handy-reference-guide-flsa`
- Do not turn the global gross-pay converter into a US legal or payroll calculator.

### Invoice and receipt sources

Do not add a single country's tax rules to globally targeted pages. Keep the existing statement that invoice and receipt requirements vary by jurisdiction. A future country-specific guide requires a real target country and authoritative local sources.

### Authorship and review

- Link the method/source areas to the existing About-page section describing calculation testing.
- Keep accurate `last reviewed` dates.
- Do not automatically update review dates on every build or deployment.
- Only render a named `Reviewed by` field if a real reviewer and approved biography already exist in project data.
- It is acceptable to attribute implementation and testing to `ToolNimbly` without inventing an individual.

## 5. Create four supporting guides and contextual links

Create the following genuinely useful guides using the site's existing guide template and visual conventions. Each guide must be original, user-first, country-neutral unless a jurisdiction is explicitly stated, and approximately 700–1,400 useful words. Do not fill space to hit a word count.

### `/guides/what-a-payment-receipt-should-include`

Must include:

- The purpose of a receipt as a record of completed payment.
- Common fields: seller, customer when relevant, date, items/services, amounts, tax, total and payment method.
- Receipt versus invoice distinction.
- Numbering and record-retention caveat.
- A worked example.
- A clear statement that local legal and fiscal-device rules vary.
- A contextual CTA to `/tools/receipt-generator`.

### `/guides/compound-interest-with-contributions`

Must include:

- Principal, rate, time, compounding frequency and contribution timing.
- Beginning-versus-end contribution timing.
- A worked monthly-contribution example.
- Nominal rate versus effective annual return/APY caveat.
- Inflation, fees, tax and market-return limitations.
- Investor.gov citations from section 4.
- A contextual CTA to `/tools/compound-interest-calculator`.

### `/guides/how-to-convert-salary-to-hourly`

Must include:

- Annual-to-hourly and hourly-to-annual formulas.
- A 40-hour/52-week example clearly labeled as an assumption.
- Paid weeks, unpaid leave, part-time hours and daily-rate considerations.
- Biweekly versus semimonthly distinction.
- A clear gross-pay-before-tax disclaimer.
- A contextual CTA to `/tools/salary-calculator`.

### `/guides/how-extra-loan-payments-save-interest`

Must include:

- How fixed-rate amortization divides payment between interest and principal.
- Why reducing principal earlier can reduce later interest.
- A worked example consistent with the calculator's output.
- A warning that lenders may treat extra payments differently or charge penalties.
- CFPB citation from section 4 with appropriate context.
- A contextual CTA to `/tools/loan-calculator`.

### Guide integration requirements

- Add each guide to `/guides` and the XML sitemap.
- Add each guide to the matching tool page's `Read more about this` section.
- Replace the compound-interest page's reliance on the loan-interest guide with the new compound guide as its primary supporting resource.
- Add the receipt guide as the receipt page's primary supporting resource.
- Add the salary guide; that page currently lacks a dedicated supporting guide.
- Keep the existing invoice guide and loan-interest guide where they remain relevant.
- Add contextual cross-links between guides only when they help the reader.
- Do not create separate pages for minor keyword variations of these guides.

## 6. Strengthen category-page internal links

Update `/calculators` and `/business-tools` so the priority tools are not supported only by navigation/footer links.

Requirements:

- Add a short, useful description of the distinct job each tool solves.
- Use natural descriptive anchors.
- Link salary copy using salary/hourly conversion language.
- Link loan copy using extra-payment/amortization language.
- Link compound-interest copy using regular-contribution language.
- Link receipt copy using completed-payment/business-receipt language.
- Link invoice copy using free PDF/no-signup language, without repeating the same anchor multiple times.
- Preserve the category pages as readable user destinations; do not add blocks of keyword links.

## 7. Add page-specific social images

All five pages currently share a generic Open Graph image. Use the existing application design system and framework-native image generation to produce a distinct 1200×630 image for each priority tool.

Each image should contain:

- ToolNimbly branding.
- The page's new primary title in readable text.
- One short differentiator, such as `PDF • No signup`, `Regular contributions`, `Gross pay conversion`, or `Extra payments`.
- Sufficient contrast and safe padding for social crops.

Requirements:

- Use code-native/framework-native images where practical; do not introduce a new external image service.
- Set matching `og:image`, Twitter image, width, height and alt text.
- Confirm each priority page emits a different image URL or generated image response.
- Do not put legal, accuracy, ranking, or usage-count claims in the images.

## 8. Verification and acceptance tests

Discover and use the repository's package manager from its lockfile. Run the existing lint, typecheck, unit-test, integration-test and production-build commands. Do not replace the existing test setup.

Add focused automated coverage where the current suite permits it.

The work is complete only when all of the following are verified:

- [ ] Existing calculator/generator tests pass unchanged.
- [ ] Production build succeeds.
- [ ] Lint and typecheck succeed.
- [ ] All five priority routes return successful pages locally.
- [ ] Each priority page has the expected unique title and meta description in server-rendered HTML.
- [ ] Each priority page has exactly one visible H1.
- [ ] Each priority page has one self-referencing canonical.
- [ ] Each priority page has exactly one `BreadcrumbList` JSON-LD object.
- [ ] Visible FAQ content matches FAQ structured data.
- [ ] Privacy copy no longer contradicts the Cloudflare analytics beacon.
- [ ] No tool input values or uploaded file contents are added to analytics or logs.
- [ ] All four new guides render, are included in the guide index, and are included in the sitemap.
- [ ] Each new guide links to its intended tool page.
- [ ] Each affected tool page links back to its dedicated guide.
- [ ] External source links use HTTPS and resolve successfully.
- [ ] All five pages have distinct Open Graph image metadata and descriptive alt text.
- [ ] The mobile layout still keeps the tool usable before the long-form content.
- [ ] Keyboard navigation and existing accessibility behavior are not regressed.
- [ ] No Vercel environment variables were changed.

Where an end-to-end browser test is available, also verify:

- Invoice and receipt PDF download still works.
- Loan and compound-interest CSV download still works.
- Salary conversion still updates all pay periods.
- Loan extra-payment input still changes payoff time/interest.
- Compound-interest contribution timing still changes the projection.

## 9. Handoff format

At completion, report:

1. Files changed.
2. Metadata changes by route.
3. Structured-data duplication removed.
4. Guides created and where they are linked.
5. Privacy wording changed.
6. Tests/build commands run and their results.
7. Any item that could not be verified locally.
8. Any production-only issue observed, without changing Vercel environment variables.

Do not claim rankings improved as a result of implementation. Ranking and indexing changes must be evaluated later in Google Search Console.

## Follow-up product backlog — not required for this first implementation

Do not let these delay sections 1–8. They should be handled in separate, tested changes after the SEO foundation ships:

1. Receipt generator: PNG/JPEG export and additional lawful generic receipt layouts.
2. Invoice generator: more genuinely distinct templates, editable labels and reusable local profiles.
3. Compound interest: comparison scenarios plus optional inflation and fee inputs.
4. Salary: adjusted/unadjusted pay, optional unpaid leave, overtime and bonus inputs while remaining gross-pay only.
5. Loan: one-time, annual and biweekly extra payments, origination-fee input and baseline-versus-extra charts.

Every follow-up feature must add genuine user value and calculation tests; it must not exist solely to insert another keyword.
