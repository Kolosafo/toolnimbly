import type { GuideContent } from './types';

export const countingWordsAndCharacters: GuideContent = {
  slug: 'counting-words-and-characters',
  standfirst:
    'Two tools counting the same sentence can disagree by a wide margin, and both can be right. The definitions differ.',
  intro: [
    'Word and character counts feel like they ought to be facts. They are not: they are the output of a definition, and there is no single definition in use. A word processor, a social network, a university submission portal and a database column can each count the same paragraph and produce four different numbers, because each is answering a slightly different question.',
    'Knowing which question your limit is asking is the whole skill. Below are the definitions that actually circulate, where they disagree, and which one to trust when a limit is being enforced against you.',
  ],
  sections: [
    {
      heading: 'Three different things called "character"',
      paragraphs: [
        'The confusion starts with a single emoji. Take the family emoji 👩‍👩‍👧. To you it is one character. Stored as UTF-16, the encoding JavaScript and many other systems use internally, it is eleven code units. Stored as UTF-8 bytes, which is what a database column or an SMS gateway is usually measuring, it is more again.',
        'Each of those is a legitimate count of something. What the reader perceives as one character is a grapheme cluster. What a program iterating over a string sees is code units. What a storage limit measures is bytes. They coincide exactly for plain English text, which is why the distinction stays invisible until someone types an emoji, an accented letter, or a word in Hindi or Thai.',
        'The practical rule: when a limit is imposed by a person — a word count on an essay, a character limit in a style guide — they mean graphemes. When it is imposed by a system — a database field, an SMS segment, a URL — it almost certainly means bytes or code units, and it will be enforced without sympathy.',
      ],
      bullets: [
        'Grapheme: what a reader sees as one character. The count humans mean.',
        'Code unit: how the text is represented in memory. What naive code counts.',
        'Byte: how it is stored or transmitted. What technical limits measure.',
      ],
    },
    {
      heading: 'Why word counts disagree',
      paragraphs: [
        'Words look simpler and are not. The common shortcut — split on spaces and count the pieces — fails immediately outside English. Japanese, Chinese and Thai do not put spaces between words at all, so splitting on whitespace returns something close to the number of sentences.',
        'Doing it properly means asking the system for real word boundaries, which is what the Unicode segmentation rules define and what a browser exposes through Intl.Segmenter. That handles unspaced scripts correctly, and it also decides the awkward English cases consistently.',
        'Those awkward cases are where two tools most often part company. Is "state-of-the-art" one word or four? Is "don’t" one or two? Does a standalone numeral count? Is an em dash between two words a separator? There is no universally right answer, which is exactly why a count should tell you its rule rather than presenting a bare number as though it were objective.',
      ],
    },
    {
      heading: 'Platform limits and what they really measure',
      paragraphs: [
        'Social platforms each apply their own arithmetic, and it rarely matches a naive character count. Some count a link as a fixed length regardless of the real URL. Some weight characters by script, so text in Latin script counts differently from the same length in Japanese. Some count an emoji as two.',
        'SMS has the strictest and least forgiving rule. A message restricted to a basic Latin alphabet fits 160 characters per segment; include a single character outside that set — a curly apostrophe pasted from a word processor is the classic culprit — and the whole message switches encoding and drops to 70 characters per segment. One invisible substitution can more than double the cost of a bulk send.',
        'The safe approach with any external limit is to check against the platform itself before committing, and to treat any local count as an estimate that is accurate for plain text and approximate for everything else.',
      ],
    },
    {
      heading: 'Changing case is not simple either',
      paragraphs: [
        'Case conversion looks like the most mechanical operation imaginable and contains one genuine trap: it is language-dependent. In Turkish and Azerbaijani, the uppercase of "i" is "İ" (a capital I with a dot), and the lowercase of "I" is "ı" (a dotless i). Applying English rules to Turkish text produces words that are wrong, and applying Turkish rules to English produces "İNDEX".',
        'German has its own case: the lowercase ß uppercases to "SS" in traditional orthography, so the string gets longer. Any code assuming case conversion preserves length is wrong, and any code assuming it round-trips is also wrong.',
        'Title case is not a Unicode operation at all but an editorial convention, and the conventions disagree with each other about which short words stay lowercase. A tool can only implement one of them; check its rule against whichever style guide you are being held to.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Why does my word processor report a different word count?',
      answer:
        'Because it counts a different region and applies different rules. Most count headers, footers, footnotes and text boxes; some exclude them from one figure but not another, and they differ on hyphenated words and standalone numerals. Neither number is wrong, but only one matches your limit.',
    },
    {
      question: 'Does one emoji count as one character?',
      answer:
        'To a reader, yes. To most systems, no. A single family or flag emoji is built from several code points joined together, so a count measuring code units or bytes will report far more than one. Which figure matters depends entirely on who is enforcing the limit.',
    },
    {
      question: 'How many characters is a tweet or a text message?',
      answer:
        'Platform rules vary and change. For SMS the rule is firm: 160 characters per segment using the basic alphabet, dropping to 70 as soon as any character outside it appears — including a curly apostrophe. Always confirm against the platform before a send that costs money.',
    },
    {
      question: 'Should I count words with or without spaces?',
      answer:
        'Spaces do not affect word counts — only character counts, where the distinction is real and the reason tools report both. Publishers and academic limits usually mean characters including spaces; technical field limits usually mean bytes.',
    },
    {
      question: 'How is reading time estimated?',
      answer:
        'By dividing the word count by an assumed rate, commonly around 200 words a minute for silent reading and closer to 130 for reading aloud. It is a rough guide: difficulty, formatting, tables and images all change real reading time, and none of them appear in a word count.',
    },
  ],
  keyPoints: [
    'There is no single definition of "character" — graphemes, code units and bytes all have a claim.',
    'People mean graphemes; systems enforce bytes or code units.',
    'Splitting on spaces fails for Japanese, Chinese and Thai; proper segmentation does not.',
    'SMS drops from 160 to 70 characters per segment the moment one non-basic character appears.',
    'Case conversion is language-dependent, and can change a string’s length.',
  ],
};
