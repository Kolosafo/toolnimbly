# Why there is no `loading.tsx` here

Every tool page is prerendered at build time (`generateStaticParams` with
`dynamicParams = false`), so its HTML is complete before the first request
arrives and there is nothing to wait for.

Adding a `loading.tsx` actively breaks these pages. It creates a Suspense
boundary, and because the page component is `async` (it awaits `params`), React
streams the result: the skeleton is emitted inline inside `<main>` and the real
page — H1, editorial content, FAQs, internal links — is sent afterwards inside
`<div hidden>`, to be swapped in by an inline script.

With JavaScript disabled, that swap never happens and the visitor sees a
skeleton forever. That violates spec §8.6, which requires the H1, intro,
instructions, FAQs and links to be server-rendered without depending on
JavaScript.

The loading state that *is* needed — while the interactive tool bundle is
fetched — is handled by the `loading` option on each entry in
`components/tools/tool-components.tsx`, which is scoped to the tool panel alone
and leaves the surrounding server-rendered content visible.

`tests/e2e/site.spec.ts` asserts the no-JavaScript rendering, so reintroducing a
page-level `loading.tsx` will fail CI.
