import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, debounceTime, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectorService {

  isDesktop = new BehaviorSubject(false);
  isTablet = new BehaviorSubject(false);
  isMobile = new BehaviorSubject(false);

  constructor(
    private readonly ngZone: NgZone,
  ) {

    // Listen to window resize
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(200)
        )
        .subscribe(deviceType => {
          // update in Angular zone so components react
          this.ngZone.run(() => this.checkDevice());
        });
    });

    this.checkDevice();
  }

  checkDevice() {
    this.isDesktop.next(this.checkDesktop());
    this.isMobile.next(this.checkMobile());
    this.isTablet.next(this.checkTablet());

    console.log({
      isMobile: this.isMobile.getValue(),
      isTablet: this.isTablet.getValue(),
      isDesktop: this.isDesktop.getValue()
    });
  }

  checkMobile(): boolean {
    const ua = navigator.userAgent;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  }

  checkTablet(): boolean {
    const ua = navigator.userAgent;
    return /iPad|Tablet/i.test(ua);
  }

  checkDesktop(): boolean {
    return !this.checkMobile() && !this.checkTablet();
  }
}
