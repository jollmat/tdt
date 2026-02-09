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

  constructor(
    private readonly http: HttpClient
  ) { }

  getTvChannels(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.TDT_JSON_URL_TV).pipe(
      catchError(err => {
        const fallbackUrl = 'data/tv.json';
        console.warn(`API failed (CORS?), loading local JSON tv instead from "${fallbackUrl}"`, err);
        return this.http.get<TdtChannelsResponse>(fallbackUrl);
      })
    );
  }

  getRadioStations(): Observable<TdtChannelsResponse> {
    return this.http.get<TdtChannelsResponse>(this.TDT_JSON_URL_RADIO).pipe(
      catchError(err => {
        const fallbackUrl = 'data/radio.json';
        console.warn(`API failed (CORS?), loading local JSON radio instead from "${fallbackUrl}"`, err);
        return this.http.get<TdtChannelsResponse>(fallbackUrl);
      })
    );
  }

  getEpg(url: string): Observable<TdtEpgItem[]> {
    return this.http.get<TdtEpgItem[]>(url);
    /*
    return of ([
      { 
        name: 'La1.TV', 
        events: [
          { 
            hi: new Date(1770511800),
            hf: new Date(1770517200),
            t: 'Dr. Nice: Corazones rotos',
            d: 'Neiss y Lea se dirigen a una excursión de pesca padre-hija cuando se produce un terrible accidente.',
            c: 'https://www.movistarplus.es/recorte/n/caratula5/MTVEP4238219'
          },
          { 
            hi: new Date(1770517200),
            hf: new Date(1770526800),
            t: 'Noticias 24H',
            d: 'Noticias de los servicios informativos del Canal 24 Horas. Producido por Televisión Española, este canal está dedicado íntegramente a ofrecer información de actualidad y es el más antiguo de los canales de este tipo en España.',
            c: 'https://www.movistarplus.es/recorte/n/caratula5/F4315170'
          },
          { 
            hi: new Date(1770526800),
            hf: new Date(1770530400),
            t: 'Noticias 24H',
            d: 'Neiss y Lea se dirigen a una excursión de pesca padre-hija cuando se produce un terrible accidente.',
            c: 'https://www.movistarplus.es/recorte/n/caratula5/F4315170'
          }
        ] 
      }
    ]);
    */
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
