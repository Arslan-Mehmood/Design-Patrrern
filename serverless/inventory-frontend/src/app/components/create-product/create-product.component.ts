import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <h2>Create New Product</h2>
      
      @if (successMessage()) {
        <div class="alert alert-success">{{ successMessage() }}</div>
      }
      
      @if (errorMessage()) {
        <div class="alert alert-error">{{ errorMessage() }}</div>
      }

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Product Name *</label>
          <input 
            id="name" 
            type="text" 
            formControlName="name"
            placeholder="Enter product name">
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <input 
            id="description" 
            type="text" 
            formControlName="description"
            placeholder="Enter product description">
        </div>

        <div class="form-group">
          <label for="price">Price *</label>
          <input 
            id="price" 
            type="number" 
            formControlName="price"
            step="0.01"
            min="0"
            placeholder="Enter price">
        </div>

        <div class="form-group">
          <label for="category">Category *</label>
          <select 
            id="category" 
            formControlName="category">
            <option value="">Select a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
            <option value="Books">Books</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit" [disabled]="loading() || productForm.invalid">
          {{ loading() ? 'Creating...' : 'Create Product' }}
        </button>
      </form>
    </div>
  `
})
export class CreateProductComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  productForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required]
  });

  loading = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const productData = this.productForm.value;
    this.apiService.createProduct(productData).subscribe({
      next: (response) => {
        this.successMessage.set('Product created successfully!');
        this.loading.set(false);
        // Reset form
        this.productForm.reset({
          name: '',
          description: '',
          price: 0,
          category: ''
        });
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.error || 'Failed to create product');
        this.loading.set(false);
      }
    });
  }
}
