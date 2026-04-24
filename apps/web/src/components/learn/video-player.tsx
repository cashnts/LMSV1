'use client';

import { PlayCircle } from 'lucide-react';

type Props = {
  url: string | null;
  isIframe: boolean;
};

export function VideoPlayer({ url, isIframe }: Props) {
  if (!url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-4 text-slate-700">
        <PlayCircle className="size-20 opacity-10" />
        <p className="text-sm font-medium">No video content for this lesson.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video w-full" 
      onContextMenu={(e) => e.preventDefault()}
    >
      {isIframe ? (
        <iframe
          src={url}
          className="h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video 
          src={url} 
          controls 
          className="h-full w-full"
        />
      )}
    </div>
  );
}
