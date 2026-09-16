import type { ToolContent } from '../types';

export const pngCompressorContent: ToolContent = {
  slug: 'png-compressor',
  valueProposition:
    'Two honest PNG modes: keep every pixel, or reduce colours for a much smaller file. Transparency survives both.',
  intro:
    'PNG is a lossless format, which means a genuinely lossless pass can only rearrange how the data is stored — sometimes that saves a lot, sometimes nothing at all. This tool is explicit about that. Lossless mode preserves every pixel and returns your original untouched if it cannot do better. Lossy mode reduces the number of colours, which shrinks screenshots and graphics dramatically at the cost of some colour accuracy. Transparency is preserved in both.',
  steps: [
    {
      title: 'Add your PNG files',
      body: 'PNG only. Up to 20 MB each and 20 files per batch. Transparency is detected and preserved automatically.',
    },
    {
      title: 'Choose lossless or smaller-file mode',
      body: 'Lossless keeps every pixel exactly. Smaller-file reduces the colour palette, which works extremely well on screenshots, logos and flat graphics.',
    },
    {
      title: 'Compare the results',
      body: 'Each file shows its original size, new size and the saving. In lossless mode, a file that cannot be improved is returned unchanged with an explanation rather than a fake saving.',
    },
    {
      title: 'Download',
      body: 'Individually, or all of them as a ZIP.',
    },
  ],
  example: {
    title: 'A UI screenshot in both modes',
    body: 'A 1,600 × 1,000 application screenshot of about 890 KB — mostly flat colour with text.',
    rows: [
      { label: 'Lossless mode', value: 'about 840 KB — a 6% saving' },
      { label: 'Smaller-file mode, 128 colours', value: 'about 190 KB — a 79% saving' },
      { label: 'Visible difference', value: 'None in the interface; slight banding in any photographic area' },
    ],
    conclusion:
      'Screenshots are the ideal case for palette reduction, because a user interface genuinely uses only a few dozen distinct colours. A photograph in the same mode would show obvious banding.',
  },
  method: {
    title: 'How each mode works',
    body: 'Lossless mode re-encodes the image with no change to any pixel value. Smaller-file mode first reduces the image to a limited palette, then encodes that — fewer distinct colours compress far better.',
    notes: [
      'PNG uses DEFLATE compression over filtered rows of pixels. Images with large areas of identical colour compress well; photographic noise does not.',
      'Because there is no detail to discard in a lossless pass, the only gains come from better filtering and encoding — which the browser encoder may or may not manage.',
      'Palette reduction is what dedicated PNG optimisers do to achieve their headline savings. It is a lossy operation, and this tool labels it as one rather than calling it "optimisation".',
      'Alpha transparency is preserved in both modes, including partial transparency in soft shadows and antialiased edges.',
    ],
  },
  limitations: [
    'Lossless savings are often small. If the file was already written by a good encoder, there may be nothing left to gain, and the tool will say so rather than invent a saving.',
    'Smaller-file mode changes colours. It suits screenshots, logos and flat illustration; it produces visible banding in photographs and gradients.',
    'Animated PNG is not supported. Animated files are detected and rejected rather than silently flattened to a single frame.',
    'For a photograph, converting to JPEG or WebP will almost always beat any PNG optimisation. Use the PNG to JPG converter for that.',
    'Maximum 20 MB and 40 megapixels per image, 20 files per batch.',
  ],
  privacyNote:
    'Images are decoded and re-encoded entirely in your browser. Nothing is uploaded, and no copy is retained after you close the tab.',
  faqs: [
    {
      question: 'Can PNG really be compressed without losing quality?',
      answer:
        'Yes, but only by storing the same pixels more efficiently, and the scope for that is limited. Expect single-digit or low double-digit percentage savings from a genuinely lossless pass — and sometimes none at all if the file was already well encoded.',
    },
    {
      question: 'Why do other tools claim much bigger PNG savings?',
      answer:
        'Because most of them reduce the colour palette, which is lossy, while still describing it as optimisation. That is exactly what the smaller-file mode here does — the difference is that this tool tells you which one you chose.',
    },
    {
      question: 'Will transparency survive?',
      answer:
        'Yes, in both modes, including partial transparency in antialiased edges and soft shadows. Transparency is only lost if you convert to JPEG, which the PNG to JPG tool handles with an explicit background colour choice.',
    },
    {
      question: 'Should my photo be a PNG at all?',
      answer:
        'Usually not. PNG was designed for graphics with flat colour and sharp edges. For photographs, JPEG or WebP will produce a file many times smaller at quality you cannot distinguish by eye.',
    },
    {
      question: 'What happens if the compressed file is larger than the original?',
      answer:
        'The tool reports it plainly and recommends keeping the original. It will not present a larger file as a successful compression.',
    },
  ],
};
