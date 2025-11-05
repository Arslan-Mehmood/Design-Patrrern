import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent],
  template: `
    <div class="container">
      <app-navigation></app-navigation>
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  title = 'Inventory Management System';
}

