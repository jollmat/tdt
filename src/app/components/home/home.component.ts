import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TdtchannelsService } from '../../services/tdtchannels.service';
import { interval, Subscription } from 'rxjs';
import { TdtChannel, TdtChannelsResponse, TdtEpgItem, TdtEpgItemEvent } from '../../model/interfaces/tdt-channels-response.interface';
import { CommonModule } from '@angular/common';
import Hls from 'hls.js';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DeviceDetectorService } from '../../services/device-detector.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnDestroy, OnInit {

  APP_FAVOURITE_CHANNELS_KEY = 'APP_FAVOURITE_CHANNELS_KEY';
  APP_SELECTED_CHANNEL_KEY = 'APP_SELECTED_CHANNEL_KEY';

  tvChannelsSubscription?: Subscription;
  radioStationsSubscription?: Subscription;
  epgTvSubscription?: Subscription;
  epgRadioSubscription?: Subscription;

  tv?: TdtChannelsResponse;
  radio?: TdtChannelsResponse;

  epg: TdtEpgItem[] = [];
  currentEpg?: TdtEpgItem;
  epgInterval$!: Subscription;

  favourites: TdtChannelsResponse = {
    countries: [
      {
        name: 'Favourites', 
        ambits: [
          { name: 'TV', channels: [] },
          { name: 'Radio', channels: [] }
        ]
      }
    ]
  } as TdtChannelsResponse;

  expandedItems: string[] = [];
  expandedItemsBk: string[] = [];

  @ViewChild('video', { static: false }) videoRef?: ElementRef<HTMLVideoElement>;
  videoElement?: HTMLVideoElement;
  private hls?: Hls;

  selectedChannel?: TdtChannel;
  selectedChannelSourceIdx?: number;
  channelSourceFormat? = 'm3u8';
  safeUrl?: SafeResourceUrl;

  deviceDetectionMobileSubscription?: Subscription;
  deviceDetectionTabletSubscription?: Subscription;
  deviceDetectionDesktopSubscription?: Subscription;
  deviceSettings: {
    isMobile: boolean,
    isDesktop: boolean,
    isTablet: boolean
  } = {
    isMobile: false,
    isDesktop: false,
    isTablet: false
  }

  errors: any[] = [];

  constructor(
    private readonly tdtChannelsService: TdtchannelsService,
    private readonly sanitizer: DomSanitizer,
    private readonly deviceDetactorService: DeviceDetectorService
  ) {
    this.tvChannelsSubscription = this.tdtChannelsService.getTvChannels().subscribe({
      next: (_tvChannelsResults) => {
        this.tv = this.getSortedResponse(_tvChannelsResults);
        console.log('TV', this.tv);
      }, error: (err) => {
        console.log('Error loading tv channels', err);
        this.errors.push(err);
      }
    });
    this.radioStationsSubscription = this.tdtChannelsService.getRadioStations().subscribe({
      next: (_radioSatationsResults) => {
        this.radio = this.getSortedResponse(_radioSatationsResults);
        console.log('RADIO', this.radio);
      }, error: (err) => {
        console.log('Error loading radio stations', err);
        this.errors.push(err);
      }
    });
    this.deviceDetectionMobileSubscription = this.deviceDetactorService.isMobile.subscribe({
      next: (_res) => {
        this.deviceSettings.isMobile = _res;
      }, error: (err) => {
        this.errors.push(err);
      }
    });
    this.deviceDetectionDesktopSubscription = this.deviceDetactorService.isDesktop.subscribe({
      next: (_res) => {
        this.deviceSettings.isDesktop = _res;
      }, error: (err) => {
        this.errors.push(err);
      }
    });
    this.deviceDetectionTabletSubscription = this.deviceDetactorService.isTablet.subscribe({
      next: (_res) => {
        this.deviceSettings.isTablet = _res;
      }, error: (err) => {
        this.errors.push(err);
      }
    });

    this.loadEpg();
  }

  private loadEpg() {
    this.epg = [];
    this.epgTvSubscription = this.tdtChannelsService.getEpg('https://www.tdtchannels.com/epg/TV.json').subscribe({
      next: (_epgResults) => {
        this.epg = this.epg.concat(_epgResults.map((_epg) => {
          _epg.events.forEach((_event) => {
            const hiNum = Number(_event.hi)*1000;
            const hfNum = Number(_event.hf)*1000;
            _event.hi = new Date(hiNum);
            _event.hf = new Date(hfNum);
          });
          return _epg;
        }));
        this.scrollToActiveEpgItem();
      }, 
      error: (err) => {
        this.errors.push(err);
      }
    });
    this.epgRadioSubscription = this.tdtChannelsService.getEpg('https://www.tdtchannels.com/epg/RADIO.json').subscribe({
      next: (_epgResults) => {
        this.epg = this.epg.concat(_epgResults.map((_epg) => {
          _epg.events.forEach((_event) => {
            const hiNum = Number(_event.hi)*1000;
            const hfNum = Number(_event.hf)*1000;
            _event.hi = new Date(hiNum);
            _event.hf = new Date(hfNum);
          });
          return _epg;
        }));
        this.scrollToActiveEpgItem();
      }, error: (err) => {
        this.errors.push(err);
      }
    });
  }

  isEpgItemEventActive(itemEvent: TdtEpgItemEvent): boolean {
    const now = new Date();
    return itemEvent.hi.getTime()<=now.getTime() && itemEvent.hf.getTime()>=now.getTime();
  }

  scrollToActiveEpgItem() {
    const container = document.querySelector('.epg-wrapper');
    const activeRow = container?.querySelector('tr.active');

    if (container && activeRow) {
      activeRow?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  private getSortedResponse(response: TdtChannelsResponse): TdtChannelsResponse {
    response.countries.forEach((_country) => {
      _country.ambits.forEach((_ambit) => {
        _ambit.channels.sort((a,b) => {
          return a.name.toLowerCase()>b.name.toLowerCase()?1:-1;
        });
      })
    });
    return response;
  }
  
  toggleExpand(itemId: string) {
    if (this.isExpanded(itemId)) {
      this.expandedItems = this.expandedItems.filter((_itemId) => _itemId!==itemId);
    } else {
      this.expandedItems.push(itemId);
    }
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems.includes(itemId);
  }

  collapseAll() {
    this.expandedItemsBk = JSON.parse(JSON.stringify(this.expandedItems));
    this.expandedItems = [];
  }

  restoreCollapsed() {
    this.expandedItems = JSON.parse(JSON.stringify(this.expandedItemsBk));
  }

  openChannel(channel?: TdtChannel, sourceIndex?: number) {
    console.log('openChannel()', channel);

    this.selectedChannel = channel;
    this.selectedChannelSourceIdx = sourceIndex;

    this.videoElement = this.videoRef?.nativeElement;
    const videoSrc = (this.selectedChannel && this.selectedChannel.options?.length>0)?this.selectedChannel.options[0].url : '';
    const videoFormat = (this.selectedChannel && this.selectedChannel.options?.length>0)?this.selectedChannel.options[0].format : undefined;

    this.channelSourceFormat =  videoFormat;

    // EPG
    this.currentEpg = this.epg.find((_epg) => _epg.name===this.selectedChannel?.epg_id);
    setTimeout(() => this.scrollToActiveEpgItem(), 500);

    if (this.videoElement) {
      if (!this.selectedChannel) {
        localStorage.removeItem(this.APP_SELECTED_CHANNEL_KEY);
        this.videoElement.src = videoSrc;
      } else {

        localStorage.setItem(this.APP_SELECTED_CHANNEL_KEY, JSON.stringify(this.selectedChannel));

        if (this.channelSourceFormat==='youtube') {
          const youtubeVideoId = this.tdtChannelsService.getYoutubeVideId(videoSrc); // videoSrc
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube-nocookie.com/embed/${youtubeVideoId}`
          );
        } else {
          if (this.videoElement) {
            this.videoElement.volume = (this.deviceSettings.isDesktop)?0.05:0.2;
            if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
              // Native HLS support (Safari)
              this.videoElement.src = videoSrc;
              this.videoElement.play().catch((e) => console.warn('Error on play', e, this.videoElement));
            } else if (Hls.isSupported()) {
              // HLS.js fallback for other browsers
              this.hls = new Hls();
              this.hls.loadSource(videoSrc);
              this.hls.attachMedia(this.videoElement);
            } else {
              console.error('HLS not supported in this browser');
            }
          }
        }
      }
    }
  }

  loadFavourites() {
    const storedData = localStorage.getItem(this.APP_FAVOURITE_CHANNELS_KEY);
    if (storedData) {
      this.favourites = this.getSortedResponse(JSON.parse(storedData) as TdtChannelsResponse);
    }
  }

  loadSelectedChannel() {
    const storedChannel = localStorage.getItem(this.APP_SELECTED_CHANNEL_KEY);
    if (storedChannel) {
      this.selectedChannel = JSON.parse(storedChannel) as TdtChannel;
      setTimeout(() => {
        this.openChannel(this.selectedChannel);
      }, 1000);
    }
  }

  isFavourite(tdtChannel: TdtChannel): boolean {
    return this.favourites.countries[0].ambits[0].channels.some((_tdtChannel) => _tdtChannel.name===tdtChannel.name) ||
           this.favourites.countries[0].ambits[1].channels.some((_tdtChannel) => _tdtChannel.name===tdtChannel.name);
  }

  toggleFavourite(tdtChannel: TdtChannel, ambitIdx?: number) {
    if (ambitIdx!==undefined) {
      if (!this.isFavourite(tdtChannel)) {
        this.favourites.countries[0].ambits[ambitIdx].channels.push(tdtChannel);
      } else {
        this.favourites.countries[0].ambits[ambitIdx].channels = this.favourites.countries[0].ambits[ambitIdx].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
      }
    } else {
      this.favourites.countries[0].ambits[0].channels = this.favourites.countries[0].ambits[0].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
      this.favourites.countries[0].ambits[1].channels = this.favourites.countries[0].ambits[1].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
    }
    this.saveFavourites();
  }

  saveFavourites() {
    this.favourites = this.getSortedResponse(this.favourites);
    localStorage.setItem(this.APP_FAVOURITE_CHANNELS_KEY, JSON.stringify(this.favourites));
  }

  ngOnInit(): void {
    try {
      this.loadFavourites();
      this.loadSelectedChannel();

      // EPG reloads
      this.epgInterval$ = interval(60000).subscribe(() => {
        this.loadEpg();
      });
    } catch(err) {
      this.errors.push(err);
    }
  }
  
  ngOnDestroy(): void {
    this.hls?.destroy();

    this.deviceDetectionMobileSubscription?.unsubscribe();
    this.deviceDetectionDesktopSubscription?.unsubscribe();
    this.deviceDetectionTabletSubscription?.unsubscribe();
    this.epgTvSubscription?.unsubscribe();
    this.epgRadioSubscription?.unsubscribe();
    this.epgInterval$?.unsubscribe();
  }

}
