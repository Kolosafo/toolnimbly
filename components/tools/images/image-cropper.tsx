'use client';

import { Download, FlipHorizontal, FlipVertical, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { NumberField } from '@/components/forms/number-field';
import { SelectField } from '@/components/forms/select-field';
import { formatBytes, imageLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import { validateFile } from '@/lib/files/validation';
import { decodeImage, FORMAT_LABELS, formatUsesQuality, type OutputFormat } from '@/lib/image/codec';
import {
  clampCropRect,
  largestRectWithRatio,
  type Dimensions,
  type Rectangle,
} from '@/lib/image/geometry';
import { processImage, type ProcessedImage } from '@/lib/image/process';
import { parseNumericInput } from '@/lib/formatting/number';

const ASPECT_PRESETS = [
  { value: 'free', label: 'Free', ratio: null },
  { value: '1:1', label: 'Square — 1:1', ratio: 1 },
  { value: '4:3', label: 'Standard — 4:3', ratio: 4 / 3 },
  { value: '3:2', label: 'Photo — 3:2', ratio: 3 / 2 },
  { value: '16:9', label: 'Widescreen — 16:9', ratio: 16 / 9 },
];

const FORMAT_OPTIONS = [
  { value: 'same', label: 'Keep original format' },
  { value: 'image/jpeg', label: FORMAT_LABELS['image/jpeg'] },
  { value: 'image/png', label: FORMAT_LABELS['image/png'] },
  { value: 'image/webp', label: FORMAT_LABELS['image/webp'] },
];

/** Arrow keys nudge by one pixel; shift moves in larger steps. */
const NUDGE = 1;
const NUDGE_LARGE = 10;

export function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Dimensions | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Rectangle | null>(null);
  const [aspect, setAspect] = useState('free');
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState('same');
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const dragState = useRef<{ startX: number; startY: number; rect: Rectangle } | null>(null);

  useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
      objectUrls.current.clear();
    },
    [],
  );

  async function addFile(files: File[]) {
    const candidate = files[0];
    if (!candidate) return;

    const header = new Uint8Array(await candidate.slice(0, 32).arrayBuffer());
    const validation = validateFile(candidate, header, {
      accept: ['image/jpeg', 'image/png', 'image/webp'],
      maxBytes: imageLimits.maxFileBytes,
      acceptLabel: 'JPG, PNG and WebP',
    });

    if (!validation.ok) {
      setError(validation.failure.message);
      return;
    }

    try {
      const decoded = await decodeImage(candidate);
      const dimensions = { width: decoded.width, height: decoded.height };
      decoded.bitmap.close();

      const url = URL.createObjectURL(candidate);
      objectUrls.current.add(url);

      setFile(candidate);
      setSource(dimensions);
      setPreviewUrl(url);
      setCrop(largestRectWithRatio(dimensions, dimensions.width / dimensions.height));
      setError(null);
      setResult(null);
    } catch (decodeError) {
      setError(
        decodeError instanceof Error
          ? decodeError.message
          : 'This image could not be read. It may be corrupted.',
      );
    }
  }

  const applyAspect = useCallback(
    (value: string) => {
      setAspect(value);
      if (!source) return;
      const preset = ASPECT_PRESETS.find((item) => item.value === value);
      if (preset?.ratio) setCrop(largestRectWithRatio(source, preset.ratio));
    },
    [source],
  );

  /** Every update goes through the clamp, so the crop can never leave bounds. */
  const updateCrop = useCallback(
    (next: Partial<Rectangle>) => {
      if (!source || !crop) return;
      setCrop(clampCropRect({ ...crop, ...next }, source));
      setResult(null);
    },
    [crop, source],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!crop) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, rect: crop };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    const image = imageRef.current;
    if (!state || !image || !source) return;

    // Convert the pointer delta from preview pixels into source pixels, so
    // dragging moves the crop by what the user sees.
    const scale = source.width / image.clientWidth;
    updateCrop({
      x: state.rect.x + (event.clientX - state.startX) * scale,
      y: state.rect.y + (event.clientY - state.startY) * scale,
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    dragState.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!crop) return;
    const step = event.shiftKey ? NUDGE_LARGE : NUDGE;

    const moves: Record<string, Partial<Rectangle>> = {
      ArrowLeft: { x: crop.x - step },
      ArrowRight: { x: crop.x + step },
      ArrowUp: { y: crop.y - step },
      ArrowDown: { y: crop.y + step },
    };

    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      updateCrop(move);
      return;
    }

    // Plus and minus resize from the bottom-right corner.
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      updateCrop({ width: crop.width + step, height: crop.height + step });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      updateCrop({ width: crop.width - step, height: crop.height - step });
    }
  }

  async function exportCrop() {
    if (!file || !crop) return;
    setWorking(true);
    setError(null);

    try {
      const processed = await processImage(file, {
        format: format === 'same' ? null : (format as OutputFormat),
        quality: quality / 100,
        cropRect: crop,
        quarterTurns,
        flipHorizontal: flipH,
        flipVertical: flipV,
        targetWidth: crop.width,
        targetHeight: crop.height,
        lockAspectRatio: false,
        fit: 'stretch',
        allowUpscale: true,
      });
      setResult(processed);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'The image could not be cropped.');
    } finally {
      setWorking(false);
    }
  }

  const qualityApplies = format === 'same' || formatUsesQuality(format as OutputFormat);

  // Percentages, so the overlay tracks the preview at any size.
  const overlay =
    crop && source
      ? {
          left: `${(crop.x / source.width) * 100}%`,
          top: `${(crop.y / source.height) * 100}%`,
          width: `${(crop.width / source.width) * 100}%`,
          height: `${(crop.height / source.height) * 100}%`,
        }
      : null;

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      {!file ? (
        <FileDropzone
          onFiles={(files) => void addFile(files)}
          accept="image/jpeg,image/png,image/webp"
          label="Drop an image here"
          hint={`One JPG, PNG or WebP image. Up to ${formatBytes(imageLimits.maxFileBytes)}.`}
        />
      ) : null}

      {error ? (
        <div className="mt-4">
          <InlineError message={error} />
        </div>
      ) : null}

      {file && source && crop ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <div className="relative overflow-hidden rounded-lg border border-border-default bg-surface-sunken">
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="The image being cropped. Use the numeric fields below for precise control."
                    className="block w-full select-none"
                    draggable={false}
                  />
                  {overlay ? (
                    <div
                      role="application"
                      aria-label={`Crop area. Currently ${crop.width} by ${crop.height} pixels at position ${crop.x}, ${crop.y}. Use arrow keys to move, plus and minus to resize.`}
                      tabIndex={0}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onKeyDown={onKeyDown}
                      style={overlay}
                      className="absolute cursor-move touch-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--focus-ring)]"
                    >
                      <span className="sr-only">
                        Crop area, {crop.width} by {crop.height} pixels
                      </span>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <p className="mt-2 text-xs text-muted">
              Drag the highlighted area, or focus it and use the arrow keys. Plus and minus resize
              it. Hold shift for larger steps. The numeric fields below set it exactly.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuarterTurns((turns) => (turns + 1) % 4)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-sunken"
              >
                <RotateCw className="size-4" aria-hidden="true" />
                Rotate 90°
              </button>
              <button
                type="button"
                onClick={() => setFlipH((value) => !value)}
                aria-pressed={flipH}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-sunken"
              >
                <FlipHorizontal className="size-4" aria-hidden="true" />
                Flip horizontally
              </button>
              <button
                type="button"
                onClick={() => setFlipV((value) => !value)}
                aria-pressed={flipV}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-sunken"
              >
                <FlipVertical className="size-4" aria-hidden="true" />
                Flip vertically
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-lg border border-border-default bg-surface-sunken p-3">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="tabular mt-0.5 text-xs text-muted">
                {source.width} × {source.height} pixels · {formatBytes(file.size)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setSource(null);
                  setCrop(null);
                  setResult(null);
                }}
                className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
              >
                Choose a different image
              </button>
            </div>

            <SelectField
              label="Aspect ratio"
              value={aspect}
              onChange={applyAspect}
              options={ASPECT_PRESETS.map((preset) => ({
                value: preset.value,
                label: preset.label,
              }))}
            />

            <fieldset>
              <legend className="text-sm font-medium">Exact crop area</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <NumberField
                  label="X"
                  value={String(crop.x)}
                  onChange={(value) => updateCrop({ x: parseNumericInput(value) ?? crop.x })}
                  unit="px"
                />
                <NumberField
                  label="Y"
                  value={String(crop.y)}
                  onChange={(value) => updateCrop({ y: parseNumericInput(value) ?? crop.y })}
                  unit="px"
                />
                <NumberField
                  label="Crop width"
                  value={String(crop.width)}
                  onChange={(value) => updateCrop({ width: parseNumericInput(value) ?? crop.width })}
                  unit="px"
                />
                <NumberField
                  label="Crop height"
                  value={String(crop.height)}
                  onChange={(value) =>
                    updateCrop({ height: parseNumericInput(value) ?? crop.height })
                  }
                  unit="px"
                />
              </div>
            </fieldset>

            <SelectField
              label="Output format"
              value={format}
              onChange={setFormat}
              options={FORMAT_OPTIONS}
            />

            {qualityApplies ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="crop-quality" className="text-sm font-medium">
                    Quality
                  </label>
                  <output htmlFor="crop-quality" className="tabular text-sm font-semibold">
                    {quality}
                  </output>
                </div>
                <input
                  id="crop-quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-2 h-11 w-full accent-[color:var(--brand)]"
                />
              </div>
            ) : null}

            <section
              aria-label="Crop result"
              aria-live="polite"
              className="rounded-lg border border-border-default bg-surface-sunken p-4"
            >
              <p className="text-sm">
                Export will be{' '}
                <span className="tabular font-semibold">
                  {crop.width} × {crop.height}
                </span>{' '}
                pixels — full source resolution, not preview resolution.
              </p>

              <button
                type="button"
                onClick={() => void exportCrop()}
                disabled={working}
                className="mt-3 inline-flex min-h-12 items-center rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                {working ? 'Cropping…' : 'Crop image'}
              </button>

              {result ? (
                <div className="mt-4 space-y-2">
                  <p className="tabular text-sm">
                    {result.outputDimensions.width} × {result.outputDimensions.height} ·{' '}
                    {formatBytes(result.outputBytes)}
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadBlob(result.blob, result.filename)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-surface-sunken"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download {result.filename}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
