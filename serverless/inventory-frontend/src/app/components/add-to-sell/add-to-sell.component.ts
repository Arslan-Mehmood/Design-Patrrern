import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Product } from '../../services/api.service';

@Component({
  selector: 'app-add-to-sell',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <h2>Add Product to Inventory</h2>
      
      @if (successMessage()) {
        <div class="alert alert-success">{{ successMessage() }}</div>
      }
      
      @if (errorMessage()) {
        <div class="alert alert-error">{{ errorMessage() }}</div>
      }

      <form [formGroup]="inventoryForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="productId">Product ID *</label>
          <input 
            id="productId" 
            type="text" 
            formControlName="productId"
            placeholder="Enter product ID">
        </div>

        <div class="form-group">
          <label for="quantity">Quantity *</label>
          <input 
            id="quantity" 
            type="number" 
            formControlName="quantity"
            min="1"
            placeholder="Enter quantity">
        </div>

        <button type="submit" [disabled]="loading() || inventoryForm.invalid">
          {{ loading() ? 'Adding...' : 'Add to Inventory' }}
        </button>
      </form>
    </div>
  `
})
export class AddToSellComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  inventoryForm: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(1)]]
  });

  loading = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.inventoryForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { productId, quantity } = this.inventoryForm.value;
    this.apiService.addToSell(productId, quantity).subscribe({
      next: (response) => {
        this.successMessage.set(`Successfully added ${quantity} units to inventory!`);
        this.loading.set(false);
        // Reset form
        this.inventoryForm.reset({
          productId: '',
          quantity: 0
        });
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.error || 'Failed to add product to inventory');
        this.loading.set(false);
      }
    });
  }
}

