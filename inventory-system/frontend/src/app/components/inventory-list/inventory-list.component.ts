import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inventory-container">
      <h2>Inventory Items</h2>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <table *ngIf="items.length > 0 && !loading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td>${{ item.price }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="items.length === 0 && !loading && !error" class="empty">
        No inventory items found
      </div>
    </div>
  `,
  styles: [`
    .inventory-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .loading, .error, .empty {
      padding: 20px;
      text-align: center;
    }
    .error {
      color: red;
    }
  `]
})
export class InventoryListComponent implements OnInit {
  items: InventoryItem[] = [];
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.loading = true;
    this.error = '';
    const apiUrl = (window as any).__API_URL__ || '/api';
    
    this.http.get<InventoryItem[]>(`${apiUrl}/inventory`).subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory items';
        this.loading = false;
        console.error(err);
      }
    });
  }
}

