# Marble CMS integration

The blog at `/blog` is authored in [Marble](https://marblecms.com) and fetched
server-side. Everything else on the site — the 30 tools, the 11 guides, the
legal pages — is code-managed and does not depend on the CMS.

This is a port of `marble_integration_doc.md`. Where it diverges from that
guide, the reason is recorded below.

## Configuration

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BLOG_ENABLED` | public | Master switch. Default `false`. |
| `MARBLE_API_KEY` | **server only** | Workspace API key. |
| `MARBLE_WEBHOOK_SECRET` | **server only** | Signs the revalidation webhook. |

Neither secret carries a `NEXT_PUBLIC_` prefix, so Next.js never inlines them
into a client bundle. `lib/marble/client.ts` imports `server-only`, which turns
an accidental import from a Client Component into a build error rather than a
published key.

### The two states worth knowing

**Blog off** (the default, and the launch configuration): no Marble request is
made, `/blog` and `/blog/[slug]` return 404, `/api/revalidate` returns 404, the
sitemap contains no blog entries, the footer does not link it, and the CSP
carries no Marble image hosts. The CMS contributes nothing to the attack
surface until it is deliberately switched on.

**Blog on without a key**: `next build` fails with a message naming the
variable and the flag. This is intentional — see the divergence note below.

## Files

| File | Purpose |
|---|---|
| `lib/marble/client.ts` | Lazily-created SDK client, tagged fetch |
| `lib/marble/cache-tag.ts` | The cache tag, free of `server-only` so it is testable |
| `lib/marble/posts.ts` | List/get helpers, and the featured/rest split |
| `lib/marble/webhook.ts` | HMAC verification and revalidation |
| `app/api/revalidate/route.ts` | `POST /api/revalidate` |
| `app/(site)/blog/page.tsx` | Index |
| `app/(site)/blog/[slug]/page.tsx` | Post, with `BlogPosting` schema |
| `components/blog/prose.tsx` | Renders CMS HTML |
| `components/blog/post-card.tsx` | Index card |

## Webhook

Marble dashboard → Settings → Webhooks:

- Endpoint `https://<your-domain>/api/revalidate`
- Events `post.published`, `post.updated`, `post.deleted`
- Copy the signing secret into `MARBLE_WEBHOOK_SECRET`

Test it against a production build (revalidation is a no-op in `next dev`):

```bash
BODY='{"event":"post.published","data":{"id":"1","slug":"hello","title":"Hello"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MARBLE_WEBHOOK_SECRET" | awk '{print $2}')
curl -X POST http://127.0.0.1:3200/api/revalidate \
  -H 'Content-Type: application/json' \
  -H "x-marble-signature: sha256=$SIG" \
  -d "$BODY"
```

Expect `{"revalidated":true,...}`.

## Where this diverges from the guide, and why

**`NEXT_PUBLIC_SITE_URL`, not `NEXT_PUBLIC_APP_URL`.** This project already had
a variable naming the canonical origin, and it drives canonical tags, the
sitemap, Open Graph URLs and the embed snippets. A second variable for the same
concept is how those drift apart.

**The client does not throw on import.** The guide constructs the SDK at module
scope and throws when the key is missing, so a key-less build fails loudly
rather than rendering empty pages. That is right for a site which *is* the
blog. Here it would break `next build`, the test suite and CI for everyone
until a key existed — including for work that never touches the CMS. The
failure is moved, not removed: `blogEnabled` decides whether the blog is built,
and building it without a key still throws.

**`getMarbleClient()` is called outside the `try`.** A missing key is a
configuration error and must propagate; a network or API failure is an outage
and degrades to an empty list. Catching both together reproduces exactly the
silent empty-blog the guide warns about.

**`dynamicParams` stays `true` for posts.** Every other dynamic route here sets
it to `false`, because its registry is code and an unknown slug really is a
404. Posts are not: one published after the last deploy has no build-time
entry, and `false` would 404 a URL the editor can see live.

**The `regularPosts` filter is fixed.** The guide flags its own bug — the
filter reads `!featured?.id && post.id !== featured?.id`, which is true only
when there is *no* featured post, so the list empties the moment one exists.
`splitFeatured` excludes by id, which is all that was intended.

**CSP, which the guide does not mention.** Its source project has no Content
Security Policy. This one does, so `next.config.ts` alone is not enough:
that governs which hosts `next/image` will optimise, while `img-src` governs
whether the browser loads the bytes at all. Both now name Marble's media hosts,
and only when the blog is on.

**Legal pages stay in code.** The guide drives `/privacy` and `/terms` from the
CMS. Here they are code-managed, carry a configured-legal-entity guard, and are
covered by tests. Moving them into Marble would trade that for editability —
a real trade-off, but one to make deliberately rather than as a side effect of
adding a blog. The `legal` category is still excluded from the index, so the
option stays open.

**`robots.ts` is unchanged.** The guide disallows `/privacy` and `/terms` and
omits the `sitemap` field. This project's robots already declares the sitemap,
and its legal pages are deliberately indexable as trust signals.

**Webhook responses are terse.** The guide distinguishes "secret or signature
missing" (400) from "invalid signature" (400). Both are 401 here with the same
body: a public endpoint should not tell someone probing it how close they are.

## Things the guide gets right that are easy to lose

- Verify the signature over the **raw** body, before `JSON.parse`. Re-serialising
  changes the bytes and rejects every legitimate request. There is a test for
  this, and it uses a pretty-printed body — a compact one round-trips unchanged
  and would pass against the broken implementation.
- Compare digests in constant time.
- `<Prose>` is only safe because the HTML comes from trusted authors. If the
  workspace is ever opened up, sanitise server-side first.

## Content model expected in Marble

- **Posts** with `title`, `slug`, `description`, `coverImage`, `content` (HTML),
  `publishedAt`, `authors`, `category`, `tags`, and optionally `featured`.
- A **`legal`** category, excluded from the index via `excludeCategories`.
