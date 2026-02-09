import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { TdtChannelsResponse, TdtEpgItem } from '../model/interfaces/tdt-channels-response.interface';

@Injectable({
  providedIn: 'root'
})
export class TdtchannelsService {
  TDT_JSON_URL_TV = 'https://www.tdtchannels.com/lists/tv.json';
  TDT_JSON_URL_RADIO = 'https://www.tdtchannels.com/lists/radio.json';

  CLOUDFLARE_WORKER_CORS_URL = 'https://fragrant-shape-d81c.joanlloria.workers.dev';

  constructor(
    private readonly http: HttpClient
  ) { }

  getTvChannels(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.CLOUDFLARE_WORKER_CORS_URL+'?url='+encodeURIComponent(this.TDT_JSON_URL_TV)).pipe(
      catchError(err => {
        const fallbackUrl = 'data/tv.json';
        console.warn(`API failed (CORS?), loading local JSON tv instead from "${fallbackUrl}"`, err);
        return this.http.get<TdtChannelsResponse>(fallbackUrl);
      })
    );
  }

  getRadioStations(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.CLOUDFLARE_WORKER_CORS_URL+'?url='+encodeURIComponent(this.TDT_JSON_URL_RADIO)).pipe(
      catchError(err => {
        const fallbackUrl = 'data/tradio.json';
        console.warn(`API failed (CORS?), loading local JSON radio instead from "${fallbackUrl}"`, err);
        return this.http.get<TdtChannelsResponse>(fallbackUrl);
      })
    );
  }

  getEpg(url: string): Observable<TdtEpgItem[]> {
    return this.http.get<TdtEpgItem[]>(this.CLOUDFLARE_WORKER_CORS_URL+'?url='+encodeURIComponent(url));
  }

  getYoutubeVideId(url: string): Observable<{id: { videoId: string }}> {
    const youTubeApiKey = '';
    const channelId = this.extractChannelId(url);
    return this.http.get<{id: { videoId: string }}>(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${youTubeApiKey}`);
  }

  private extractChannelId(url: string): string {
    const match = url.match(/\/channel\/([^/]+)/);
    return match ? match[1] : '';
  }
}
