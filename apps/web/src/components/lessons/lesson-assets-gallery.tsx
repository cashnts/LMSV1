'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Expand, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';

export type LessonAsset = {
  id: string;
  filename: string;
  kind: 'document' | 'file' | 'image' | 'video';
  status: string;
  bytes: number | null;
  signed_url: string | null;
  storage_provider: string;
  cdn_url: string | null;
  bunny_video_id: string | null;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function DeleteAssetButton({ assetId }: { assetId: string }) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await apiFetch(`/lessons/assets/${assetId}`, token, { method: 'DELETE' });
      router.refresh();
    } catch {
      alert('Failed to delete file.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/30"
      title="Delete file"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function BunnyStreamPlayer({ url, title }: { url: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800" style={{ aspectRatio: '16/9', maxWidth: 560 }}>
      <iframe
        src={url}
        title={title}
        className="h-full w-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function LessonAssetsGallery({
  assets,
  emptyLabel = 'No files yet.',
  canDelete = false,
}: {
  assets: LessonAsset[];
  emptyLabel?: string;
  canDelete?: boolean;
}) {
  if (assets.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4">
      {assets.map((asset) => {
        const isBunnyStream = asset.storage_provider === 'bunny-stream';
        const displayUrl = asset.signed_url ?? asset.cdn_url;

        return (
          <div
            key={asset.id}
            className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">{asset.filename}</p>
                <p className="text-xs text-slate-500">{formatBytes(asset.bytes)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{asset.kind}</Badge>
                {isBunnyStream && <Badge variant="secondary">Bunny Stream</Badge>}
                <Badge variant={asset.status === 'ready' ? 'success' : 'secondary'}>{asset.status}</Badge>
                {canDelete && <DeleteAssetButton assetId={asset.id} />}
              </div>
            </div>

            {/* Bunny Stream: iframe embed player */}
            {isBunnyStream && asset.cdn_url ? (
              <BunnyStreamPlayer url={asset.cdn_url} title={asset.filename} />
            ) : null}

            {/* Regular image preview (Supabase or Bunny Storage) */}
            {!isBunnyStream && asset.kind === 'image' && displayUrl ? (
              <AssetPreviewDialog asset={asset} displayUrl={displayUrl}>
                <div className="block max-w-[220px] cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 transition hover:border-slate-300 dark:border-slate-800">
                  <img
                    src={displayUrl}
                    alt={asset.filename}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              </AssetPreviewDialog>
            ) : null}

            {/* Regular video preview (Supabase only — Bunny videos use iframe above) */}
            {!isBunnyStream && asset.kind === 'video' && displayUrl ? (
              <AssetPreviewDialog asset={asset} displayUrl={displayUrl}>
                <div className="block max-w-[260px] cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-black transition hover:border-slate-300 dark:border-slate-800">
                  <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                    src={displayUrl}
                  />
                </div>
              </AssetPreviewDialog>
            ) : null}

            {/* Download / open link (non-stream assets) */}
            {!isBunnyStream && displayUrl ? (
              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50"
              >
                Open file
              </a>
            ) : null}

            {/* Transcoding notice for Bunny Stream */}
            {isBunnyStream && asset.status === 'processing' && !asset.cdn_url ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Video is being processed by Bunny Stream. Check back shortly.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AssetPreviewDialog({
  asset,
  displayUrl,
  children,
}: {
  asset: LessonAsset;
  displayUrl: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                {asset.filename}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Click outside to close.
              </Dialog.Description>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href={displayUrl} target="_blank" rel="noreferrer">
                <Expand />
                Open file
              </a>
            </Button>
          </div>

          {asset.kind === 'image' ? (
            <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
              <img
                src={displayUrl}
                alt={asset.filename}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          ) : asset.kind === 'video' ? (
            <div className="overflow-hidden rounded-2xl bg-black">
              <video
                controls
                preload="metadata"
                className="max-h-[75vh] w-full bg-black"
                src={displayUrl}
              />
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
