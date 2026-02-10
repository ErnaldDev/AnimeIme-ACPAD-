import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent {
  constructor() {
    // Add passive event listeners
    this.addPassiveEventListeners();
  }

  private addPassiveEventListeners() {
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    passiveEvents.forEach(eventName => {
      document.addEventListener(eventName, () => {}, {
        passive: true,
        capture: false
      });
    });
  }
}
