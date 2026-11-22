export const MAX_RAW_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB pre-compression limit
export const MAX_FEATURE_IMAGE_CHARS = 350_000; // Matches Firestore rule cap
export const TARGET_COMPRESSED_CHARS = 320_000;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export interface ScaledDimensions {
  width: number;
  height: number;
}

export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  approxBytes: number;
  formatLabel: string;
}

export function validateImageFileMeta(
  mimeType: string,
  sizeBytes: number
): { ok: true } | { ok: false; error: string } {
  const normalized = (mimeType || '').toLowerCase().trim();
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(normalized as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: 'Unsupported file format. Please upload a PNG, JPG, WebP, or GIF image.',
    };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: 'Selected image file appears to be empty.' };
  }
  if (sizeBytes > MAX_RAW_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'Image file is larger than 10 MB. Please choose a smaller image.',
    };
  }
  return { ok: true };
}

export function computeScaledDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxEdge: number
): ScaledDimensions {
  if (
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return { width: maxEdge, height: maxEdge };
  }
  const longest = Math.max(naturalWidth, naturalHeight);
  if (longest <= maxEdge) {
    return {
      width: Math.round(naturalWidth),
      height: Math.round(naturalHeight),
    };
  }
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(naturalWidth * ratio)),
    height: Math.max(1, Math.round(naturalHeight * ratio)),
  };
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return 0;
  const b64 = dataUrl.slice(commaIdx + 1);
  return Math.round((b64.length * 3) / 4);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 KB';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode the selected image file.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Resize and compress a user-selected raster image into a safe, bounded
 * WebP (or JPEG fallback) data URL ready for Firestore persistence.
 */
export async function compressImageFileToDataUrl(file: File): Promise<CompressedImageResult> {
  const metaCheck = validateImageFileMeta(file.type, file.size);
  if (!metaCheck.ok) {
    throw new Error(metaCheck.error);
  }

  const img = await loadImageElement(file);
  const attempts: { maxEdge: number; quality: number }[] = [
    { maxEdge: 1080, quality: 0.84 },
    { maxEdge: 960, quality: 0.78 },
    { maxEdge: 820, quality: 0.72 },
    { maxEdge: 680, quality: 0.64 },
    { maxEdge: 540, quality: 0.56 },
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas image processing is not available in this browser.');
  }

  let bestUrl = '';
  let bestDims: ScaledDimensions = { width: img.naturalWidth, height: img.naturalHeight };

  for (const step of attempts) {
    const dims = computeScaledDimensions(img.naturalWidth, img.naturalHeight, step.maxEdge);
    canvas.width = dims.width;
    canvas.height = dims.height;
    ctx.clearRect(0, 0, dims.width, dims.height);
    ctx.drawImage(img, 0, 0, dims.width, dims.height);

    // Prefer WebP for best quality-to-size ratio; fallback to JPEG if browser returns PNG
    let candidate = canvas.toDataURL('image/webp', step.quality);
    if (!candidate.startsWith('data:image/webp;base64,')) {
      candidate = canvas.toDataURL('image/jpeg', step.quality);
    }

    bestUrl = candidate;
    bestDims = dims;

    if (candidate.length <= TARGET_COMPRESSED_CHARS) {
      break;
    }
  }

  if (bestUrl.length > MAX_FEATURE_IMAGE_CHARS) {
    throw new Error(
      'This image could not be compressed small enough. Please choose a simpler or smaller image.'
    );
  }

  const formatLabel = bestUrl.startsWith('data:image/webp;base64,')
    ? 'WEBP'
    : bestUrl.startsWith('data:image/png;base64,')
      ? 'PNG'
      : 'JPEG';

  return {
    dataUrl: bestUrl,
    width: bestDims.width,
    height: bestDims.height,
    approxBytes: estimateDataUrlBytes(bestUrl),
    formatLabel,
  };
}
