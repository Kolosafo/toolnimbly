export type ToolSocialImage = {
  readonly title: string;
  readonly differentiator: string;
  readonly alt: string;
  readonly accent: string;
};

export const PRIORITY_TOOL_SOCIAL_IMAGES: Readonly<Record<string, ToolSocialImage>> = {
  'invoice-generator': {
    title: 'Free Invoice Generator',
    differentiator: 'PDF • No signup',
    alt: 'ToolNimbly Free Invoice Generator — PDF, no signup',
    accent: '#38bdf8',
  },
  'receipt-generator': {
    title: 'Free Receipt Generator',
    differentiator: 'Printable payment receipt',
    alt: 'ToolNimbly Free Receipt Generator — printable payment receipt PDF',
    accent: '#2dd4bf',
  },
  'compound-interest-calculator': {
    title: 'Compound Interest Calculator',
    differentiator: 'Regular contributions',
    alt: 'ToolNimbly Compound Interest Calculator — regular contributions',
    accent: '#a78bfa',
  },
  'salary-calculator': {
    title: 'Salary to Hourly Calculator',
    differentiator: 'Gross pay conversion',
    alt: 'ToolNimbly Salary to Hourly Calculator — gross pay conversion',
    accent: '#fbbf24',
  },
  'loan-calculator': {
    title: 'Loan Calculator',
    differentiator: 'Extra payments • Amortization',
    alt: 'ToolNimbly Loan Calculator — extra payments and amortization',
    accent: '#fb7185',
  },
};

export function toolSocialImagePath(slug: string): string | undefined {
  return PRIORITY_TOOL_SOCIAL_IMAGES[slug] ? `/tools/${slug}/social-image` : undefined;
}
