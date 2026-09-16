# ADR 0003 — Date-only arithmetic, never timestamps

**Status:** accepted · **Date:** 2026-09-16

## Context

The age and date difference calculators, and the amortisation schedules, all
work with calendar dates. The common implementation — subtracting two
`Date` values and dividing by 86,400,000 — is wrong across daylight-saving
transitions, where a local day is 23 or 25 hours long. Parsing `YYYY-MM-DD`
with `new Date()` also treats it as UTC, which can shift a date by a day for
users west of Greenwich.

## Decision

Calendar dates are represented as a plain `{ year, month, day }` value. All
arithmetic — differences, borrowing down years/months/days, weekday derivation,
business-day counting — operates on those fields or on a day-number conversion,
never on elapsed milliseconds. No date-only value is ever round-tripped through
a timezone-sensitive parse.

The Vitest suite runs with `TZ=America/New_York`, a DST-observing, non-UTC zone.
A test that accidentally relies on UTC parsing fails there rather than passing
by luck on a UTC build agent.

## Consequences

- Day counts are stable across clock changes and independent of the user's
  timezone.
- Leap years and month-end borrowing are handled explicitly and tested,
  including 29 February birthdays in non-leap years (28 February is used, and
  the choice is disclosed on the page).
- Displaying a date requires an explicit formatting step; there is no implicit
  `toString()` path.

## Alternatives rejected

- **A date library (`date-fns`, Luxon, Temporal polyfill)**: the required
  surface is small and fully testable, and avoiding the dependency keeps the
  calculator chunks light.
