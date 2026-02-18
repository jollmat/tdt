import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { TdtchannelsService } from '../../services/tdtchannels.service';
import { interval, Subscription } from 'rxjs';
import { TdtChannel, TdtChannelsCountry, TdtChannelsResponse, TdtEpgItem, TdtEpgItemEvent } from '../../model/interfaces/tdt-channels-response.interface';
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
export class HomeComponent implements OnDestroy, OnInit, AfterViewInit {

  APP_TDT_OTHERS_CHANNELS_KEY = 'APP_TDT_OTHERS_CHANNELS_KEY';
  APP_TDT_SELECTED_CHANNEL_KEY = 'APP_TDT_SELECTED_CHANNEL_KEY';
  APP_TDT_EXPANDED_NODES = 'APP_TDT_EXPANDED_NODES';

  tvChannelsSubscription?: Subscription;
  radioStationsSubscription?: Subscription;
  customChannelsSubscription?: Subscription;
  epgTvSubscription?: Subscription;
  epgRadioSubscription?: Subscription;
  youtubeVideoUrlRequestSubscription?: Subscription;

  tv?: TdtChannelsResponse;
  radio?: TdtChannelsResponse;

  epg: TdtEpgItem[] = [];
  currentEpg?: TdtEpgItem;
  epgInterval$!: Subscription;

