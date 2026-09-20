import type { ToolContent } from '../types';

export const characterCounterContent: ToolContent = {
  slug: 'character-counter',
  valueProposition:
    'Three different character counts, because software and people do not agree on what a character is.',
  intro:
    'Ask how many characters are in a piece of text and there are at least three defensible answers. This counter gives all of them: the number people perceive, the UTF-16 length that most programming languages report, and the UTF-8 byte size that matters for databases and network payloads. Set a limit and it tracks how much room is left. A family emoji counts as one visible character here, and as eleven UTF-16 units — which is exactly the gap that catches people out.',
  steps: [
    {
      title: 'Paste or type your text',
      body: 'Counts update live. Nothing needs submitting.',
    },
    {
      title: 'Set a character limit if you have one',
      body: 'Enter the limit your platform enforces and the counter shows characters remaining, switching to an over-limit count once you pass it.',
    },
    {
      title: 'Read the count that applies to you',
      body: 'Use the visible count for human-facing limits, the technical length when a developer tool reports a different number, and the byte size for storage or payload constraints.',
    },
  ],
  example: {
    title: 'Why one emoji can be eleven characters',
    body: 'The family emoji 👨‍👩‍👧‍👦 is a single picture built from four people joined by invisible connectors.',
    rows: [
      { label: 'Visible characters (graphemes)', value: '1' },
      { label: 'Technical length (UTF-16 units)', value: '11' },
      { label: 'UTF-8 bytes', value: '25' },
    ],
    conclusion:
      'A field that allows "100 characters" might mean any of these three. If a form rejects text that looks well within its limit, an emoji or an accented character is usually the reason.',
  },
  method: {
    title: 'The three ways to count',
    body: 'Each count answers a different question, and none of them is wrong — they are measuring different things.',
    formulas: [
      'graphemes  what a reader sees as one character (Intl.Segmenter)',
      'UTF-16     what JavaScript string.length reports',
      'UTF-8      bytes on disk or on the wire (TextEncoder)',
    ],
    notes: [
      'Most Latin text gives identical numbers for all three, which is why the difference goes unnoticed until an emoji or an accented character appears.',
      'A character with a combining accent, such as e followed by a combining acute, is one grapheme but two UTF-16 units.',
      'Where Intl.Segmenter is unavailable, the tool falls back to counting Unicode code points and says so, since that splits emoji sequences apart.',
    ],
  },
  limitations: [
    'Platforms differ in what they count. Some social networks weight certain characters differently or exclude links from the total, so their counter may not match any of these three.',
    'Grapheme counting depends on the browser Unicode data. A very new emoji may segment differently on an older browser.',
    'Line counting treats a line break as a separator; whether a trailing newline creates an extra empty line is a convention, and this tool does not count it as one.',
    'Very large inputs are debounced to keep typing smooth, so counts may briefly lag behind.',
  ],
  privacyNote:
    'Your text never leaves this page. It is held in memory, never uploaded, and cleared on reset or when the tab closes.',
  faqs: [
    {
      question: 'Which count should I use for a social media limit?',
      answer:
        'Start with the visible character count, since most platforms describe limits in terms people can see. If the platform still rejects your text, its counter is probably using UTF-16 length or applying its own weighting — compare against the technical length shown here.',
    },
    {
      question: 'Why does an emoji count as several characters?',
      answer:
        'Because many emoji are sequences: skin-tone variants, flags and family emoji are built from several code points joined by invisible connectors. They render as one picture but occupy several UTF-16 units and many UTF-8 bytes.',
    },
    {
      question: 'What is the difference between characters and bytes?',
      answer:
        'Bytes are how the text is stored. In UTF-8, plain English characters take one byte each, most accented and Greek or Cyrillic characters take two, most CJK characters take three, and emoji take four or more. A 255-byte database column therefore holds far fewer than 255 characters of non-Latin text.',
    },
    {
      question: 'Do spaces and line breaks count?',
      answer:
        'In the main counts, yes. There is a separate figure excluding all whitespace, which is the one to use when a requirement is about content length rather than raw field length.',
    },
    {
      question: 'How do I count characters excluding spaces?',
      answer:
        'It is shown as its own statistic. It strips spaces, tabs and line breaks, which is usually what an academic word-limit or a printing constraint actually means.',
    },
    {
      question: 'Why does my word processor report a different number?',
      answer:
        'Word processors usually count the whole document, including headers, footers, footnotes and text boxes, and some exclude them from one figure but not another. They also differ on whether a paragraph mark counts. This tool counts exactly the text in the box and shows each definition separately, so you can see which one matches the limit you have been given.',
    },
  ],
};
