import { features } from '@/lib/config/features';
import { cn } from '@/lib/utils/cn';

export type AdPlacement = 'below-result' | 'in-content' | 'desktop-rail';

/**
 * Ad placeholder (spec §9).
 *
 * Ads are disabled for launch. While disabled this renders nothing at all —
 * not an empty reserved box — so no vertical space is wasted and no layout
 * shift is introduced. When enabled, each placement reserves exact dimensions
 * before any provider script runs, which is what keeps CLS at zero.
 *
 * Placements are deliberately constrained: never between an input and its
 * primary action, and never styled to resemble a download control.
 */
const placementDimensions: Record<AdPlacement, { className: string; label: string }> = {
  'below-result': { className: 'min-h-[280px] w-full max-w-[336px]', label: 'Advertisement' },
  'in-content': { className: 'min-h-[250px] w-full max-w-[728px]', label: 'Advertisement' },
  'desktop-rail': { className: 'hidden xl:block min-h-[600px] w-[160px]', label: 'Advertisement' },
};

export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  if (!features.adsEnabled) return null;

  const { className: sizeClass, label } = placementDimensions[placement];

  return (
    <aside
      aria-label={label}
      data-ad-placement={placement}
      className={cn('mx-auto my-8 flex items-center justify-center', sizeClass, className)}
    >
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
    </aside>
  );
}
