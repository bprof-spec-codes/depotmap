import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {
  ngZone: 'zone.js'
})
  .catch(err => console.error(err));
