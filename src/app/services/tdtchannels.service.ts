import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { TdtChannel, TdtChannelsResponse, TdtEpgItem } from '../model/interfaces/tdt-channels-response.interface';

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

  getCustomChannels(): Observable<TdtChannel[]> {
    return this.http.get<TdtChannel[]>('data/custom.json');
  }

  getEpg(url: string): Observable<TdtEpgItem[]> {
    return this.http.get<TdtEpgItem[]>(this.CLOUDFLARE_WORKER_CORS_URL+'?url='+encodeURIComponent(url));
  }

  getYoutubeVideId(url: string): Observable<{id: { videoId: string }}> {
    const youTubeApiKey = '';
    const channelId = this.extractChannelId(url);
    return this.http.get<{id: { videoId: string }}>(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${youTubeApiKey}`);
  }

  public static getChannelFlagClassName(channelName: string): string {
    const countriesFlags: { countryName: string, className: string }[] = [
      {countryName: 'UK', className: 'fi fi-gb'},
      {countryName: 'Italia', className: 'fi fi-it'},
      {countryName: 'Portugal', className: 'fi fi-pt'},
      {countryName: 'Belgium', className: 'fi fi-be'},
      {countryName: 'Estonia', className: 'fi fi-ee'},
      {countryName: 'Georgia', className: 'fi fi-ge'},
      {countryName: 'Norway', className: 'fi fi-no'},
      {countryName: 'Switzerland', className: 'fi fi-ch'},
      {countryName: 'Croatia', className: 'fi fi-hr'},
      {countryName: 'Greece', className: 'fi fi-gr'},
      {countryName: 'Finland', className: 'fi fi-fi'},
      {countryName: 'Denmark', className: 'fi fi-dk'},
      {countryName: 'Czech Republic', className: 'fi fi-cz'},
      {countryName: 'France', className: 'fi fi-fr'},
      {countryName: 'Hong Kong', className: 'fi fi-hk'},
      {countryName: 'Bosnia & Herzegovina', className: 'fi fi-ba'},
      {countryName: 'Sweden', className: 'fi fi-se'},
      {countryName: 'Slovenia', className: 'fi fi-sl'},
      {countryName: 'Bulgaria', className: 'fi fi-bg'}
    ];
    const nameMatch = channelName.match(/\((.*?)\)/);
    const countryName = nameMatch ? nameMatch[0].replace('(','').replace(')','') : '';

    if (countryName.length===0) {
      return 'fi fi-es';
    }

    const res: { countryName: string, className: string } | undefined = countriesFlags.find((_channelFlagInfo) => _channelFlagInfo.countryName===countryName);
    return res?.className || 'fi fi-es';
  }

  private extractChannelId(url: string): string {
    const match = url.match(/\/channel\/([^/]+)/);
    return match ? match[1] : '';
  }
}
