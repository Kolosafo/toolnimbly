import type { ToolContent } from '../types';

export const wordCounterContent: ToolContent = {
  slug: 'word-counter',
  valueProposition:
    'Live word, sentence and paragraph counts with reading time and keyword frequency — for any script, not just English.',
  intro:
    'Paste or type text and the counts update as you go: words, characters with and without spaces, sentences, paragraphs, estimated reading time and speaking time, plus the words that appear most often once common filler words are set aside. Segmentation uses the browser Intl.Segmenter where it is available, so Japanese, Chinese, Thai and Arabic are counted properly rather than being split on spaces that are not there.',
  steps: [
    {
      title: 'Paste or type your text',
      body: 'Every statistic recalculates as you type. There is nothing to submit and no button to press.',
    },
    {
      title: 'Adjust the reading and speaking rates',
      body: 'Defaults are 200 words a minute for silent reading and 130 for speaking aloud. Change them to match your audience or your own pace.',
    },
    {
      title: 'Review the keyword list',
      body: 'The most frequent words are listed with their counts, after a small stop-word list removes "the", "and" and similar filler.',
    },
  ],
  example: {
    title: 'Checking a conference talk against its slot',
    body: 'A 2,600-word draft at the default rates.',
    rows: [
      { label: 'Words', value: '2,600' },
      { label: 'Speaking time at 130 wpm', value: 'about 20 minutes' },
      { label: 'Reading time at 200 wpm', value: 'about 13 minutes' },
      { label: 'Implication for a 25-minute slot', value: 'Roughly right, with no room for questions' },
    ],
    conclusion:
      'Speaking time is the number that matters for a talk, and it is substantially longer than reading time. Tools that only report reading time will make a script look far shorter than it is.',
  },
  method: {
    title: 'How the counts are made',
    body: 'Where the browser supports it, Intl.Segmenter splits the text into words and sentences using Unicode rules. Only segments the standard classes as word-like are counted, so punctuation and whitespace are excluded.',
    formulas: [
      'reading time  = words ÷ reading rate (default 200 wpm)',
      'speaking time = words ÷ speaking rate (default 130 wpm)',
      'paragraphs    = blocks separated by one or more blank lines',
    ],
    notes: [
      'Unicode-aware segmentation is what makes the count correct for languages that do not put spaces between words.',
      'Where Intl.Segmenter is unavailable, the tool falls back to a documented regular-expression split and says so, because that fallback is less accurate for those scripts.',
      'Unicode segmentation breaks on a hyphen, so "well-known" counts as two words. Most word processors count it as one, which is the usual reason a figure here differs slightly from Word or Google Docs.',
    ],
  },
  limitations: [
    'Reading and speaking rates are averages. Dense technical prose is read more slowly than a news article, and presenters vary widely.',
    'Sentence detection is rule-based. Abbreviations such as "e.g." and decimal points inside numbers can occasionally be read as sentence endings.',
    'The stop-word list is small and English-only. Keyword frequency for other languages will include common function words.',
    'Keyword counts are literal string frequencies. There is no stemming, so "run" and "running" count separately.',
    'Hyphenated compounds count as two words, following the Unicode rules. Word processors usually count them as one, so a hyphen-heavy document will read slightly longer here than in Word.',
    'Very large documents are debounced to keep typing responsive, so the counts may lag a keystroke or two behind.',
  ],
  privacyNote:
    'Your text stays in this page. It is held in memory only, never uploaded, never stored, and cleared when you reset or close the tab.',
  faqs: [
    {
      question: 'How is a word defined here?',
      answer:
        'As a word-like segment under Unicode segmentation rules rather than as anything between two spaces. That is what lets the tool count Japanese, Chinese and Thai correctly, where there are no spaces to split on. The same rules break on a hyphen, so "well-known" counts as two words here and as one in most word processors.',
    },
    {
      question: 'How accurate is the reading time?',
      answer:
        'It is an estimate from an average rate. Adult silent reading of general prose typically falls between 200 and 250 words a minute, so the default of 200 is slightly conservative. Technical or unfamiliar material can be much slower, and the rate is adjustable for that reason.',
    },
    {
      question: 'Why is speaking time longer than reading time?',
      answer:
        'Because speech is slower than silent reading — around 130 words a minute for clear, unhurried delivery against roughly 200 for reading. If you are timing a talk or a voiceover, the speaking figure is the one to use.',
    },
    {
      question: 'Does the counter work with languages other than English?',
      answer:
        'Yes, wherever the browser provides Intl.Segmenter, which covers all current major browsers. Scripts without spaces between words are segmented properly. The keyword stop-word list is English-only, so frequency results in other languages will include common function words.',
    },
    {
      question: 'Is my text sent anywhere for analysis?',
      answer:
        'No. Every count, including the keyword frequency analysis, runs in your browser. Nothing is uploaded, and no part of your text appears in any analytics event.',
    },
  ],
};
