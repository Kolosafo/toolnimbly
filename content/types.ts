/**
 * Editorial content modules (spec §8.3).
 *
 * One reviewed module per tool. Content is server-rendered so search engines
 * and assistive technology see it without executing the tool bundle.
 */

export type ContentStep = {
  /** Imperative step title, e.g. "Choose a mode". */
  readonly title: string;
  /** One or two sentences of detail. */
  readonly body: string;
};

export type ContentExampleRow = {
  readonly label: string;
  readonly value: string;
};

export type ContentExample = {
  readonly title: string;
  /** Sets up the scenario in plain language. */
  readonly body: string;
  /** Optional labelled figures rendered as a description list. */
  readonly rows?: readonly ContentExampleRow[];
  /** Optional closing sentence interpreting the result. */
  readonly conclusion?: string;
};

export type ContentMethod = {
  readonly title: string;
  readonly body: string;
  /** Formulae rendered in a monospace block, one per line. */
  readonly formulas?: readonly string[];
  /** Notes that follow the formula block. */
  readonly notes?: readonly string[];
  /** Context for external references and assumptions shown beside the method. */
  readonly sourceNote?: string;
};

export type ContentFaq = {
  readonly question: string;
  readonly answer: string;
};

export type ContentSource = {
  readonly label: string;
  readonly url: string;
};

export type ToolContent = {
  /** Must match a registry slug exactly. */
  readonly slug: string;
  /** Short value proposition shown directly under the H1 (spec §5.2). */
  readonly valueProposition: string;
  /** 40–100 word direct introduction. */
  readonly intro: string;
  /** Three to five usage steps. */
  readonly steps: readonly ContentStep[];
  /** At least one worked example or concrete use case. */
  readonly example: ContentExample;
  /** Formula or file-processing explanation, where one applies. */
  readonly method?: ContentMethod;
  /** Honest limitations. Rendered as a list above the FAQs. */
  readonly limitations: readonly string[];
  /** Tool-specific privacy sentence. Short shared disclosures live in the shell. */
  readonly privacyNote: string;
  /** Three to six FAQs with original answers. Also the source for FAQ schema. */
  readonly faqs: readonly ContentFaq[];
  /** Method or reference sources, cited where a formula has a standard origin. */
  readonly sources?: readonly ContentSource[];
  /**
   * Disclaimer rendered immediately next to the result area for health and
   * finance tools (spec §8.5).
   */
  readonly resultDisclaimer?: string;
};
