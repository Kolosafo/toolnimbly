import type { ToolContent } from '../types';

export const caseConverterContent: ToolContent = {
  slug: 'case-converter',
  valueProposition:
    'Ten casing conventions, applied without destroying your original text.',
  intro:
    'Convert text between ten conventions: lowercase, UPPERCASE, Sentence case, Title Case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and alternating case. Your original stays in place next to the result, so a conversion is never a one-way door. Locale-aware casing is supported, which matters for Turkish dotted and dotless i and for German sharp s — the cases where a naive uppercase transformation produces the wrong word.',
  steps: [
    {
      title: 'Paste your text',
      body: 'The original is preserved in its own field and is not modified by any conversion.',
    },
    {
      title: 'Choose a case',
      body: 'Each option shows a live preview of the result, so you can see what a convention does before committing to it.',
    },
    {
      title: 'Set the locale if it matters',
      body: 'Defaults to your browser locale. Change it when converting Turkish, Azerbaijani, Lithuanian or German text, where casing rules differ from the default.',
    },
    {
      title: 'Copy or download the result',
      body: 'Copy to the clipboard or save the converted text as a file. The original remains untouched either way.',
    },
  ],
  example: {
    title: 'One phrase in every convention',
    body: 'Starting from: user profile image URL',
    rows: [
      { label: 'lowercase', value: 'user profile image url' },
      { label: 'UPPERCASE', value: 'USER PROFILE IMAGE URL' },
      { label: 'Sentence case', value: 'User profile image url' },
      { label: 'Title Case', value: 'User Profile Image URL' },
      { label: 'camelCase', value: 'userProfileImageUrl' },
      { label: 'PascalCase', value: 'UserProfileImageUrl' },
      { label: 'snake_case', value: 'user_profile_image_url' },
      { label: 'kebab-case', value: 'user-profile-image-url' },
      { label: 'CONSTANT_CASE', value: 'USER_PROFILE_IMAGE_URL' },
    ],
    conclusion:
      'The programming conventions collapse whitespace and punctuation into a single separator, which is why they are safe for identifiers and filenames but lossy for prose.',
  },
  method: {
    title: 'How each conversion works',
    body: 'Prose conversions change letter casing and leave the structure alone. Identifier conversions first split the text into words at spaces, punctuation and existing case boundaries, then rejoin them with the target separator.',
    formulas: [
      'lowercase / UPPERCASE   locale-aware casing, structure untouched',
      'Sentence case           first letter of each sentence capitalised',
      'Title Case              each word capitalised, minor words lowercased',
      'camelCase               words joined, first word lowercase',
      'PascalCase              words joined, every word capitalised',
      'snake_case              words joined with underscores, lowercased',
      'kebab-case              words joined with hyphens, lowercased',
      'CONSTANT_CASE           words joined with underscores, uppercased',
      'alternating case        letters alternate, non-letters skipped',
    ],
    notes: [
      'Alternating case is deterministic: it starts lowercase and only advances the alternation on letters, so the same input always produces the same output regardless of punctuation.',
      'Locale selection matters more than it looks. In Turkish, uppercasing "i" gives "İ" rather than "I", and the default locale gets that wrong.',
      'Digits and emoji pass through the identifier conversions unchanged, and are treated as word boundaries where that is the sensible reading.',
    ],
  },
  limitations: [
    'Title Case uses a documented list of minor words. It cannot know that a particular word is a proper noun, a brand name or part of a quoted title, so editorial review is still needed.',
    'Sentence case relies on sentence detection, which can be fooled by abbreviations like "Dr." or "e.g." and by decimal points inside numbers.',
    'The identifier conversions are lossy. Converting to snake_case and back will not restore the original punctuation or capitalisation.',
    'Acronyms are handled by convention rather than knowledge: "URL" becomes "Url" in PascalCase, which some style guides prefer and others do not.',
  ],
  privacyNote:
    'All conversion happens in your browser. Neither the original nor the converted text is uploaded, stored or logged.',
  faqs: [
    {
      question: 'What is the difference between Title Case and Sentence case?',
      answer:
        'Title Case capitalises most words in a heading, leaving short articles, conjunctions and prepositions lowercase unless they start or end the title. Sentence case capitalises only the first word of each sentence, plus any proper nouns that were already capitalised.',
    },
    {
      question: 'When should I use camelCase rather than snake_case?',
      answer:
        'It is a convention, not a rule, and it follows the language. JavaScript, Java and C# lean camelCase and PascalCase; Python, Ruby and SQL lean snake_case; CSS classes and URL slugs use kebab-case. Match whatever the surrounding code already does.',
    },
    {
      question: 'Why does the locale setting matter?',
      answer:
        'Because casing is language-specific. The best-known example is Turkish, where lowercase "i" uppercases to "İ" and the dotless "ı" uppercases to "I". Using the wrong locale there produces a different word, not just different styling.',
    },
    {
      question: 'Will converting my text lose anything?',
      answer:
        'The prose conversions preserve everything except letter casing. The identifier conversions deliberately discard spacing and punctuation, so they are lossy — which is why the original text stays on screen next to the result.',
    },
    {
      question: 'How does alternating case treat punctuation and numbers?',
      answer:
        'It skips them. The alternation only advances on letters, so a space or a comma does not flip the pattern. This makes the output deterministic and repeatable, which a naive position-based implementation is not.',
    },
  ],
};
