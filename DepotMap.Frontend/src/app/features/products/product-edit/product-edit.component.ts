import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, defer, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith } from 'rxjs/operators';
import { ProductService, ProductDetailDto } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';

@Component({
  selector: 'app-product-edit',
  standalone: false,
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss']
})
export class ProductEditComponent implements OnInit {
  compartmentsVm$: Observable<{ items: CompartmentOptionDto[]; loading: boolean; error: boolean }>;

  id = '';
  saving = false;
  loading = false;
  errorText = '';

  compartmentOptions: CompartmentOptionDto[] = [];

  primaryStorageSelection: CompartmentOptionDto | null = null;
  secondaryStorageSelections: (CompartmentOptionDto | null)[] = [];

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
    this.compartmentsVm$ = defer(() => this.compartmentService.getAll()).pipe(
      map(items => {
        this.compartmentOptions = items;
        return { items, loading: false, error: false };
      }),
      startWith({ items: [] as CompartmentOptionDto[], loading: true, error: false }),
      catchError(() => of({ items: [] as CompartmentOptionDto[], loading: false, error: true })),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.id) {
      this.errorText = 'Hiányzó termék azonosító.';
      return;
    }

    // Előbb betöltjük a compartmenteket, majd utána a productot
    this.compartmentService.getAll().pipe(
      finalize(() => {
        this.loadProduct();
      })
    ).subscribe({
      next: items => {
        this.compartmentOptions = items;
      },
      error: () => { }
    });
  }

  private loadProduct(): void {
    this.loading = true;

    this.productService.getById(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (product: ProductDetailDto) => {
          this.fillForm(product);
        },
        error: () => {
          this.errorText = 'Nem sikerült betölteni a termék adatait.';
        }
      });
  }

  private fillForm(product: ProductDetailDto): void {
    this.form.name = product.name ?? '';
    this.form.sku = product.sku ?? '';
    this.form.price = typeof product.price === 'number' ? product.price : 0;
    this.form.lowStockThreshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 0;
    this.form.description = product.description ?? '';

    const storageIds = (product.productStocks ?? [])
      .map(stock => stock.compartmentId)
      .filter((id): id is string => !!id);

    this.primaryStorageSelection = this.findCompartmentById(storageIds[0]) ?? null;
    this.secondaryStorageSelections = storageIds
      .slice(1)
      .map(id => this.findCompartmentById(id))
      .filter((compartment): compartment is CompartmentOptionDto => compartment !== null);
  }

  private findCompartmentById(compartmentId?: string): CompartmentOptionDto | null {
    if (!compartmentId) {
      return null;
    }

    return this.compartmentOptions.find(c => c.id === compartmentId) ?? null;
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

  compareCompartments(a: CompartmentOptionDto | null, b: CompartmentOptionDto | null): boolean {
    return (a?.id ?? null) === (b?.id ?? null);
  }

  getAvailableCompartments(compartments: CompartmentOptionDto[]): CompartmentOptionDto[] {
    return compartments.filter(compartment =>
      this.isCompartmentEmpty(compartment) || this.isSelectedCompartment(compartment.id)
    );
  }

  private isCompartmentEmpty(compartment: CompartmentOptionDto): boolean {
    const existingStocks = (compartment.productStocks ?? [])
      .filter(stock => (stock.productId ?? '').trim().length > 0);
    return existingStocks.length === 0;
  }

  private isSelectedCompartment(compartmentId: string): boolean {
    if (this.primaryStorageSelection?.id === compartmentId) {
      return true;
    }

    return this.secondaryStorageSelections.some(selected => selected?.id === compartmentId);
  }

  save(): void {
    this.errorText = '';

    if (
      !this.form.sku ||
      !this.form.name ||
      !this.form.description ||
      this.form.price === null ||
      this.form.lowStockThreshold === null
    ) {
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