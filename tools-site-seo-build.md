# Tools Site SEO — Build Brief (for Claude Code)

This is the **on-site / technical work** — the part I own and can implement with Claude Code.
Off-site scaling (backlinks, digital PR, paid promotion) is handled separately.

> **Note for Claude Code:** Adapt every task to the actual framework in this repo
> (Next.js, Astro, plain HTML, etc.). Detect the stack first, then implement.
> The goal for each tool page: a genuinely useful tool + enough real content that
> Google never reads it as thin. A widget with 40 words of text will not rank in 2026
> and risks being suppressed as scaled thin content.

---

## 0. Discovery (do this first)

- [ ] Identify the framework, routing, and how the 30 tool pages are currently generated.
- [ ] List all 30 tools with: URL, target keyword, current word count, current title/meta.
- [ ] Note which pages are already indexed (cross-check later against Search Console).
- [ ] Flag any two tools competing for the same keyword (keyword cannibalization).

Output a table: `tool name | url | target keyword | words now | title | meta | indexed?`

---

## 1. Technical foundation

- [ ] **Unique title tag** per page — format: `<Primary keyword> — <benefit / free>` (≤ 60 chars).
- [ ] **Unique meta description** per page (~150 chars, includes the keyword naturally).
- [ ] **One H1 per page** matching the target keyword.
- [ ] **Canonical tags** on every page (self-referencing) to kill duplicate-URL issues.
- [ ] **XML sitemap** listing all 30 tool pages + all supporting articles; auto-updates on build.
- [ ] **robots.txt** clean — nothing important blocked; sitemap referenced.
- [ ] **Clean URL slugs**: `/mortgage-calculator`, not `/tools?id=7`.
- [ ] **404 + redirect handling** for any old/renamed URLs.

## 2. Core Web Vitals / speed

- [ ] Audit each tool page (Lighthouse). Target: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- [ ] Lazy-load anything below the fold; defer non-critical JS.
- [ ] Make sure the tool itself is interactive fast — calculators should not block render.
- [ ] Compress/serve images in modern formats; set explicit width/height to avoid CLS.

## 3. Structured data (schema, JSON-LD)

Add per page as relevant:

- [ ] `SoftwareApplication` **or** `WebApplication` for each tool.
- [ ] `FAQPage` schema wired to the on-page FAQ (see §4).
- [ ] `BreadcrumbList` for the category → tool hierarchy.
- [ ] Validate every page in Google's Rich Results Test.

Example skeleton for a tool page:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Mortgage Calculator",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0" }
}
```

---

## 4. Per-page content template

Every tool page should follow this structure (this is what turns a thin widget into a
rankable page). Draft real copy — no placeholder lorem.

1. **H1** — target keyword.
2. **The tool itself**, high on the page (user intent = use it now).
3. **What it does** — 2–3 sentences.
4. **How to use it** — short numbered steps.
5. **Worked example** — real inputs → real output, explained.
6. **The concept behind it** — 200–400 words of genuinely useful context
   (e.g. how the formula works, when to use it, common mistakes).
7. **FAQ** — 4–6 real questions people search, wired to `FAQPage` schema.
8. **Related tools** — internal links to 3–5 tools in the same cluster.

Target: **800–1,500 words** of real content wrapping the tool.

- [ ] Build this as a reusable template/component so all 30 pages share the structure.
- [ ] Fill in unique copy for each tool (Claude Code can draft; I'll review for accuracy).

---

## 5. Topical clusters + internal linking

Don't leave 30 disconnected tools — group them so Google sees topic depth.

- [ ] Group the 30 tools into clusters (e.g. Finance, Unit Conversion, Dev/Web, Health).
- [ ] Create a **category hub page** per cluster linking to every tool in it.
- [ ] Write **1–2 supporting articles per cluster** (guides, comparisons) that link into the tools.
- [ ] Internal links flow: hub ⇄ tools ⇄ related tools ⇄ supporting articles.
- [ ] Add breadcrumbs reflecting the cluster hierarchy.

Output the cluster map as a table: `cluster | tools in it | hub URL | supporting article ideas`.

---

## 6. Analytics + measurement setup

- [ ] Google Search Console verified; sitemap submitted; request indexing on new pages.
- [ ] GA4 installed; track tool usage events (people actually using the calculator = engagement signal).
- [ ] Set up a simple rank-tracking sheet (keyword | url | position | date) to review monthly.
- [ ] Watch for: rankings holding but traffic dropping → likely AI Overviews eating clicks.

---

## 7. Embed widget — the link-earning feature (high priority)

This is the single highest-leverage backlink source on the whole site. When another
website embeds one of your tools, the embed code carries a link back to your page — a
free, permanent, contextual backlink you never had to ask for. Build the mechanism once;
it works across all 30 tools.

**Requirements:**

- [ ] "Embed this tool" button on every tool page.
- [ ] Clicking it opens a modal with a copy-paste snippet + a one-click **Copy** button.
- [ ] The snippet embeds an `<iframe>` pointing at an embeddable version of *that specific tool*.
- [ ] The snippet MUST include a visible, **crawlable** backlink below the iframe —
      a plain `<a href>` (NOT injected by JavaScript), e.g.:
      `Powered by <a href="https://yoursite.com/mortgage-calculator">Mortgage Calculator</a>`.
      This crawlable link is the entire point — if Google can't see it, the embed earns nothing.
- [ ] Create an embeddable route per tool, e.g. `/embed/mortgage-calculator`:
  - Minimal chrome — no site nav/footer, just the working tool + the "Powered by" credit link.
  - Responsive; sensible default iframe height; works when framed on another domain.
  - Allow cross-domain framing: do **not** send `X-Frame-Options: DENY`; scope the CSP
    `frame-ancestors` directive to permit embedding.
- [ ] Keep the "Powered by" credit lightweight and tasteful so people leave it in place.
- [ ] Optional: a light/dark theme parameter people can set in the snippet.

**Acceptance:** pasting the snippet on a *different* domain renders the working tool AND a
crawlable `<a>` link back to the tool page.

---

## 8. Build order (suggested)

1. Discovery table (§0)
2. Technical foundation + speed (§1, §2) — unblocks everything
3. Content template component (§4)
4. Roll out content across all 30 pages
5. Schema (§3)
6. Embed widget + per-tool embed routes (§7)
7. Clusters, hubs, internal linking, supporting articles (§5)
8. Analytics + sitemap submission (§6)

---

## Acceptance criteria

- All 30 tool pages: unique title/meta/H1, 800+ words real content, valid schema, in sitemap.
- All pages pass Core Web Vitals on mobile.
- Every tool links to its cluster hub and 3+ related tools.
- Every tool has a working "Embed this tool" button and an `/embed/` route with a
  crawlable backlink that renders correctly on a different domain.
- Search Console shows all pages indexed, no critical errors.
- Each cluster has a hub page + at least one supporting article.
