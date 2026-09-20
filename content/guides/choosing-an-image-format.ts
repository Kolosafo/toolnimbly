import type { GuideContent } from './types';

export const choosingAnImageFormat: GuideContent = {
  slug: 'choosing-an-image-format',
  standfirst:
    'Photographs and flat graphics compress in opposite ways. Almost every bad image on the web is the wrong one of those in the wrong format.',
  intro: [
    'There is no best image format, but there is a reliable way to choose one. Every format in common use is built around an assumption about what its pictures look like, and it performs well exactly when that assumption holds. JPEG assumes photographs. PNG assumes flat colour and sharp edges. Give either one the other kind of image and you get a file that is too big, too ugly, or both.',
    'What follows is the decision, the reason behind it, and the conversions that quietly cost you quality for no benefit.',
  ],
  sections: [
    {
      heading: 'Lossy and lossless are different promises',
      paragraphs: [
        'Lossless compression — PNG, GIF, WebP in its lossless mode — stores the image so that every pixel comes back exactly as it went in. It finds savings in repetition, which is why a screenshot with large areas of identical colour compresses dramatically and a photograph of foliage barely compresses at all.',
        'Lossy compression — JPEG, WebP and AVIF in their usual modes — discards information the eye is poor at noticing, chiefly fine colour variation, and keeps the detail the eye attends to. That is why it achieves ten-fold savings on photographs, and why it produces the smeared halos and blocky patches you see when it is pushed too far or applied to sharp-edged graphics.',
        'The distinction that matters in practice is not quality but repetition. A lossless file can be opened, edited and re-saved indefinitely with no degradation. A lossy file loses a little more every time it is re-encoded, and those losses accumulate and cannot be undone.',
      ],
    },
    {
      heading: 'The choice, in one paragraph each',
      paragraphs: [
        'Use JPEG for photographs that are finished and headed for the web or for sharing. It is universally supported, and at a sensible quality setting the artefacts are invisible at normal viewing sizes.',
        'Use PNG for anything with flat colour, sharp edges or transparency: logos, icons, diagrams, screenshots of text, and any image you intend to keep editing. Put a photograph in a PNG and you will typically get a file several times larger than the JPEG for no visible gain.',
        'Use WebP when you want JPEG’s savings with transparency, or PNG’s fidelity at a smaller size. It is supported by every current browser and handles both modes. Use AVIF when file size matters more than anything and you can afford slower encoding; it generally beats WebP, particularly at low bitrates.',
      ],
      bullets: [
        'Photograph, going on the web → JPEG, or WebP/AVIF for smaller files.',
        'Logo, icon, diagram, screenshot of text → PNG, or lossless WebP.',
        'Needs transparency → PNG, WebP or AVIF. Never JPEG, which has no alpha channel.',
        'Still being edited → something lossless, whatever it will eventually be published as.',
      ],
    },
    {
      heading: 'Conversions that cost you something for nothing',
      paragraphs: [
        'Converting a JPEG to a PNG does not restore quality. The JPEG artefacts were baked into the pixels when it was first saved; PNG preserves those pixels faithfully, artefacts included, in a much larger file. The conversion is worth doing when you are about to edit the image repeatedly, or add transparency, or satisfy a tool that demands PNG — and not otherwise.',
        'Converting a PNG to a JPEG discards the alpha channel, because JPEG cannot represent it. Whatever was transparent becomes a solid colour, usually white, and there is no way back. For a photograph that never had transparency this is a sensible way to shrink a file; for a logo it destroys the thing that made the logo usable.',
        'Re-saving a JPEG at high quality does not undo earlier losses either. Each encode discards a little more. If you must edit a JPEG, do the whole edit in one session and save once.',
      ],
    },
    {
      heading: 'Resize first, then compress',
      paragraphs: [
        'The single largest saving available on most web images is not the format. It is the dimensions. A 4,000-pixel-wide photograph displayed in a 800-pixel column carries twenty-five times more pixels than it can show, and no amount of compression tuning recovers what resizing gives you immediately.',
        'The order matters. Resize to the largest size the image will actually be displayed at, and compress afterwards. Compressing first and resizing second means the encoder spent its effort preserving detail you then threw away, and the artefacts it introduced get scaled along with everything else.',
        'Once the dimensions are right, quality settings between about 75 and 85 are the useful range for JPEG. Below that, artefacts become visible on flat areas and around edges; above it, the file grows quickly for differences most people cannot see.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Is PNG better quality than JPG?',
      answer:
        'PNG is lossless, so it reproduces its source exactly — but if that source is a JPEG, it reproduces the JPEG’s artefacts exactly too. For an image that started as a photograph, PNG gives you a larger file of identical quality, not a better one.',
    },
    {
      question: 'Why did my PNG get bigger when I converted it from JPG?',
      answer:
        'Because JPEG achieved its size by discarding detail, and PNG keeps everything it is given. Photographic content is full of fine variation, which lossless compression cannot reduce much. A several-fold increase is normal and expected.',
    },
    {
      question: 'Should I just use WebP for everything?',
      answer:
        'For the web, largely yes — it handles both photographs and flat graphics, supports transparency, and every current browser reads it. Keep JPEG or PNG when a file has to be opened by older software, sent to a printer, or accepted by a system that names the formats it takes.',
    },
    {
      question: 'Does resizing an image reduce its quality?',
      answer:
        'Making it smaller discards pixels, which is exactly what you want when the image is displayed smaller than it is stored. Making it larger cannot add detail that was never captured, so enlarging beyond the original dimensions produces a softer picture, not a sharper one.',
    },
    {
      question: 'What quality setting should I use for JPEG?',
      answer:
        'Between 75 and 85 for most photographs. The scale is not a percentage of anything meaningful and is not comparable between encoders, so judge by looking at the result at the size it will be viewed — particularly around sharp edges and across areas of flat colour, where artefacts appear first.',
    },
  ],
  keyPoints: [
    'Lossy formats assume photographs; lossless formats assume flat colour and edges.',
    'JPEG for finished photographs, PNG for graphics and transparency, WebP or AVIF when size matters most.',
    'Converting JPG to PNG never recovers quality — it preserves the artefacts in a bigger file.',
    'Converting PNG to JPG destroys transparency irreversibly.',
    'Resize to the displayed size before compressing; it usually saves more than any format choice.',
  ],
};
