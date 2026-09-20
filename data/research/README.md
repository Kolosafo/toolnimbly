# Research data

Two directories, with opposite rules.

## `private/` — never committed

Raw survey exports. `.gitignore` excludes this whole directory, plus anything
named `*.private.csv` or `*.private.json` anywhere under `data/research/`.

The expected file is:

```
data/research/private/invoice-payment-terms-responses.private.csv
```

Response-level rows do not belong in this repository, in `public/`, in a page
payload or in a build log. If you find one here, something has gone wrong —
see `docs/research/data-handling.md`.

## `aggregates/` — committed once it is real

Written by `pnpm research:build` from the private export:

```
invoice-payment-terms-benchmark-2026-summary.json    # what the report renders
invoice-payment-terms-benchmark-2026-aggregates.csv  # the public download
```

Counts and percentages only, with every withheld cell marked. **Neither file is
served.** `pnpm research:build` cannot put anything on the web: publishing the
CSV is `pnpm research:publish`, a separate command that runs the full
publication gate first and regenerates the file from the validated summary
rather than copying it.

Both directories are empty today. No survey has been fielded, and the report
route returns a real 404 in production until that changes.
