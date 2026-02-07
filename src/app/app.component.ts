import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DeviceDetectorService } from './services/device-detector.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'tdtchannels';

  deviceClass: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  deviceDetectionTabletSubscription?: Subscription;
  deviceDetectionMobileSubscription?: Subscription;
  deviceDetectionDesktoptSubscription?: Subscription;
  
  constructor(
    private deviceDetectorService: DeviceDetectorService
  ) {
    this.deviceDetectionDesktoptSubscription = this.deviceDetectorService.isDesktop.subscribe((_res) => {
      if (_res) { this.deviceClass = 'desktop'; }
    });
    this.deviceDetectionTabletSubscription = this.deviceDetectorService.isTablet.subscribe((_res) => {
      if (_res) { this.deviceClass = 'tablet'; }
    });
    this.deviceDetectionMobileSubscription = this.deviceDetectorService.isMobile.subscribe((_res) => {
      if (_res) { this.deviceClass = 'mobile'; }
    });
  }

  ngOnDestroy(): void {
    if (this.deviceDetectionTabletSubscription) {
      this.deviceDetectionTabletSubscription.unsubscribe();
    }
    if (this.deviceDetectionMobileSubscription) {
      this.deviceDetectionMobileSubscription.unsubscribe();
    }
    if (this.deviceDetectionDesktoptSubscription) {
      this.deviceDetectionDesktoptSubscription.unsubscribe();
    }
  }

}
