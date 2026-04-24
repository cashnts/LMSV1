'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Expand, Trash2, FileText, Image as ImageIcon, Video, ExternalLink, Play, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { cn } from '@/lib/utils';

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

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
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
      <Trash2 className="size-3.5" />
    </button>
  );
}

const KIND_ICONS = {
  document: FileText,
  file: FileText,
  image: ImageIcon,
  video: Video,
};

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
    return (
      <div className="py-6 text-center">
        <p className="text-xs font-medium text-slate-400 italic">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => {
        const isBunnyStream = asset.storage_provider === 'bunny-stream' || !!asset.bunny_video_id;
        const displayUrl = asset.signed_url ?? asset.cdn_url;
        const Icon = KIND_ICONS[asset.kind] || FileText;

        return (
          <div
            key={asset.id}
            className="group relative flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-2 transition-all hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-900/20 dark:hover:border-slate-700 dark:hover:bg-slate-900/40"
          >
            {/* Minimal Preview/Icon */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-950 ring-1 ring-slate-200/50 dark:ring-slate-800/50 overflow-hidden">
              {asset.kind === 'image' && displayUrl ? (
                <img src={displayUrl} className="size-full object-cover" alt="" />
              ) : asset.kind === 'video' && isBunnyStream ? (
                <div className="size-full bg-slate-900 flex items-center justify-center">
                  <Play className="size-3 text-white fill-white" />
                </div>
              ) : (
                <Icon className="size-4 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                 <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                   {asset.filename}
                 </p>
                 {asset.status !== 'ready' && (
                   <Badge variant="secondary" className="h-4 px-1 text-[8px] uppercase">
                     {asset.status}
                   </Badge>
                 )}
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                {asset.kind} • {formatBytes(asset.bytes)}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {displayUrl && (
                <AssetPreviewDialog asset={asset} displayUrl={displayUrl}>
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 transition-colors">
                    <Eye className="size-3.5" />
                  </button>
                </AssetPreviewDialog>
              )}
              {canDelete && <DeleteAssetButton assetId={asset.id} />}
            </div>
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-950 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 px-2">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                {asset.filename}
              </Dialog.Title>
              <Dialog.Description className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {asset.kind} • {asset.storage_provider}
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold">
                <a href={displayUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-3.5" />
                  Source
                </a>
              </Button>
              <Dialog.Close asChild>
                 <Button size="sm" className="rounded-xl font-bold bg-slate-900 text-white">Close</Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="relative mt-2 overflow-hidden rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 ring-1 ring-slate-200/50 dark:ring-slate-800/50">
            {asset.kind === 'image' ? (
              <img
                src={displayUrl}
                alt={asset.filename}
                className="max-h-[70vh] w-full object-contain mx-auto shadow-2xl"
              />
            ) : asset.kind === 'video' ? (
              <div className="aspect-video w-full bg-black">
                {asset.storage_provider === 'bunny-stream' ? (
                   <iframe
                     src={displayUrl}
                     className="size-full"
                     allowFullScreen
                   />
                ) : (
                  <video
                    controls
                    preload="metadata"
                    className="size-full"
                    src={displayUrl}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                 <FileText className="size-16 text-slate-200" />
                 <p className="text-sm font-medium text-slate-500">Preview not available for this file type.</p>
                 <Button asChild variant="secondary" className="rounded-xl font-bold">
                    <a href={displayUrl} target="_blank" rel="noreferrer">Download File</a>
                 </Button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
