import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateProductComponent } from './components/create-product/create-product.component';
import { AddToSellComponent } from './components/add-to-sell/add-to-sell.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create-product', component: CreateProductComponent },
  { path: 'add-to-sell', component: AddToSellComponent }
];

