import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, DashboardData } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>Dashboard</h2>
      
      @if (loading()) {
        <div class="loading">Loading dashboard data...</div>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else {
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">{{ dashboardData()?.totalProducts || 0 }}</div>
            <div class="stat-label">Total Products</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dashboardData()?.totalInventoryItems || 0 }}</div>
            <div class="stat-label">Items in Inventory</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatCurrency(dashboardData()?.totalInventoryValue || 0) }}</div>
            <div class="stat-label">Total Inventory Value</div>
          </div>
        </div>

        <h3>Products & Inventory</h3>
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (product of dashboardData()?.products || []; track product.productId) {
              <tr>
                <td>{{ product.productId }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td>{{ formatCurrency(product.price) }}</td>
                <td>{{ product.quantity }}</td>
                <td>{{ formatCurrency(product.value) }}</td>
                <td>
                  @if (product.inStock) {
                    <span class="in-stock">In Stock</span>
                  } @else {
                    <span class="out-of-stock">Out of Stock</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                  No products found. Create your first product!
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class DashboardComponent {
  private apiService = inject(ApiService);
  
  dashboardData = signal<DashboardData | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadDashboard();

    // Auto-refresh every 30 seconds
    effect((onCleanup) => {
      const data = this.dashboardData();
      if (data) {
        const timeoutId = setTimeout(() => {
          this.loadDashboard();
        }, 30000);
        onCleanup(() => clearTimeout(timeoutId));
      }
    });
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.apiService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.error || 'Failed to load dashboard data');
        this.loading.set(false);
      }
    });
  }
}
