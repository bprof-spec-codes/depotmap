import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';

@Component({
  selector: 'app-product-edit',
  standalone: false,
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss']
})
export class ProductEditComponent implements OnInit {
  id = '';
  saving = false;
  loading = false;
  errorText = '';

  form = {
    sku: '',
    name: '',
    description: '',
    price: null as number | null,
    lowStockThreshold: null as number | null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const product = (history.state?.product ?? null) as ProductShortDto | null;

    if (!this.id) {
      this.errorText = 'Hiányzó termék azonosító.';
      return;
    }

    if (product) {
      this.form.name = product.name ?? '';
      this.form.sku = product.sku ?? '';
      this.form.price = typeof product.price === 'number' ? product.price : null;
    }

    this.form.price = this.form.price ?? 0;
    this.form.lowStockThreshold = 0;
    this.form.description = '';

    const cached = this.productService.getLatestHistoryForProduct(this.id);
    if (cached) {
      this.form.description = cached.description ?? this.form.description;
      this.form.price = typeof cached.price === 'number' ? cached.price : this.form.price;
      this.form.lowStockThreshold =
        typeof cached.lowStockThreshold === 'number' ? cached.lowStockThreshold : this.form.lowStockThreshold;
    }

    this.loading = true;
    this.productService.getHistory(this.id)
      .pipe(
        timeout(5000),
        catchError(() => of([])),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: h => {
          if (h.length > 0) {
            const latest = h[0];
            this.form.description = latest.description ?? '';
            this.form.price = typeof latest.price === 'number' ? latest.price : 0;
            this.form.lowStockThreshold = typeof latest.lowStockThreshold === 'number' ? latest.lowStockThreshold : 0;
          }
        },
        error: () => {
          // Keep defaults; editing can still continue.
        }
      });
  }

  save(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || !this.form.description || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    this.saving = true;
    this.productService.update(this.id, {
      sku: this.form.sku,
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      lowStockThreshold: this.form.lowStockThreshold
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () =>
          this.router.navigate(['/products'], {
            state: { highlightProductId: this.id }
          }),
        error: () => {
          this.errorText = 'A mentés sikertelen volt.';
        }
      });
  }
}
