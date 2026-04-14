import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService, ProductDetailDto } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';

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
  compartments: CompartmentOptionDto[] = [];
  compartmentsLoading = true;
  primaryStorageSelection = '';
  secondaryStorageSelections: string[] = [];

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
    private productService: ProductService,
    private compartmentService: CompartmentService
  ) {
    this.loadCompartments();
  }

  private loadCompartments(): void {
    this.compartmentsLoading = true;
    this.compartmentService.getAll().subscribe({
      next: compartments => {
        this.compartments = compartments;
        this.compartmentsLoading = false;
      },
      error: () => {
        this.compartmentsLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const productFromState = history.state?.product as ProductDetailDto | undefined;

    if (!this.id) {
      this.errorText = 'Hiányzó termék azonosító.';
      return;
    }

    if (productFromState) {
      this.form.name = productFromState.name ?? '';
      this.form.sku = productFromState.sku ?? '';
      this.form.price = typeof productFromState.price === 'number' ? productFromState.price : 0;
      this.form.lowStockThreshold = typeof productFromState.lowStockThreshold === 'number' ? productFromState.lowStockThreshold : 0;
      this.form.description = productFromState.description ?? '';

      const storageIds = (productFromState.productStocks ?? [])
        .map(stock => stock.compartmentId)
        .filter(Boolean);

      this.primaryStorageSelection = storageIds[0] ?? '';
      this.secondaryStorageSelections = storageIds.slice(1);
    }

    this.loading = true;

    this.productService.getById(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (product: ProductDetailDto) => {
          this.form.name = product.name ?? '';
          this.form.sku = product.sku ?? '';
          this.form.price = typeof product.price === 'number' ? product.price : 0;
          this.form.lowStockThreshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 0;
          this.form.description = product.description ?? '';

          const storageIds = (product.productStocks ?? [])
            .map(stock => stock.compartmentId)
            .filter(Boolean);

          this.primaryStorageSelection = storageIds[0] ?? '';
          this.secondaryStorageSelections = storageIds.slice(1);
        },
        error: () => {
          this.errorText = 'Nem sikerült betölteni a termék adatait.';
        }
      });
  }

  addStorageSelection(): void {
    this.secondaryStorageSelections.push('');
  }

  removeStorageSelection(index: number): void {
    if (index < 0 || index >= this.secondaryStorageSelections.length) {
      return;
    }

    this.secondaryStorageSelections.splice(index, 1);
  }

  isCompartmentUsedInSecondary(compartmentId: string, currentIndex: number): boolean {
    if (this.primaryStorageSelection === compartmentId) {
      return true;
    }

    return this.secondaryStorageSelections.some((selected, index) => index !== currentIndex && selected === compartmentId);
  }

  isPrimaryCompartmentDisabled(compartmentId: string): boolean {
    return this.secondaryStorageSelections.includes(compartmentId);
  }

  save(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || !this.form.description || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    const initialStocks = [this.primaryStorageSelection, ...this.secondaryStorageSelections]
      .filter(compartmentId => compartmentId.trim().length > 0)
      .map(compartmentId => ({ compartmentId, quantity: 0 }));

    if (initialStocks.length === 0) {
      this.errorText = 'Válassz legalább egy tárolóhelyet.';
      return;
    }

    this.saving = true;
    this.productService.update(this.id, {
      sku: this.form.sku,
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      lowStockThreshold: this.form.lowStockThreshold,
      initialStocks
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
