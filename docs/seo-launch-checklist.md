# ToolNimbly SEO launch checklist

Last reviewed: 20 September 2026

The application-side work in `tools-site-seo-build.md` is integrated. The remaining items in this checklist need the production deployment, Google Search Console, GA4, or field traffic; they cannot be truthfully completed from the repository alone.

## Before requesting indexing

- Deploy the current build and confirm the canonical host is `https://www.toolnimbly.com`.
- Confirm the apex domain redirects once to the `www` host and does not create a redirect chain.
- Open `/robots.txt` and `/sitemap.xml` on production. The sitemap should use only `www` URLs, and robots should allow pages and framework assets while disallowing only `/api/`.
- Spot-check a tool, category, guide, and embed route in the rendered HTML. Public pages should be indexable with self-referencing canonicals; embeds should be `noindex` and canonicalize to their full tool pages.
- Run Google Rich Results Test against representative tools from every cluster. Confirm `WebApplication`, `FAQPage`, and `BreadcrumbList` parse without critical errors.

## Google Search Console

- In the verified domain property, submit `https://www.toolnimbly.com/sitemap.xml` and remove an obsolete apex-host sitemap if one is still listed.
- Use URL Inspection on the homepage, all five category hubs, the seven guides, and the highest-priority tool in each cluster. Request indexing after the deployed HTML passes inspection.
- Review **Page indexing** weekly until the 48 public routes settle. Investigate `Crawled - currently not indexed`, duplicate canonical selections, soft 404s, and blocked resources rather than repeatedly resubmitting unchanged pages.
- Export page/query performance once a month and paste position, impressions, and clicks into `outputs/toolnimbly-seo/seo-rank-tracker.xlsx`.

## GA4

Analytics remains disabled by default. Create a GA4 web stream, then set these production variables and redeploy:

```text
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_PROVIDER=ga4
NEXT_PUBLIC_ANALYTICS_SITE_ID=G-XXXXXXXXXX
```

After deployment, choose **Allow analytics** in the consent banner and use GA4 DebugView or Realtime to confirm `page_view`, `tool_view`, `tool_started`, `tool_success`, `tool_copy`, and `tool_download`. The event contract sends tool slugs and coarse output types only; it never includes user-entered values, pasted text, filenames, document contents, or calculated results.

## Core Web Vitals

- Run mobile Lighthouse or PageSpeed Insights on at least one page from each tool family, every cluster hub, and a guide immediately after deployment.
- Record any template-wide issue once, fix it at the shared component level, then retest the affected page family.
- Treat lab results as diagnostics, not proof of the acceptance target. Confirm LCP, INP, and CLS from Search Console's Core Web Vitals report after enough real-user field data has accumulated.
- Recheck after adding advertising, consent tooling, or third-party scripts; those changes are common sources of LCP and INP regression.

## Monthly review

- Update the rank tracker on the same day each month.
- Compare clicks with impressions and position. Stable rankings plus falling click-through rate can indicate a changed result layout or an AI answer reducing clicks.
- Expand guides that gain impressions but sit outside the top ten, and strengthen links from the relevant hub and related tools.
- Do not create near-duplicate pages for keyword variants. The current registry has one distinct primary keyword per tool; keep that ownership model intact.
