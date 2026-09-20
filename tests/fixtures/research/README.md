# SYNTHETIC research fixtures — automated tests only

`synthetic-responses.csv` contains **124 machine-generated rows**. No person
answered any of these questions. Nothing in this directory describes any real
business, and no figure derived from it may appear on a public page, in social
copy, in outreach, or in any statement about the benchmark.

It exists for one reason: the validator, the aggregator and the suppression
rules need a realistically shaped file to run against in CI.

Regenerate with:

```bash
node tests/fixtures/research/generate-synthetic-responses.mjs
```

The generator is seeded, so the output is byte-identical on every run and a
diff means somebody changed the generator.

## Why it cannot leak into the report

The report page reads only `data/research/aggregates/*-summary.json`, which is
written by `pnpm research:build` from the private real export. This fixture is
never an input to that command, and `tests/unit/research-pipeline.test.ts`
asserts that no synthetic path appears in `data/` or `public/`.

Real responses must never be placed here, or anywhere else in this repository.
See `docs/research/data-handling.md`.
