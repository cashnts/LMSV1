'use client';
/* eslint-disable @next/next/no-img-element */

import * as Dialog from '@radix-ui/react-dialog';
import { Expand } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type LessonAsset = {
  id: string;
  filename: string;
  kind: 'document' | 'file' | 'image' | 'video';
  status: string;
  bytes: number | null;
  signed_url: string | null;
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

export function LessonAssetsGallery({
  assets,
  emptyLabel = 'No files yet.',
}: {
  assets: LessonAsset[];
  emptyLabel?: string;
}) {
  if (assets.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4">
      {assets.map((asset) => (
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
              <Badge variant={asset.status === 'ready' ? 'success' : 'secondary'}>{asset.status}</Badge>
            </div>
          </div>

          {asset.kind === 'image' && asset.signed_url ? (
            <AssetPreviewDialog asset={asset}>
              <div className="block max-w-[220px] cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 transition hover:border-slate-300 dark:border-slate-800">
                <img
                  src={asset.signed_url}
                  alt={asset.filename}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </AssetPreviewDialog>
          ) : null}

          {asset.kind === 'video' && asset.signed_url ? (
            <AssetPreviewDialog asset={asset}>
              <div className="block max-w-[260px] cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-black transition hover:border-slate-300 dark:border-slate-800">
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                  src={asset.signed_url}
                />
              </div>
            </AssetPreviewDialog>
          ) : null}

          {asset.signed_url ? (
            <a
              href={asset.signed_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50"
            >
              Open file
            </a>
          ) : (
            <p className="text-sm text-slate-500">Preview unavailable.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AssetPreviewDialog({
  asset,
  children,
}: {
  asset: LessonAsset;
  children: React.ReactNode;
}) {
  if (!asset.signed_url) {
    return <>{children}</>;
  }

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
              <a href={asset.signed_url} target="_blank" rel="noreferrer">
                <Expand />
                Open file
              </a>
            </Button>
          </div>

          {asset.kind === 'image' ? (
            <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
              <img
                src={asset.signed_url}
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
                src={asset.signed_url}
              />
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
