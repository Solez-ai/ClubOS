'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Crop, Loader2, Trash2, Upload, X } from 'lucide-react';

const MAX_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB source limit before cropping

interface ImageCropUploadProps {
  label: string;
  helperText?: string;
  /** Desired width/height ratio of the final image (e.g. 2 for a 2:1 cover, 1 for a square logo). */
  aspect: number;
  /** Width of the exported JPEG in px (height = outputWidth / aspect). */
  outputWidth: number;
  bucket: string;
  /** Folder inside the bucket, e.g. 'fest-covers'. Files land at <userId>/<pathPrefix>-<ts>.jpg */
  pathPrefix: string;
  value: string | null;
  onChange: (url: string | null) => void;
  supabase: SupabaseClient;
  disabled?: boolean;
}

interface CropState {
  img: HTMLImageElement;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Upload + crop control. The user picks a file, drags to pan and zooms to
 * frame it inside a fixed aspect ratio; the crop is rendered to a canvas and
 * uploaded to Supabase Storage. No external image URLs — everything goes
 * through the site's own storage bucket.
 */
export function ImageCropUpload({
  label,
  helperText,
  aspect,
  outputWidth,
  bucket,
  pathPrefix,
  value,
  onChange,
  supabase,
  disabled,
}: ImageCropUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const [error, setError] = useState('');
  const [crop, setCrop] = useState<CropState | null>(null);
  const [uploading, setUploading] = useState(false);

  // Base "cover" scale so the image always fills the canvas at zoom 1.
  const baseScale = useCallback(
    (img: HTMLImageElement, cw: number, ch: number) =>
      Math.max(cw / img.naturalWidth, ch / img.naturalHeight),
    []
  );

  // Keep offsets clamped so the canvas is always covered.
  const clampOffsets = useCallback(
    (img: HTMLImageElement, zoom: number, ox: number, oy: number, cw: number, ch: number) => {
      const s = baseScale(img, cw, ch) * zoom;
      const maxX = Math.max(0, (img.naturalWidth * s - cw) / 2);
      const maxY = Math.max(0, (img.naturalHeight * s - ch) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, ox)),
        y: Math.min(maxY, Math.max(-maxY, oy)),
      };
    },
    [baseScale]
  );

  const draw = useCallback(
    (c: HTMLCanvasElement, state: CropState) => {
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const cw = c.width;
      const ch = c.height;
      ctx.fillStyle = '#0D0C0A';
      ctx.fillRect(0, 0, cw, ch);
      const s = baseScale(state.img, cw, ch) * state.zoom;
      const w = state.img.naturalWidth * s;
      const h = state.img.naturalHeight * s;
      ctx.drawImage(state.img, cw / 2 + state.offsetX - w / 2, ch / 2 + state.offsetY - h / 2, w, h);
    },
    [baseScale]
  );

  // Redraw whenever crop state or canvas size changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!crop || !canvas) return;
    const resizeAndDraw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.width / aspect);
      const clamped = clampOffsets(crop.img, crop.zoom, crop.offsetX, crop.offsetY, canvas.width, canvas.height);
      if (clamped.x !== crop.offsetX || clamped.y !== crop.offsetY) {
        setCrop((prev) => (prev ? { ...prev, offsetX: clamped.x, offsetY: clamped.y } : prev));
        return;
      }
      draw(canvas, crop);
    };
    resizeAndDraw();
    window.addEventListener('resize', resizeAndDraw);
    return () => window.removeEventListener('resize', resizeAndDraw);
  }, [crop, draw, clampOffsets, aspect]);

  const openPicker = () => fileRef.current?.click();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('Image is too large. Please pick one under 12 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => setCrop({ img, zoom: 1, offsetX: 0, offsetY: 0 });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Could not read that image.');
    };
    img.src = url;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!crop) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: crop.offsetX, baseY: crop.offsetY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    setCrop((prev) =>
      prev
        ? {
            ...prev,
            offsetX: drag.baseX + (e.clientX - drag.startX) * scaleX,
            offsetY: drag.baseY + (e.clientY - drag.startY) * scaleX,
          }
        : prev
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const closeCrop = () => {
    if (crop) URL.revokeObjectURL(crop.img.src);
    setCrop(null);
  };

  const confirmCrop = async () => {
    const canvas = canvasRef.current;
    if (!crop || !canvas) return;
    setUploading(true);
    setError('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? 'anon';

      // Render the same crop at export resolution.
      const out = document.createElement('canvas');
      out.width = outputWidth;
      out.height = Math.round(outputWidth / aspect);
      const sOut = baseScale(crop.img, out.width, out.height) * crop.zoom;
      const factor = out.width / canvas.width;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported in this browser');
      ctx.fillStyle = '#0D0C0A';
      ctx.fillRect(0, 0, out.width, out.height);
      const w = crop.img.naturalWidth * sOut;
      const h = crop.img.naturalHeight * sOut;
      ctx.drawImage(
        crop.img,
        out.width / 2 + crop.offsetX * factor - w / 2,
        out.height / 2 + crop.offsetY * factor - h / 2,
        w,
        h
      );

      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Could not process the image');

      const path = `${userId}/${pathPrefix}-${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, blob, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (uploadErr) throw new Error(uploadErr.message);

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      onChange(publicUrl);
      closeCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

      {value ? (
        <div className="space-y-2">
          <div
            className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]"
            style={{ aspectRatio: `${aspect}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              <Crop size={13} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-red-500 hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="w-full rounded-lg border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--surface)] flex flex-col items-center justify-center gap-2 py-8 text-[var(--muted)] transition-colors disabled:opacity-50"
        >
          <Upload size={20} />
          <span className="text-sm font-medium">Upload an image</span>
          <span className="text-xs">{helperText ?? 'You can crop it in the next step'}</span>
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* Crop modal */}
      {crop && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 w-full max-w-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Position your image</h3>
              <button
                type="button"
                onClick={closeCrop}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="w-full rounded-lg border border-[var(--border)] cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ aspectRatio: `${aspect}` }}
            />

            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)] shrink-0">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={crop.zoom}
                onChange={(e) => setCrop((prev) => (prev ? { ...prev, zoom: parseFloat(e.target.value) } : prev))}
                className="flex-1 accent-[var(--accent)]"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeCrop}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCrop}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Crop size={14} /> Crop &amp; Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
