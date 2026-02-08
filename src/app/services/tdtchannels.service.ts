import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { TdtChannelsResponse } from '../model/interfaces/tdt-channels-response.interface';

@Injectable({
  providedIn: 'root'
})
export class TdtchannelsService {
  TDT_JSON_URL_TV = 'https://www.tdtchannels.com/lists/tv.json';
  TDT_JSON_URL_RADIO = 'https://www.tdtchannels.com/lists/radio.json';

  constructor(
    private readonly http: HttpClient
  ) { }

  getTvChannels(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.TDT_JSON_URL_TV).pipe(
      catchError(err => {
        console.warn('API failed (CORS?), loading local JSON tv instead', err);
        return this.http.get<TdtChannelsResponse>('assets/data/tv.json');
      })
    );
  }

  getRadioStations(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.TDT_JSON_URL_RADIO).pipe(
      catchError(err => {
        console.warn('API failed (CORS?), loading local JSON radio instead', err);
        return this.http.get<TdtChannelsResponse>('assets/data/radio.json');
      })
    );
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
