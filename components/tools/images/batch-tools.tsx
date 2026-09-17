'use client';

import { ImageBatchTool, type BatchToolConfig } from './image-batch-tool';

/**
 * The five format-specific batch tools (spec §6.16, §6.17, §6.18, §6.21,
 * §6.22). Each is a configuration of the shared pipeline, not a reimplementation
 * of it — which is what keeps their behaviour identical where it should be.
 */

const IMAGE_COMPRESSOR: BatchToolConfig = {
  accept: ['image/jpeg', 'image/png', 'image/webp'],
  acceptLabel: 'JPG, PNG and WebP',
  acceptAttribute: 'image/jpeg,image/png,image/webp',
  formats: [null, 'image/jpeg', 'image/png', 'image/webp'],
  defaultFormat: null,
  defaultQuality: 80,
  showQuality: true,
  showDimensionCaps: true,
  showMatte: true,
  actionLabel: 'Compress images',
  archiveName: 'compressed-images',
  dropzoneLabel: 'Drop images here',
};

const JPG_COMPRESSOR: BatchToolConfig = {
  accept: ['image/jpeg'],
  acceptLabel: 'JPG and JPEG only',
  acceptAttribute: 'image/jpeg',
  formats: ['image/jpeg'],
  defaultFormat: 'image/jpeg',
  defaultQuality: 80,
  showQuality: true,
  showDimensionCaps: true,
  showMatte: false,
  actionLabel: 'Compress JPGs',
  archiveName: 'compressed-jpgs',
  dropzoneLabel: 'Drop JPG photos here',
  notice:
    'JPEG is lossy, so each re-encode discards a little more detail. Work from the original file where you can.',
};

const PNG_COMPRESSOR: BatchToolConfig = {
  accept: ['image/png'],
  acceptLabel: 'PNG only',
  acceptAttribute: 'image/png',
  formats: ['image/png'],
  defaultFormat: 'image/png',
  defaultQuality: 100,
  showQuality: false,
  showDimensionCaps: true,
  showMatte: false,
  actionLabel: 'Compress PNGs',
  archiveName: 'compressed-pngs',
  dropzoneLabel: 'Drop PNG images here',
  notice:
    'This is the lossless pass: every pixel and the full alpha channel are preserved. Savings come from the encoder alone and are often small — sometimes zero. Capping the dimensions above is what reliably reduces a PNG.',
};

const JPG_TO_PNG: BatchToolConfig = {
  accept: ['image/jpeg'],
  acceptLabel: 'JPG and JPEG only',
  acceptAttribute: 'image/jpeg',
  formats: ['image/png'],
  defaultFormat: 'image/png',
  defaultQuality: 100,
  showQuality: false,
  showDimensionCaps: false,
  showMatte: false,
  actionLabel: 'Convert to PNG',
  archiveName: 'converted-png',
  dropzoneLabel: 'Drop JPG photos here',
  notice:
    'PNG stores every pixel without discarding anything, so the file will usually end up several times larger. It cannot restore detail JPEG already removed, and it does not add transparency.',
};

const PNG_TO_JPG: BatchToolConfig = {
  accept: ['image/png'],
  acceptLabel: 'PNG only',
  acceptAttribute: 'image/png',
  formats: ['image/jpeg'],
  defaultFormat: 'image/jpeg',
  defaultQuality: 85,
  showQuality: true,
  showDimensionCaps: false,
  showMatte: true,
  actionLabel: 'Convert to JPG',
  archiveName: 'converted-jpg',
  dropzoneLabel: 'Drop PNG images here',
  notice:
    'Transparency is removed: transparent pixels are flattened onto the background colour above. The conversion is lossy and cannot be undone, so keep your PNG if you may need to edit it again.',
};

export function ImageCompressor() {
  return <ImageBatchTool config={IMAGE_COMPRESSOR} />;
}

export function JpgCompressor() {
  return <ImageBatchTool config={JPG_COMPRESSOR} />;
}

export function PngCompressor() {
  return <ImageBatchTool config={PNG_COMPRESSOR} />;
}

export function JpgToPng() {
  return <ImageBatchTool config={JPG_TO_PNG} />;
}

export function PngToJpg() {
  return <ImageBatchTool config={PNG_TO_JPG} />;
}
