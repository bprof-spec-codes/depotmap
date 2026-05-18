import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, defer, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-product-create',
  standalone: false,
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent {
  compartmentsVm$: Observable<{ items: CompartmentOptionDto[]; loading: boolean; error: boolean }>;

  form = {
    sku: '',
    name: '',
    description: '',
    price: null as number | null,
    lowStockThreshold: null as number | null,
  };

  primaryStorageSelection: CompartmentOptionDto | null = null;
  secondaryStorageSelections: (CompartmentOptionDto | null)[] = [];

  saving = false;
  errorText = '';
  canManageProducts = false;

  constructor(
    private productService: ProductService,
    private compartmentService: CompartmentService,
    private router: Router,
    private authService: AuthService
  ) {
    const role = this.authService.getRole();
    this.canManageProducts = role === 'Manager' || role === 'Officer';

    this.compartmentsVm$ = defer(() => this.compartmentService.getAll()).pipe(
      map(items => ({ items, loading: false, error: false })),
      startWith({ items: [] as CompartmentOptionDto[], loading: true, error: false }),
      catchError(() => of({ items: [] as CompartmentOptionDto[], loading: false, error: true })),
      shareReplay(1)
    );
  }

  onSkuChange(value: string): void {
    this.form.sku = value ?? '';
    this.pruneInvalidSelections();
  }

  getAvailableCompartments(compartments: CompartmentOptionDto[]): CompartmentOptionDto[] {
    return compartments.filter(compartment => this.isCompartmentAllowed(compartment));
  }

  isCompartmentAllowed(compartment: CompartmentOptionDto): boolean {
    const existingStocks = (compartment.productStocks ?? [])
      .filter(stock => (stock.productId ?? '').trim().length > 0);
    return existingStocks.length === 0;
  }

  private pruneInvalidSelections(): void {
    if (this.primaryStorageSelection && !this.isCompartmentAllowed(this.primaryStorageSelection)) {
      this.primaryStorageSelection = null;
    }

    this.secondaryStorageSelections = this.secondaryStorageSelections.map(selection =>
      selection && this.isCompartmentAllowed(selection) ? selection : null
    );
  }

  addStorageSelection(): void {
    this.secondaryStorageSelections.push(null);
  }

  removeStorageSelection(index: number): void {
    if (index < 0 || index >= this.secondaryStorageSelections.length) {
      return;
    }

    this.secondaryStorageSelections.splice(index, 1);
  }

  isCompartmentUsedInSecondary(compartmentId: string, currentIndex: number): boolean {
    if (this.primaryStorageSelection?.id === compartmentId) {
      return true;
    }

    return this.secondaryStorageSelections.some(
      (selected, index) => index !== currentIndex && selected?.id === compartmentId
    );
  }

  isPrimaryCompartmentDisabled(compartmentId: string): boolean {
    return this.secondaryStorageSelections.some(selected => selected?.id === compartmentId);
  }

  create(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    const initialStocks = [this.primaryStorageSelection, ...this.secondaryStorageSelections]
      .filter((compartment): compartment is CompartmentOptionDto => compartment !== null)
      .map(compartment => ({ compartmentId: compartment.id, quantity: 0 }));

    if (initialStocks.length === 0) {
      this.errorText = 'Válassz legalább egy tárolóhelyet.';
      return;
    }

    this.saving = true;
    this.productService.create({
      sku: this.form.sku,
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      lowStockThreshold: this.form.lowStockThreshold,
      initialStocks
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (err) => {
          this.errorText = this.extractErrorMessage(err, 'A létrehozás sikertelen volt.');
        }
      });
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const response = err as { status?: number; error?: { detail?: string } } | null;
    if (response?.error?.detail) {
      return response.error.detail;
    }
    if (response?.status === 403) {
      return 'Nincs jogosultságod a művelet végrehajtásához!';
    }
    return fallback;
  }
}