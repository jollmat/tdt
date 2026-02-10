import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, debounceTime, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectorService {

  isDesktop = new BehaviorSubject(false);
  isTablet = new BehaviorSubject(false);
  isMobile = new BehaviorSubject(false);
  isLandscape = new BehaviorSubject(false);

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
    this.isLandscape.next(this.checkLandscape());

    console.log({
      isMobile: this.isMobile.getValue(),
      isTablet: this.isTablet.getValue(),
      isDesktop: this.isDesktop.getValue(),
      isLandscape: this.isLandscape.getValue()
    });
  }

  checkMobile(): boolean {
    return window.innerWidth<700;
  }

  checkTablet(): boolean {
    return window.innerWidth<=1024 && window.innerWidth>=700;
  }

  checkDesktop(): boolean {
    return window.innerWidth>1024;
  }

  checkLandscape(): boolean {
    return window.innerWidth>window.innerHeight;
  }
}
