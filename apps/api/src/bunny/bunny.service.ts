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
    this.streamTokenKey = config.get('BUNNY_STREAM_TOKEN_KEY', '');
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
  private readonly streamTokenKey: string;
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

  private async fetchWithRetry(url: string, init?: RequestInit, retries = 3): Promise<Response> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await this.fetch(url, {
          ...init,
          signal: i === retries - 1 ? init?.signal : AbortSignal.timeout(20_000),
        });
        // Only return if it's a success or a non-retryable error (like 4xx)
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          return res;
        }
        // If 5xx, we might want to retry
        this.logger.warn(`Bunny API returned ${res.status}, retrying (${i + 1}/${retries})...`);
      } catch (err) {
        lastError = err;
        const msg = BunnyService.unwrapFetchError(err);
        this.logger.warn(`Bunny API connection error: ${msg}, retrying (${i + 1}/${retries})...`);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    throw lastError || new Error('Max retries reached');
  }

  async createStreamVideo(title: string): Promise<{ guid: string }> {
    let res: Response;
    try {
      res = await this.fetchWithRetry(
        `https://video.bunnycdn.com/library/${this.streamLibraryId}/videos`,
        {
          method: 'POST',
          headers: {
            AccessKey: this.streamApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
          signal: BunnyService.timeout(30_000),
        },
      );
    } catch (err) {
      const msg = BunnyService.unwrapFetchError(err);
      this.logger.error(`Bunny Stream unreachable after retries: ${msg}`);
      throw new BadGatewayException(`Bunny Stream unreachable: ${msg}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      this.logger.error(`Bunny Stream create video (${res.status}): ${text}`);
      throw new BadGatewayException(`Bunny Stream create video failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ guid: string }>;
  }

  async fetchStreamVideo(videoId: string, url: string) {
    let res: Response;
    try {
      res = await this.fetchWithRetry(
        `https://video.bunnycdn.com/library/${this.streamLibraryId}/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            AccessKey: this.streamApiKey,
            'Content-Type': 'application/octet-stream',
          },
          // The API expects a JSON-encoded string for the URL when fetching
          body: JSON.stringify(url),
          signal: BunnyService.timeout(30_000),
        },
      );
    } catch (err) {
      const msg = BunnyService.unwrapFetchError(err);
      this.logger.error(`Bunny Stream fetch from URL failed: ${msg}`);
      throw new BadGatewayException(`Bunny Stream fetch failed: ${msg}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      this.logger.error(`Bunny Stream fetch video (${res.status}): ${text}`);
      throw new BadGatewayException(`Bunny Stream fetch failed (${res.status}): ${text}`);
    }
    return { ok: true };
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
    try {
      await this.fetchWithRetry(
        `https://video.bunnycdn.com/library/${this.streamLibraryId}/videos/${videoId}`,
        { method: 'DELETE', headers: { AccessKey: this.streamApiKey } },
      );
    } catch (err) {
      this.logger.warn(`Failed to delete Bunny video ${videoId}: ${BunnyService.unwrapFetchError(err)}`);
    }
  }

  private get storageHost() {
    return this.storageRegion === 'de'
      ? 'storage.bunnycdn.com'
      : `${this.storageRegion}.storage.bunnycdn.com`;
  }

  async uploadToStorage(path: string, data: Buffer, contentType: string): Promise<{ cdnUrl: string; directUrl: string }> {
    if (!this.storageZone || !this.storageAccessKey) {
      this.logger.error('Bunny Storage is not fully configured (missing zone or access key)');
      throw new BadGatewayException('Bunny Storage configuration incomplete');
    }

    const directUrl = `https://${this.storageHost}/${this.storageZone}/${path}`;
    this.logger.debug(`Attempting Bunny Storage upload to: ${directUrl} (Region: ${this.storageRegion})`);

    let res: Response;
    try {
      res = await this.fetchWithRetry(directUrl, {
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
      let errorMessage = `Bunny Storage upload (${res.status}): ${text} (Zone: ${this.storageZone}, Host: ${this.storageHost})`;

      if (res.status === 401) {
        if (this.storageZone === this.storageRegion) {
          errorMessage += `\n[CRITICAL] Your BUNNY_STORAGE_ZONE and BUNNY_STORAGE_REGION are both set to "${this.storageZone}". This is likely a configuration error. The Zone should be your storage name (e.g., "my-assets"), not the region code.`;
        }
        errorMessage += `\n[ACTION] Please verify you are using the "Storage Zone Password" found in the "FTP & API Access" tab of your Bunny storage zone, NOT your main account API key.`;
      }

      this.logger.error(errorMessage);
      throw new BadGatewayException(`Bunny Storage upload failed (${res.status}): ${text}`);
    }
    return { 
      cdnUrl: `${this.storageCdnUrl}/${path}`,
      directUrl: directUrl
    };
  }

  async deleteFromStorage(path: string) {
    try {
      await this.fetchWithRetry(`https://${this.storageHost}/${this.storageZone}/${path}`, {
        method: 'DELETE',
        headers: { AccessKey: this.storageAccessKey },
      });
    } catch (err) {
      this.logger.warn(`Failed to delete Bunny storage asset ${path}: ${BunnyService.unwrapFetchError(err)}`);
    }
  }
}
