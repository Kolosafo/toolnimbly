import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FIELDWORK_RECORD, type FieldworkRecord } from '@/lib/research/pipeline';
import {
  PROVIDER_ASSURANCE,
  surveyCollectionBlockers,
  type ProviderAssurance,
  type SurveyCollectionInput,
} from '@/lib/research/survey';

/**
 * The provider-approval gate.
 *
 * Three environment variables can point a page at a form. They cannot
 * establish that the provider drops IP addresses, discards partial answers or
 * hands a participant an identifier to quote later — and the survey page and
 * the privacy policy say all three. This gate is what separates "configured"
 * from "checked".
 */

const projectRoot = process.cwd();

const verified: ProviderAssurance = {
  provider: 'Example Forms',
  verifiedOn: '2026-10-01',
  storesNoIpWithResponses: true,
  recordsNothingBeforeSubmit: true,
  showsResponseIdOnConfirmation: true,
  participationIsUnpaid: true,
  exportMatchesContract: true,
  rawRetentionDays: 90,
  unpublishedRawRetentionDays: 60,
};

const paidPanel: FieldworkRecord = {
  recordedOn: '2026-08-03',
  recruitment:
    'Participants were recruited through the Prolific panel and compensated for completing ' +
    'the survey.',
  participantsWereCompensated: true,
};

const configured: SurveyCollectionInput = {
  enabled: true,
  url: 'https://forms.example/invoice-terms-2026',
  provider: 'Example Forms',
  assurance: verified,
  fieldwork: null,
};

function blockers(overrides: Partial<SurveyCollectionInput> = {}): string {
  return surveyCollectionBlockers({ ...configured, ...overrides }).join(' | ');
}

describe('the survey collection gate', () => {
  it('is shut in this repository, because no provider has been approved', () => {
    expect(PROVIDER_ASSURANCE).toBeNull();
  });

  it('opens only when the configuration and the assurance both hold', () => {
    expect(surveyCollectionBlockers(configured)).toEqual([]);
  });

  it('stays shut while the feature flag is off', () => {
    expect(blockers({ enabled: false })).toContain('NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED is off');
  });

  it('stays shut without an HTTPS form URL', () => {
    for (const url of ['', 'http://forms.example/x', 'forms.example/x']) {
      expect(blockers({ url }), url).toContain('HTTPS form URL');
    }
  });

  it('stays shut without a provider name', () => {
    expect(blockers({ provider: '' })).toContain('does not name the provider');
  });

  it('stays shut when nobody has verified the provider', () => {
    const shut = blockers({ assurance: null });
    expect(shut).toContain('No provider assurance is recorded');
    expect(shut).toContain('lib/research/survey.ts');
  });

  it('stays shut when the assurance describes a different provider', () => {
    // Swapping the form URL to another vendor must not inherit the old checks.
    const mismatch = blockers({ provider: 'Another Vendor' });
    expect(mismatch).toContain('recorded assurance is for Example Forms');
  });

  it('stays shut when the verification date is not a real date', () => {
    expect(blockers({ assurance: { ...verified, verifiedOn: '2026-02-31' } })).toContain(
      'no valid verification date',
    );
  });

  it('refuses a provider that keeps IP addresses beside responses', () => {
    // Not collecting them is a promise the instrument makes, so this is fatal
    // rather than a claim to drop from the page.
    expect(blockers({ assurance: { ...verified, storesNoIpWithResponses: false } })).toContain(
      'cannot be used as configured',
    );
  });

  it('refuses a provider whose export does not match the column contract', () => {
    expect(blockers({ assurance: { ...verified, exportMatchesContract: false } })).toContain(
      'could not be validated',
    );
  });

  it('refuses an assurance with no retention deadline, published or not', () => {
    expect(blockers({ assurance: { ...verified, rawRetentionDays: 0 } })).toContain(
      'no raw-export retention deadline',
    );
    expect(blockers({ assurance: { ...verified, unpublishedRawRetentionDays: 0 } })).toContain(
      'no raw-export retention deadline',
    );
  });

  it('refuses when the two records disagree about whether people were paid', () => {
    // One record describes the form, the other describes recruitment. If they
    // contradict each other, the survey page and the report would make opposite
    // statements about the same fieldwork.
    expect(blockers({ fieldwork: paidPanel })).toContain('disagree about whether participants are');

    // Reconciled: a paid panel means the form is not unpaid.
    expect(
      surveyCollectionBlockers({
        ...configured,
        assurance: { ...verified, participationIsUnpaid: false },
        fieldwork: paidPanel,
      }),
    ).toEqual([]);
  });

  it('has no fieldwork record in this repository yet', () => {
    expect(FIELDWORK_RECORD).toBeNull();
  });

  it('still opens when only the claim-level facts are false', () => {
    // A provider with no confirmation identifier is usable; it just means the
    // pages must not offer a deletion route that would not work.
    expect(
      surveyCollectionBlockers({
        ...configured,
        assurance: {
          ...verified,
          showsResponseIdOnConfirmation: false,
          recordsNothingBeforeSubmit: false,
          participationIsUnpaid: false,
        },
        fieldwork: paidPanel,
      }),
    ).toEqual([]);
  });
});

describe('pages make no claim the assurance has not established', () => {
  const surveyPage = readFileSync(
    join(projectRoot, 'app/(site)/research/invoice-payment-terms-survey/page.tsx'),
    'utf8',
  );
  const privacyPage = readFileSync(
    join(projectRoot, 'app/(site)/(marketing)/privacy/page.tsx'),
    'utf8',
  );

  it('gates the IP claim on both pages', () => {
    expect(surveyPage).toContain('assurance.storesNoIpWithResponses');
    expect(privacyPage).toContain('assurance.storesNoIpWithResponses');
  });

  it('gates the "nothing is recorded before you submit" claim', () => {
    expect(surveyPage).toContain('assurance.recordsNothingBeforeSubmit');
  });

  it('gates the deletion-by-identifier route on both pages', () => {
    expect(surveyPage).toContain('assurance.showsResponseIdOnConfirmation');
    expect(privacyPage).toContain('assurance.showsResponseIdOnConfirmation');
  });

  it('gates the "unpaid" claim', () => {
    expect(surveyPage).toContain('assurance.participationIsUnpaid');
  });

  it('states retention from the assurance rather than a hardcoded number', () => {
    for (const source of [surveyPage, privacyPage]) {
      expect(source).toContain('rawRetentionDays');
      expect(source).toContain('unpublishedRawRetentionDays');
      expect(source).not.toMatch(/deleted within 90 days/);
    }
  });

  it('404s the survey route unless the whole gate is open', () => {
    expect(surveyPage).toContain('if (!collection.live) notFound();');
  });
});