  others: TdtChannelsResponse = {
    countries: [
      {
        name: 'Favourites', 
        ambits: [
          { name: 'TV', channels: [] },
          { name: 'Radio', channels: [] }
        ]
      },
      {
        name: 'Custom',
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
  deviceDetectionLandscapeSubscription?: Subscription;
  deviceSettings: {
    isMobile: boolean,
    isDesktop: boolean,
    isTablet: boolean,
    isLandscape: boolean
  } = {
    isMobile: false,
    isDesktop: false,
    isTablet: false,
    isLandscape: false
  }

  errors: any[] = [];

  firstLoad = signal(true);

  constructor(
    private readonly tdtChannelsService: TdtchannelsService,
    private readonly sanitizer: DomSanitizer,
    private readonly deviceDetactorService: DeviceDetectorService
  ) {
    this.tvChannelsSubscription = this.tdtChannelsService.getTvChannels().subscribe({
      next: (_tvChannelsResults) => {
        this.tv = this.getSortedResponse(_tvChannelsResults);
        this.tv = this.configChannelCountries(this.tv);
      }, error: (err) => {
        console.log('Error loading tv channels', err);
        this.errors.push(err);
      }
    });
    this.radioStationsSubscription = this.tdtChannelsService.getRadioStations().subscribe({
      next: (_radioSatationsResults) => {
        this.radio = this.getSortedResponse(_radioSatationsResults);
        this.radio = this.configChannelCountries(this.radio);
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
    this.deviceDetectionLandscapeSubscription = this.deviceDetactorService.isLandscape.subscribe({
      next: (_res) => {
        this.deviceSettings.isLandscape = _res;
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

  toggleExpand(itemId: string) {
    if (this.isExpanded(itemId)) {
      this.expandedItems = this.expandedItems.filter((_itemId) => _itemId!==itemId);
    } else {
      this.expandedItems.push(itemId);
    }
    this.saveExpandedNodes();
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
    // console.log('openChannel()', channel);

    this.videoElement = this.videoRef?.nativeElement;
    this.safeUrl = undefined;

    if (!channel) {
      this.selectedChannel = undefined;
      localStorage.removeItem(this.APP_TDT_SELECTED_CHANNEL_KEY);
      if (this.videoElement) {
        this.videoElement.src = '';
      }
    }

    const channelChanged = JSON.stringify(channel?.name)!==JSON.stringify(this.selectedChannel?.name);
    
    if (channelChanged || this.firstLoad()) {

      this.selectedChannel = channel;
      this.selectedChannelSourceIdx = sourceIndex;

      const videoUrl = (this.selectedChannel && this.selectedChannel.options?.length>0)?this.selectedChannel.options[0].url : '';
      
      const videoFormat = (this.selectedChannel && this.selectedChannel.options?.length>0)?this.selectedChannel.options[0].format : undefined;
      this.channelSourceFormat =  videoFormat;

      // EPG
      this.currentEpg = this.epg.find((_epg) => _epg.name===this.selectedChannel?.epg_id);
      setTimeout(() => this.scrollToActiveEpgItem(), 500);

      if (videoFormat==='youtube') {

        if (this.videoElement) {
          this.videoElement.src = '';
        }

        this.youtubeVideoUrlRequestSubscription = this.tdtChannelsService.getYoutubeLiveRedirectUrl(videoUrl).subscribe((_url) => {
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(_url);
        });
        
      } else if (videoFormat==='twitch') {

        if (this.videoElement) {
          this.videoElement.src = '';
        }

        const parent = 'localhost';
        let channelUrl = videoUrl+'&parent='+parent;
        console.log(channelUrl);
        
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(channelUrl);
        console.log(this.safeUrl);
        
      }  else {

        if (this.videoElement) {
          if (!this.selectedChannel) {
            localStorage.removeItem(this.APP_TDT_SELECTED_CHANNEL_KEY);
            this.videoElement.src = videoUrl;
          } else {
            localStorage.setItem(this.APP_TDT_SELECTED_CHANNEL_KEY, JSON.stringify(this.selectedChannel));

            this.videoElement.volume = (this.deviceSettings.isDesktop)?0.05:0.2;
              if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                //console.log('videoElement.canPlayType: ' + this.videoElement.canPlayType('application/vnd.apple.mpegurl'));
                // Native HLS support (Safari)
                this.videoElement.src = videoUrl;
                if (!this.firstLoad()) {
                  this.videoElement.play().catch((e) => console.warn('Error on play', e, this.videoElement));
                }
              } else if (Hls.isSupported()) {
                //console.log('Hls.isSupported: ' + Hls.isSupported());
                // HLS.js fallback for other browsers
                this.hls = new Hls();
                this.hls.loadSource(videoUrl);
                this.hls.attachMedia(this.videoElement);
              } else {
                //console.error('HLS not supported in this browser');
              }
          }
          this.firstLoad.set(false);
        } else {
          console.warn('No video element found');
        }

      }
    }
  }

  loadOthers() {
    this.customChannelsSubscription = this.tdtChannelsService.getCustomChannels().subscribe((_customChannelsList) => {
      const storedOthers = localStorage.getItem(this.APP_TDT_OTHERS_CHANNELS_KEY);
      if (storedOthers) {
        this.others = JSON.parse(storedOthers) as TdtChannelsResponse;
      }
      this.others.countries[1].ambits[0].channels = _customChannelsList;
      this.others = this.getSortedResponse(this.others);
      this.others = this.configChannelCountries(this.others);
    });
  }

  loadSelectedChannel() {
    const storedChannel = localStorage.getItem(this.APP_TDT_SELECTED_CHANNEL_KEY);
    if (storedChannel) {
      this.selectedChannel = JSON.parse(storedChannel) as TdtChannel;
      setTimeout(() => {
        this.openChannel(this.selectedChannel);
      }, 1000);
    }
  }

  loadExpandedNodes() {
    const storedData = localStorage.getItem(this.APP_TDT_EXPANDED_NODES);
    if (storedData) {
      this.expandedItems = JSON.parse(storedData) as string[];
    }
  }

  isFavourite(tdtChannel: TdtChannel): boolean {
    return this.others.countries[0].ambits[0].channels.some((_tdtChannel) => _tdtChannel.name===tdtChannel.name) ||
           this.others.countries[0].ambits[1].channels.some((_tdtChannel) => _tdtChannel.name===tdtChannel.name);
  }

  toggleOthers(tdtChannel: TdtChannel, ambitIdx?: number) {
    if (ambitIdx!==undefined) {
      if (ambitIdx!==1) {
        ambitIdx = 0;
      }
      if (!this.isFavourite(tdtChannel)) {
        this.others.countries[0].ambits[ambitIdx].channels.push(tdtChannel);
      } else {
        this.others.countries[0].ambits[ambitIdx].channels = this.others.countries[0].ambits[ambitIdx].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
      }
    } else {
      this.others.countries[0].ambits[0].channels = this.others.countries[0].ambits[0].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
      this.others.countries[0].ambits[1].channels = this.others.countries[0].ambits[1].channels.filter((_tdtChannel) => _tdtChannel.name!==tdtChannel.name);
    }
    this.saveOthers();
  }

  saveOthers() {
    this.others = this.getSortedResponse(this.others);
    localStorage.setItem(this.APP_TDT_OTHERS_CHANNELS_KEY, JSON.stringify(this.others));
  }

  saveExpandedNodes() {
    localStorage.setItem(this.APP_TDT_EXPANDED_NODES, JSON.stringify(this.expandedItems));
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

  private configChannelCountries(response: TdtChannelsResponse): TdtChannelsResponse {
    response.countries.forEach((_country) => {
      _country.ambits.forEach((_ambit) => {
        _ambit.channels = _ambit.channels.map((_channel) => {
          if (_channel.name.match(/\((.*?)\)/)) {
            _channel.flagClassName = TdtchannelsService.getChannelFlagClassName(_channel.name);
            _channel.countryName = TdtchannelsService.getChannelCountryName(_channel.name);
          } else {
            _channel.flagClassName = '';
          }
          return _channel;
        });
      })
    });
    return response;
  }

  ngOnInit(): void {
    try {
      this.loadOthers();
      this.loadSelectedChannel();
      this.loadExpandedNodes();

      // EPG reloads
      this.epgInterval$ = interval(60000).subscribe(() => {
        this.loadEpg();
      });
    } catch(err) {
      this.errors.push(err);
    }
  }

  ngAfterViewInit(): void {
    this.deviceDetactorService.checkDevice();
  }
  
  ngOnDestroy(): void {
    this.hls?.destroy();
    this.deviceDetectionMobileSubscription?.unsubscribe();
    this.deviceDetectionDesktopSubscription?.unsubscribe();
    this.deviceDetectionTabletSubscription?.unsubscribe();
    this.deviceDetectionLandscapeSubscription?.unsubscribe();
    this.epgTvSubscription?.unsubscribe();
    this.epgRadioSubscription?.unsubscribe();
    this.epgInterval$?.unsubscribe();
    this.tvChannelsSubscription?.unsubscribe();
    this.radioStationsSubscription?.unsubscribe();
    this.customChannelsSubscription?.unsubscribe();
    this.youtubeVideoUrlRequestSubscription?.unsubscribe();
  }

}
