import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <div style="display: flex; gap: 24px; align-items: center;">
        <h1 style="margin: 0; color: #667eea;">Inventory Management</h1>
        <div style="margin-left: auto; display: flex; gap: 16px;">
          <a routerLink="/dashboard" routerLinkActive="active" 
             style="text-decoration: none; padding: 8px 16px; border-radius: 6px; color: #333; transition: background 0.3s;">
            Dashboard
          </a>
          <a routerLink="/create-product" routerLinkActive="active"
             style="text-decoration: none; padding: 8px 16px; border-radius: 6px; color: #333; transition: background 0.3s;">
            Create Product
          </a>
          <a routerLink="/add-to-sell" routerLinkActive="active"
             style="text-decoration: none; padding: 8px 16px; border-radius: 6px; color: #333; transition: background 0.3s;">
            Add to Sell
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    a.active {
      background: #667eea !important;
      color: white !important;
    }
  `]
})
export class NavigationComponent {
}

