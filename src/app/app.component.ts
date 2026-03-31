import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private router: Router, private zone: NgZone) {
    this.initializeApp();
  }

  initializeApp() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        try {
          const url = new URL(event.url);
          if (url.hostname.toLowerCase() === 'pepp3rrr.github.io') {
            const appPath = url.pathname;

            if (appPath) {
              this.router.navigateByUrl(appPath);
            }
          }
        } catch (e) {
          console.error('Invalid URL received from appUrlOpen event', e);
        }
      });
    });
  }
}
