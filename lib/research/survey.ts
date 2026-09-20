import { features } from '@/lib/config/features';
import { FIELDWORK_RECORD, isCalendarDate, type FieldworkRecord } from '@/lib/research/pipeline';

/**
 * What the owner has actually verified about the survey provider.
 *
 * Three environment variables are enough to point a page at a form. They are
 * nowhere near enough to justify the sentences that page carries. "Your IP
 * address is not stored with your answers", "nothing is recorded until you
 * submit", "quote the identifier on the confirmation screen and we will delete
 * your response" and "participation is unpaid" are claims about a third party's
 * software and about how people were recruited. A hostname cannot establish any
 * of them.
 *
 * So each one is recorded here, by hand, after somebody checked it — and each
 * sentence renders only if its own flag is true. A claim that has not been
 * verified is not softened on the page; it is absent from it.
 *
 * `null` until a provider is approved, which is the state today. With it null
 * the survey route returns a real 404 whatever the environment says.
 */
export type ProviderAssurance = {
  /** Must equal `NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER`, or nothing is live. */
  readonly provider: string;
  /** The date someone checked the items below. `YYYY-MM-DD`. */
  readonly verifiedOn: string;
  /** The provider does not retain a request IP alongside a response. */
  readonly storesNoIpWithResponses: boolean;
  /** Partial answers are discarded; nothing is kept until submit. */
  readonly recordsNothingBeforeSubmit: boolean;
  /** The confirmation screen shows an identifier a participant can quote. */
  readonly showsResponseIdOnConfirmation: boolean;
  /** Nobody is paid, credited or entered into a draw for taking part. */
  readonly participationIsUnpaid: boolean;
  /** The export carries exactly the documented columns and nothing else. */
  readonly exportMatchesContract: boolean;
  /** Days the raw export is kept after the report publishes. */
  readonly rawRetentionDays: number;
  /**
   * Days the raw export is kept when the report never publishes — because
   * fieldwork missed the floor, or the owner shelved it. Without this, data
   * collected for a report that never happened would be kept indefinitely.
   */
  readonly unpublishedRawRetentionDays: number;
};

export const PROVIDER_ASSURANCE: ProviderAssurance | null = null;

export type SurveyCollection =
  | { readonly live: false; readonly blockers: readonly string[] }
  | {
      readonly live: true;
      readonly provider: string;
      readonly url: string;
      readonly assurance: ProviderAssurance;
    };

export type SurveyCollectionInput = {
  readonly enabled: boolean;
  readonly url: string;
  readonly provider: string;
  readonly assurance: ProviderAssurance | null;
  /** Defaults to `FIELDWORK_RECORD`; present so the check stays testable. */
  readonly fieldwork?: FieldworkRecord | null;
};

/**
 * Everything standing between this build and a live survey.
 *
 * Pure, so it can be tested without an environment. Note what is a blocker and
 * what is not: a provider that keeps IP addresses beside responses cannot be
 * used at all, because not collecting them is a promise the instrument makes.
 * A provider with no confirmation identifier *can* be used — it just means the
 * pages must not offer a deletion route that would not work.
 */
export function surveyCollectionBlockers(input: SurveyCollectionInput): string[] {
  const blockers: string[] = [];

  if (!input.enabled) {
    blockers.push('NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED is off.');
  }
  if (!/^https:\/\/[^\s]+$/.test(input.url)) {
    blockers.push('NEXT_PUBLIC_RESEARCH_SURVEY_URL is not set to an HTTPS form URL.');
  }
  if (input.provider.length === 0) {
    blockers.push('NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER does not name the provider.');
  }

  const { assurance } = input;
  if (assurance === null) {
    blockers.push(
      'No provider assurance is recorded. Set PROVIDER_ASSURANCE in lib/research/survey.ts ' +
        'once someone has verified the provider against the checklist in ' +
        'docs/research/data-handling.md §2.',
    );
    return blockers;
  }

  if (assurance.provider !== input.provider) {
    blockers.push(
      `The recorded assurance is for ${assurance.provider}, but the configured provider is ` +
        `${input.provider || '(unset)'}. Verify the provider actually in use.`,
    );
  }
  if (!isCalendarDate(assurance.verifiedOn)) {
    blockers.push('The provider assurance carries no valid verification date.');
  }
  if (!assurance.storesNoIpWithResponses) {
    blockers.push(
      'The provider stores request IP addresses alongside responses. The survey does not ' +
        'collect IP addresses, so this provider cannot be used as configured.',
    );
  }
  if (!assurance.exportMatchesContract) {
    blockers.push(
      'The provider export does not match the documented column contract, so responses could ' +
        'not be validated.',
    );
  }
  if (!(assurance.rawRetentionDays > 0) || !(assurance.unpublishedRawRetentionDays > 0)) {
    blockers.push('The provider assurance sets no raw-export retention deadline.');
  }

  /*
   * Two records describe the same fieldwork from different ends: this one says
   * whether the form is unpaid, and FIELDWORK_RECORD says whether the people
   * filling it in were compensated. If they disagree, the survey page and the
   * published report would make opposite statements about the same survey.
   */
  const fieldwork = input.fieldwork === undefined ? FIELDWORK_RECORD : input.fieldwork;
  if (
    fieldwork !== null &&
    assurance.participationIsUnpaid === fieldwork.participantsWereCompensated
  ) {
    blockers.push(
      'The provider assurance and the fieldwork record disagree about whether participants are ' +
        'paid. Reconcile PROVIDER_ASSURANCE.participationIsUnpaid with ' +
        'FIELDWORK_RECORD.participantsWereCompensated.',
    );
  }

  return blockers;
}

/** The live collection configuration, or why there is none. */
export function surveyCollection(): SurveyCollection {
  const input: SurveyCollectionInput = {
    enabled: features.researchSurveyEnabled,
    url: features.researchSurveyUrl,
    provider: features.researchSurveyProvider,
    assurance: PROVIDER_ASSURANCE,
  };

  const blockers = surveyCollectionBlockers(input);
  if (blockers.length > 0 || input.assurance === null) return { live: false, blockers };

  return {
    live: true,
    provider: input.provider,
    url: input.url,
    assurance: input.assurance,
  };
}

/** True only when a verified provider is configured and switched on. */
export function surveyIsLive(): boolean {
  return surveyCollection().live;
}
