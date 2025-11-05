import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  totalProducts: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  products: Array<Product & { inStock: boolean; quantity: number; value: number }>;
  inventory: Array<{
    productId: string;
    name: string;
    quantity: number;
    value: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = signal<string>(''); // Will be set via environment config

  constructor(private http: HttpClient) {
    // Use environment configuration
    this.apiUrl.set(environment.apiUrl);
  }

  setApiUrl(url: string): void {
    this.apiUrl.set(url);
  }

  createProduct(product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Observable<any> {
    return this.http.post(`${this.apiUrl()}/products`, product);
  }

  addToSell(productId: string, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl()}/inventory/add`, { productId, quantity });
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl()}/dashboard`);
  }
}

