import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const appConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes), provideAnimationsAsync()
  ]
};

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
