import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { fetch as undicieFetch, ProxyAgent } from 'undici';

@Injectable()
export class BunnyService {
  private readonly logger = new Logger(BunnyService.name);
  private readonly proxyDispatcher: ProxyAgent | undefined;

  constructor(private readonly config: ConfigService) {
    this.streamLibraryId = config.get('BUNNY_STREAM_LIBRARY_ID', '');
    this.streamApiKey = config.get('BUNNY_STREAM_API_KEY', '');
    this.streamCdnHostname = config.get('BUNNY_STREAM_CDN_HOSTNAME', '');
    this.storageZone = config.get('BUNNY_STORAGE_ZONE', '');
    this.storageAccessKey = config.get('BUNNY_STORAGE_ACCESS_KEY', '');
    this.storageCdnUrl = config.get('BUNNY_STORAGE_CDN_URL', '').replace(/\/$/, '');
    this.storageRegion = config.get('BUNNY_STORAGE_REGION', 'ny');

    const proxyUrl = config.get('HTTPS_PROXY', '') || config.get('HTTP_PROXY', '') || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      this.logger.log(`Using proxy: ${proxyUrl}`);
      this.proxyDispatcher = new ProxyAgent(proxyUrl);
    }
  }

  private readonly streamLibraryId: string;
  private readonly streamApiKey: string;
  private readonly streamCdnHostname: string;
  private readonly storageZone: string;
  private readonly storageAccessKey: string;
  private readonly storageCdnUrl: string;
  private readonly storageRegion: string;

  private fetch(url: string, init?: RequestInit): Promise<Response> {
    if (this.proxyDispatcher) {
      return undicieFetch(url, { ...init, dispatcher: this.proxyDispatcher } as Parameters<typeof undicieFetch>[1]) as unknown as Promise<Response>;
    }
    return fetch(url, init);
  }

  private static timeout(ms = 15_000) {
    return AbortSignal.timeout(ms);
  }

  private static unwrapFetchError(err: unknown): string {
    if (err instanceof Error) {
      const cause = (err as Error & { cause?: Error }).cause;
      return cause?.message ?? err.message;
    }
    return String(err);
  }

  isStreamConfigured() {
    const enabled = this.config.get('BUNNY_STREAM_ENABLED', 'true');
    if (enabled === 'false') return false;
    return !!(this.streamLibraryId && this.streamApiKey && this.streamCdnHostname);
  }

  isStorageConfigured() {
    return !!(this.storageZone && this.storageAccessKey && this.storageCdnUrl);
  }

  async createStreamVideo(title: string): Promise<{ guid: string }> {
    let res: Response;
    try {
      res = await this.fetch(
        `https://video.bunnycdn.com/library/${this.streamLibraryId}/videos`,
        {
          method: 'POST',
          headers: {
            AccessKey: this.streamApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
          signal: BunnyService.timeout(),
        },
      );
    } catch (err) {
      const msg = BunnyService.unwrapFetchError(err);
      this.logger.error(`Bunny Stream unreachable: ${msg}`);
      throw new BadGatewayException(`Bunny Stream unreachable: ${msg}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      this.logger.error(`Bunny Stream create video (${res.status}): ${text}`);
      throw new BadGatewayException(`Bunny Stream create video failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ guid: string }>;
  }

  createTusCredentials(videoId: string) {
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const authSignature = createHash('sha256')
      .update(this.streamApiKey + expirationTime + this.streamLibraryId + videoId)
      .digest('hex');
    return {
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      authSignature,
      authExpire: expirationTime,
      videoId,
      libraryId: this.streamLibraryId,
    };
  }

  getStreamEmbedUrl(videoId: string) {
    return `https://iframe.mediadelivery.net/embed/${this.streamLibraryId}/${videoId}?autoplay=false&preload=true`;
  }

  getHlsUrl(videoId: string) {
    return `https://${this.streamCdnHostname}/${videoId}/playlist.m3u8`;
  }

  async deleteStreamVideo(videoId: string) {
    await this.fetch(
      `https://video.bunnycdn.com/library/${this.streamLibraryId}/videos/${videoId}`,
      { method: 'DELETE', headers: { AccessKey: this.streamApiKey } },
    );
  }

  private get storageHost() {
    return this.storageRegion === 'de'
      ? 'storage.bunnycdn.com'
      : `${this.storageRegion}.storage.bunnycdn.com`;
  }

  async uploadToStorage(path: string, data: Buffer, contentType: string): Promise<string> {
    let res: Response;
    try {
      res = await this.fetch(`https://${this.storageHost}/${this.storageZone}/${path}`, {
        method: 'PUT',
        headers: {
          AccessKey: this.storageAccessKey,
          'Content-Type': contentType || 'application/octet-stream',
        },
        body: data as unknown as BodyInit,
        signal: BunnyService.timeout(60_000),
      });
    } catch (err) {
      const msg = BunnyService.unwrapFetchError(err);
      this.logger.error(`Bunny Storage unreachable: ${msg}`);
      throw new BadGatewayException(`Bunny Storage unreachable: ${msg}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      this.logger.error(`Bunny Storage upload (${res.status}): ${text}`);
      throw new BadGatewayException(`Bunny Storage upload failed (${res.status}): ${text}`);
    }
    return `${this.storageCdnUrl}/${path}`;
  }

  async deleteFromStorage(path: string) {
    await this.fetch(`https://${this.storageHost}/${this.storageZone}/${path}`, {
      method: 'DELETE',
      headers: { AccessKey: this.storageAccessKey },
    });
  }
}
