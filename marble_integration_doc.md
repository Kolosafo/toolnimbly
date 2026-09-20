# Marble CMS + SEO Integration Guide

How the blog/legal content in this project is wired to [Marble CMS](https://marblecms.com), and how to port the
same setup into another Next.js App Router project.

Stack this was built against: **Next.js 16 (App Router, RSC)**, **React 19**, **`@usemarble/sdk` ^1.0.8**,
Tailwind v4 + `@tailwindcss/typography`.

---

## 1. What the integration gives you

| Piece | Path in this repo | Purpose |
|---|---|---|
| SDK client | [src/lib/marble/client.ts](src/lib/marble/client.ts) | Single shared `marble` instance, tagged fetch for cache invalidation |
| Content types | [src/types/post.ts](src/types/post.ts) | `Post`, `Tag`, `Category`, `Author`, pagination shapes |
| Webhook types | [src/types/webhook.ts](src/types/webhook.ts) | Event union for `post.*`, `tag.*`, `category.*`, `media.*` |
| Webhook verify + handler | [src/lib/marble/webhook.ts](src/lib/marble/webhook.ts) | HMAC-SHA256 signature check + `revalidatePath`/`revalidateTag` |
| Webhook route | [src/app/api/revalidate/route.ts](src/app/api/revalidate/route.ts) | `POST /api/revalidate` endpoint Marble calls |
| Blog index | [src/app/(main)/blog/page.tsx](src/app/(main)/blog/page.tsx) | Lists posts, excludes the `legal` category |
| Blog post | [src/app/(main)/blog/[slug]/page.tsx](src/app/(main)/blog/[slug]/page.tsx) | SSG via `generateStaticParams` + per-post `generateMetadata` |
| Legal pages | [src/app/(legal)/privacy/page.tsx](src/app/(legal)/privacy/page.tsx), [terms](src/app/(legal)/terms/page.tsx) | CMS-driven privacy/terms via fixed slugs |
| Renderer | [src/components/blog/prose.tsx](src/components/blog/prose.tsx) | Renders Marble's HTML content with typography styles |
| Cards | [post-card.tsx](src/components/blog/post-card.tsx), [featured-post-card.tsx](src/components/blog/featured-post-card.tsx) | List/hero post UI |
| Sitemap | [src/app/sitemap.ts](src/app/sitemap.ts) | Static routes + every post URL, paginated fetch |
| Robots | [src/app/robots.ts](src/app/robots.ts) | Crawl rules |
| Site constants | [src/constants/site.ts](src/constants/site.ts) | `SITE_CONFIG` / `SITE_URL` used by metadata + sitemap |
| Root metadata | [src/app/layout.tsx](src/app/layout.tsx) | Title template, OG, Twitter, icons, manifest |
| Image hosts | [next.config.ts](next.config.ts) | Allows `images.marblecms.com` / `media.marblecms.com` |

---

## 2. Install

```bash
pnpm add @usemarble/sdk
pnpm add -D @tailwindcss/typography   # only if you use the <Prose> renderer
```

Register the typography plugin (Tailwind v4, in your CSS entry):

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

---

## 3. Environment variables

> ⚠️ **Gotcha carried over from this repo:** [.env.example](.env.example) lists `MARBLE_WORKSPACE_KEY` and
> `MARBLE_API_URL`, but [src/lib/marble/client.ts](src/lib/marble/client.ts) actually reads **`MARBLE_API_KEY`**
> and the SDK resolves the base URL itself. The old two-var names are leftovers from the pre-SDK `fetch`
> implementation. In the new project use the list below and delete the stale names.

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://www.yourdomain.com   # no trailing slash — used for canonicals + sitemap
MARBLE_API_KEY=                                   # Marble workspace API key (server-only, never NEXT_PUBLIC_)
MARBLE_WEBHOOK_SECRET=                            # from Marble → Settings → Webhooks
```

`MARBLE_API_KEY` must stay server-side. Every call site in this integration is a Server Component, a
`generateMetadata`, a route handler, or `sitemap.ts` — none of them ship the key to the browser. If you ever need
posts on the client, proxy them through a route handler.

---

## 4. Allow Marble's image CDN

Marble serves cover images and in-content media from its own hosts. Without this, `next/image` throws at runtime.

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.marblecms.com" },
      { protocol: "https", hostname: "media.marblecms.com" },
    ],
  },
};

export default nextConfig;
```

---

## 5. The SDK client

```ts
// src/lib/marble/client.ts
import { HTTPClient, Marble } from "@usemarble/sdk";

const key = process.env.MARBLE_API_KEY;

if (!key) {
  throw new Error("MARBLE_API_KEY is not set");
}

const customFetcher = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    next: {
      tags: ["posts"],
    },
  });
};

export const marble = new Marble({
  apiKey: key,
  httpClient: new HTTPClient({ fetcher: customFetcher }),
});
```

Why the custom fetcher: the SDK does its own `fetch` internally, so the only way to attach a Next.js cache tag to
its requests is to inject a fetcher. Every Marble response is then tagged `"posts"`, which lets the webhook blow
away all CMS data with a single `revalidateTag("posts")`.

**Note:** the module throws at import time if the key is missing. That means a build without `MARBLE_API_KEY`
fails loudly rather than silently rendering empty pages — intentional, but make sure the key is present in your
CI/Vercel build environment, not just at runtime.

### API surface used here

```ts
// list, with server-side filtering
const { result } = await marble.posts.list({ limit: 100, excludeCategories: ["legal"] });
result.posts // Post[]

// list, paginated — the returned value is async-iterable
const list = await marble.posts.list({ limit: 100 });
for await (const page of list) {
  page.result.posts // Post[] for that page
}

// single post by slug (or id)
const data = await marble.posts.get({ identifier: slug });
data.post
```

`marble.posts.get` does **not** throw for a missing slug in a way we rely on — call sites defensively check
`if (!data || !data.post) return notFound()`. Keep that check when porting.

Types can be imported straight from the SDK (`import { Post } from "@usemarble/sdk/models"`, as the card
components do) or from the local mirror in [src/types/post.ts](src/types/post.ts). Prefer the SDK's — the local
file predates the SDK migration and only exists because a few places still reference it.

---

## 6. Content model expected in Marble

Set your Marble workspace up like this so the ported code works unchanged:

- **Posts** with `title`, `slug`, `description`, `coverImage`, `content` (HTML), `publishedAt`, `authors`,
  `category`, `tags`.
- A **`legal` category** holding the `privacy` and `terms` posts. These are excluded from the blog index via
  `excludeCategories: ["legal"]` and rendered by their own routes at fixed slugs.
- Optionally a **`featured`** boolean field on posts — the blog index reads `post.featured` to pick the hero card.

---

## 7. Rendering content

Marble returns `content` as an HTML string, rendered through `dangerouslySetInnerHTML` inside a typography
wrapper:

```tsx
// src/components/blog/prose.tsx
export function Prose({ children, html, className }: ProseProps) {
  return (
    <article
      className={cn(
        "prose dark:prose-invert prose-h1:font-bold prose-h1:text-xl prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl prose-headings:font-sans prose-headings:font-normal mx-auto",
        className,
      )}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}
```

This is safe only because the HTML comes from your own trusted CMS authors. If the new project ever accepts
content from untrusted authors, sanitize server-side first.

---

## 8. Routes to copy

### Blog index — `app/blog/page.tsx`

Server Component. Fetches up to 100 posts, filters out the `legal` category **at the API level** (cheaper than
filtering client-side), splits out the featured post, renders the rest as a list.

```tsx
const { result } = await marble.posts.list({ limit: 100, excludeCategories: ["legal"] });
if (!result.posts) return <div>No posts yet</div>;

const featuredPost = result.posts.find((post) => post.featured);
const regularPosts = result.posts.filter(
  (post) => !featuredPost?.id && post.id !== featuredPost?.id,
);
```

> Known quirk worth fixing on the way over: that `regularPosts` filter is wrong. `!featuredPost?.id` is `true`
> only when there is **no** featured post, so as soon as one exists the whole list evaluates to empty and the
> "Recent Posts" section disappears. It should be:
> ```tsx
> const regularPosts = result.posts.filter((post) => post.id !== featuredPost?.id);
> ```

### Blog post — `app/blog/[slug]/page.tsx`

Three exports matter:

1. **`generateStaticParams`** — pre-renders every post at build time by iterating all pages:
   ```tsx
   export async function generateStaticParams() {
     const posts = [];
     try {
       const list = await marble.posts.list({ limit: 100 });
       for await (const page of list) {
         if (page.result.posts) posts.push(...page.result.posts);
       }
     } catch (error) {
       console.error("Error fetching posts for static params", error);
       return [];
     }
     return posts.map((post) => ({ slug: post.slug }));
   }
   ```
   The `try/catch` returning `[]` matters: a CMS hiccup degrades to on-demand rendering instead of failing the
   build.

2. **`generateMetadata`** — per-post SEO (see §9).

3. **The page** — `notFound()` on a miss, `<time dateTime={...}>` for the date, `next/image` with `fill` +
   `loading="eager"` for the cover, `<Prose>` for the body.

### Legal pages — `app/(legal)/privacy|terms/page.tsx`

Same pattern, but the slug is hardcoded instead of coming from params:

```tsx
const data = await marble.posts.get({ identifier: "privacy" });
if (!data || !data?.post) return notFound();
```

Static `export const metadata` since the title never changes. This is what lets non-engineers edit the legal
copy in Marble without a deploy.

---

## 9. SEO

### 9.1 Site constants — the single source of truth

Everything SEO-related reads from one file, so the new project only needs edits here.

```ts
// src/constants/site.ts
import { getBaseUrl } from "@/lib/utils";

export const SITE_CONFIG = {
  title: "BookFlow",
  description: "…",
  openGraphImage: "/meta.webp",   // 1200×630
  favicon: "/favicon.ico",
  url: getBaseUrl(),
  image: "/seo.jpg",
  keywords: ["book summaries", "AI book summaries", /* … */],
};

export const SITE_URL = `${getBaseUrl()}`;
```

`getBaseUrl()` ([src/lib/utils.ts:8](src/lib/utils.ts#L8)) resolves in order: `NEXT_PUBLIC_APP_URL` →
`http://localhost:3000` in dev → `https://${VERCEL_URL}`. Set `NEXT_PUBLIC_APP_URL` in production so canonicals
and the sitemap never point at a preview deployment URL.

### 9.2 Root metadata — `app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.title} - Absorb knowledge faster`,
    template: `%s - ${SITE_CONFIG.title}`,   // child pages only set their own title
  },
  metadataBase: new URL(SITE_CONFIG.url),    // makes all relative URLs below absolute
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords.join(", "),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.title,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [{ url: SITE_CONFIG.openGraphImage, width: 1200, height: 630 }],
  },
  twitter: {
    site: SITE_CONFIG.url,
    card: "summary_large_image",
    images: [{ url: SITE_CONFIG.openGraphImage, width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png" },
      { url: SITE_CONFIG.favicon },
    ],
    shortcut: "/icon1.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};
```

`metadataBase` is the important one — without it Next.js warns and OG/Twitter image URLs stay relative, which
most crawlers reject.

> The layout references `/manifest.json`, but there is no `public/manifest.json` in this repo — that's a live
> 404. Either add the file in the new project or drop the `manifest` key.

### 9.3 Per-post metadata — `generateMetadata`

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const data = await marble.posts.get({ identifier: slug });
  const canonicalUrl = `${SITE_CONFIG.url}/blog/${slug}`;

  if (!data || !data.post) return {};

  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: data.post.title,
    description: data.post.description,
    alternates: { canonical: canonicalUrl },
    twitter: {
      title: data.post.title,
      description: data.post.description || SITE_CONFIG.description,
      card: "summary_large_image",
      images: [{ url: data.post.coverImage ?? "/meta.webp", width: "1200", height: "630", alt: data.post.title }],
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: SITE_CONFIG.title,
      images: [{ url: data.post.coverImage ?? "/meta.webp", width: "1200", height: "630", alt: data.post.title }],
      title: data.post.title,
      description: data.post.description,
      publishedTime: new Date(data.post.publishedAt).toISOString(),
      authors: [...data.post.authors.map((a) => a.name)],
    },
  };
}
```

Points to keep:
- `alternates.canonical` on every post — the main defense against duplicate-content from query params and
  trailing-slash variants.
- `openGraph.type: "article"` with `publishedTime` and `authors`.
- Fall back to the site OG image when `coverImage` is null.
- `generateMetadata` and the page both call `marble.posts.get` with the same args; Next dedupes that within a
  request, so it's one network call.

> In this repo `canonicalUrl` is hardcoded to `https://www.getbookflow.com/blog/${slug}`. **Change it to
> `${SITE_CONFIG.url}/blog/${slug}`** when porting, or every post on the new domain will canonicalize to
> BookFlow.

### 9.4 Sitemap — `app/sitemap.ts`

Next.js serves this at `/sitemap.xml` automatically. It merges static routes with one entry per CMS post.

```ts
import { SITE_URL } from "@/constants/site";
import { marble } from "@/lib/marble/client";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = [];
  try {
    const result = await marble.posts.list({ limit: 100 });
    for await (const page of result) {
      if (page.result.posts) posts.push(...page.result.posts);
    }
  } catch (error) {
    console.error("Sitemap: Error fetching posts", error);
  }

  const postPages: MetadataRoute.Sitemap =
    posts?.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    })) ?? [];

  return [
    { url: SITE_URL,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`,    lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    ...postPages,
  ];
}
```

Porting checklist for this file:
- Replace the four static entries with the new project's real routes.
- The `for await` loop walks **all** pages, so it isn't capped at 100 posts despite the `limit`.
- The `try/catch` means a CMS outage yields a sitemap with just the static routes instead of a 500 — keep it.
- Consider `lastModified: new Date(post.updatedAt)` instead of `publishedAt` so edits re-signal freshness.
- Because the client tags requests `"posts"`, the webhook's `revalidateTag("posts")` refreshes the sitemap too.

### 9.5 Robots — `app/robots.ts`

Served at `/robots.txt`.

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/privacy", "/terms", "/widget"],
    },
  };
}
```

Two notes before copying verbatim:
- `/privacy` and `/terms` are deliberately excluded from indexing here (thin, boilerplate pages). Decide whether
  that's right for the new project — many sites want them indexed for trust signals.
- **Add `sitemap: \`${SITE_URL}/sitemap.xml\``** to the returned object. This repo omits it, so crawlers only find
  the sitemap via Search Console. The fixed version:
  ```ts
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/widget"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
  ```

### 9.6 `llms.txt`

[public/llms.txt](public/llms.txt) is a static, hand-maintained index of the site for LLM crawlers — site
description plus grouped links (Main Pages, Blog, Documentation, Legal). It's served straight from `public/` at
`/llms.txt`. Cheap to copy; remember it does **not** auto-update from Marble, so either keep it to section-level
links (as here, linking `/blog` rather than every post) or generate it from a route handler.

---

## 10. On-demand revalidation (webhooks)

This is what makes "publish in Marble → live in seconds" work without redeploying.

### 10.1 Signature verification

```ts
// src/lib/marble/webhook.ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(secret: string, signatureHeader: string, bodyText: string) {
  const expectedHex = signatureHeader.replace(/^sha256=/, "");
  const computedHex = createHmac("sha256", secret).update(bodyText).digest("hex");

  const expected = Buffer.from(expectedHex, "hex");
  const computed = Buffer.from(computedHex, "hex");

  if (expected.length !== computed.length) return false;
  return timingSafeEqual(expected, computed);
}
```

HMAC-SHA256 over the **raw request body**. You must read `await request.text()` and verify *before*
`JSON.parse` — re-serializing the parsed object changes the bytes and breaks the signature.

### 10.2 Event handler

```ts
import { revalidatePath, revalidateTag } from "next/cache";
import type { PostEventData } from "@/types/webhook";

export async function handleWebhookEvent(payload: PostEventData) {
  const event = payload.event;
  const data = payload.data;

  if (event.startsWith("post")) {
    revalidatePath("/blog");
    if (data.slug) revalidatePath(`/blog/${data.slug}`);
    revalidateTag("posts", { expire: 0 });

    return { revalidated: true, now: Date.now(), message: "Post event handled" };
  }

  return { revalidated: false, now: Date.now(), message: "Event ignored" };
}
```

Belt and braces: `revalidatePath` for the two specific routes, plus `revalidateTag("posts")` for everything the
SDK fetched (sitemap, legal pages, any other list). `{ expire: 0 }` forces immediate expiry rather than
stale-while-revalidate.

Only `post.*` events are handled. `tag.*`, `category.*` and `media.*` are typed but ignored — extend the
`if` chain if the new project renders tag or category pages.

### 10.3 Route handler — `app/api/revalidate/route.ts`

```ts
export async function POST(request: Request) {
  const signature = request.headers.get("x-marble-signature");
  const secret = process.env.MARBLE_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return NextResponse.json({ error: "Secret or signature missing" }, { status: 400 });
  }

  const bodyText = await request.text();

  if (!verifySignature(secret, signature, bodyText)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(bodyText) as PostEventData;
  if (!payload.event || !payload.data) {
    return Response.json({ error: "Invalid payload structure" }, { status: 400 });
  }

  try {
    const result = await handleWebhookEvent(payload);
    return NextResponse.json(result);
  } catch (err) {
    console.error("error", err);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
```

Header name: **`x-marble-signature`**.

### 10.4 Configure in Marble

Marble dashboard → **Settings → Webhooks**:
- Endpoint: `https://your-domain.com/api/revalidate`
- Events: `post.published`, `post.updated`, `post.deleted`
- Copy the signing secret into `MARBLE_WEBHOOK_SECRET`

Local testing:

```bash
BODY='{"event":"post.published","data":{"id":"1","slug":"hello","title":"Hello","userId":"u1"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MARBLE_WEBHOOK_SECRET" | awk '{print $2}')
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-marble-signature: sha256=$SIG" \
  -d "$BODY"
```

Expect `{"revalidated":true,...}`. Revalidation is a no-op in `next dev` — test against `next build && next start`
or a preview deployment.

---

## 11. Porting checklist

1. `pnpm add @usemarble/sdk` (+ `@tailwindcss/typography` if using `<Prose>`).
2. Set `NEXT_PUBLIC_APP_URL`, `MARBLE_API_KEY`, `MARBLE_WEBHOOK_SECRET` — locally **and** in the host's build env.
3. Add the Marble image hostnames to `next.config.ts`.
4. Copy `src/lib/marble/`, `src/types/post.ts`, `src/types/webhook.ts`, `src/app/api/revalidate/route.ts`.
5. Copy `src/components/blog/` (prose + cards) and restyle to the new design system.
6. Copy the blog index and `[slug]` route; **fix the `regularPosts` filter** (§8) and **swap the hardcoded
   canonical domain for `SITE_CONFIG.url`** (§9.3).
7. Create `src/constants/site.ts` + a `getBaseUrl()` helper with the new project's title, description, keywords,
   OG image.
8. Set root `metadata` in `app/layout.tsx` — `metadataBase` and the title `template` are the must-haves. Ship a
   real `manifest.json` or remove the key.
9. Add `app/sitemap.ts` with the new project's static routes; add `app/robots.ts` **with the `sitemap` field**.
10. Optionally add `public/llms.txt`.
11. Create the Marble webhook pointing at `/api/revalidate` and verify with the curl snippet above.
12. In Marble: create the `legal` category and the `privacy`/`terms` posts if you're porting those routes.

## 12. Verification

```bash
pnpm build && pnpm start
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml | head -40      # post URLs present?
curl -s localhost:3000/blog/<slug> | grep -i 'canonical\|og:'
```

Then, post-deploy: submit `/sitemap.xml` in Google Search Console, and check a post URL through the
Facebook Sharing Debugger / X Card Validator to confirm the OG image resolves absolutely.
