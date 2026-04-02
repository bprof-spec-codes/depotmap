import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService } from '../../../core/services/product-service';

@Component({
  selector: 'app-product-create',
  standalone: false,
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent {
  form = {
    sku: '',
    name: '',
    description: '',
    price: null as number | null,
    lowStockThreshold: null as number | null,
    primaryStorageLocation: ''
  };

  saving = false;
  errorText = '';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  create(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || !this.form.description || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    this.saving = true;
    this.productService.create({
      sku: this.form.sku,
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      lowStockThreshold: this.form.lowStockThreshold
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: () => {
          this.errorText = 'A létrehozás sikertelen volt.';
        }
      });
  }
}
