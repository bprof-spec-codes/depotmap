import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, ProductShortDto, ProductHistoryDto } from '../../../core/services/product-service';
import { CompartmentService, CompartmentOptionDto } from '../../../core/services/compartment-service';
import { AuthService } from '../../../core/services/auth-service';
import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-products-list',
  standalone: false,
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {
  productsVm$: Observable<{ items: ProductShortDto[]; loading: boolean; error: boolean }>;
  visibleProductsVm$: Observable<{ items: ProductShortDto[]; loading: boolean; error: boolean }>;
  historyVm$: Observable<{ items: ProductHistoryDto[]; loading: boolean; error: boolean }>;
  visibleHistory$: Observable<ProductHistoryDto[]>;

  compartmentOptions: CompartmentOptionDto[] = [];

  openedHistoryProductId: string | null = null;
  highlightedProductId: string | null = null;
  productSearch = new BehaviorSubject<string>('');
  historySearch = new BehaviorSubject<string>('');
  historySort = new BehaviorSubject<'newest' | 'oldest'>('newest');
  canManageProducts = false;
  errorText = '';

  private historyRequest = new ReplaySubject<{ id: string; name: string }>(1);
  private productsReload = new Subject<void>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private compartmentService: CompartmentService,
    private authService: AuthService
  ) {
    this.highlightedProductId = (history.state?.highlightProductId as string | undefined) ?? null;

    this.productsVm$ = this.productsReload.pipe(
      startWith(void 0),
      switchMap(() =>
        this.productService.loadAll().pipe(
          map(items => ({ items, loading: false, error: false })),
          startWith({ items: [] as ProductShortDto[], loading: true, error: false }),
          catchError(() => of({ items: [] as ProductShortDto[], loading: false, error: true }))
        )
      ),
      shareReplay(1)
    );

    this.historyVm$ = this.historyRequest.pipe(
      switchMap(({ id }) =>
        this.productService.getHistory(id).pipe(
          map(items => ({ items, loading: false, error: false })),
          startWith({ items: [] as ProductHistoryDto[], loading: true, error: false }),
          catchError(() => of({ items: [] as ProductHistoryDto[], loading: false, error: true }))
        )
      ),
      startWith({ items: [] as ProductHistoryDto[], loading: false, error: false }),
      shareReplay(1)
    );

    this.visibleProductsVm$ = combineLatest([
      this.productsVm$,
      this.productSearch
    ]).pipe(
      map(([productsVm, search]) => {
        const q = search.trim().toLowerCase();
        if (!q) {
          return productsVm;
        }

        return {
          ...productsVm,
          items: productsVm.items.filter(product =>
            `${product.name ?? ''} ${product.sku ?? ''} ${product.description ?? ''} ${product.price ?? ''} ${product.quantity ?? product.totalStock ?? 0} ${this.formatLocations(product)}`
              .toLowerCase()
              .includes(q)
          )
        };
      }),
      shareReplay(1)
    );

    this.visibleHistory$ = combineLatest([
      this.historyVm$,
      this.historySearch,
      this.historySort
    ]).pipe(
      map(([historyVm, search, sort]) => {
        const q = search.trim().toLowerCase();
        const filtered = q
          ? historyVm.items.filter(h =>
            `${h.actionType} ${h.name} ${h.sku} ${h.createdByUserId}`.toLowerCase().includes(q)
          )
          : historyVm.items;

        return [...filtered].sort((a, b) => {
          const ta = new Date(a.timestamp).getTime();
          const tb = new Date(b.timestamp).getTime();
          if (Number.isNaN(ta) || Number.isNaN(tb)) {
            return 0;
          }
          return sort === 'newest' ? tb - ta : ta - tb;
        });
      }),
      shareReplay(1)
    );

    if (this.highlightedProductId) {
      setTimeout(() => {
        this.highlightedProductId = null;
      }, 6000);
    }
  }

  ngOnInit(): void {
    const role = this.authService.getRole();
    this.canManageProducts = role === 'Manager' || role === 'Officer';

    this.compartmentService.getAll().subscribe({
      next: items => {
        this.compartmentOptions = items;
      },
      error: () => {
        this.compartmentOptions = [];
      }
    });
  }

  formatLocations(product: ProductShortDto): string {
    const ids = (product.productStocks ?? [])
      .map(stock => stock.compartmentId)
      .filter((id): id is string => !!id && id.trim().length > 0);

    const distinctCodes = Array.from(
      new Set(
        ids.map(id => this.compartmentOptions.find(c => c.id === id)?.code ?? id)
      )
    );

    return distinctCodes.length ? distinctCodes.join(', ') : '-';
  }

  onProductSearchChange(value: string): void {
    this.productSearch.next(value ?? '');
  }

  onHistorySearchChange(value: string): void {
    this.historySearch.next(value ?? '');
  }

  onHistorySortChange(value: 'newest' | 'oldest'): void {
    this.historySort.next(value ?? 'newest');
  }

  isHistoryOpen(productId: string): boolean {
    return this.openedHistoryProductId === productId;
  }

  showHistory(productId: string, productName: string): void {
    if (this.openedHistoryProductId === productId) {
      this.openedHistoryProductId = null;
      return;
    }

    this.openedHistoryProductId = productId;
    this.historySearch.next('');
    this.historySort.next('newest');
    this.historyRequest.next({ id: productId, name: productName });
  }

  formatAction(actionType: string): string {
    if (actionType === 'edit') return 'Szerkesztés';
    if (actionType === 'delete') return 'Törlés';
    return actionType;
  }

  deleteProduct(id: string) {
    this.errorText = '';
    if (!confirm('Biztosan törölni szeretnéd a terméket?')) return;
    this.productService.delete(id).subscribe({
      next: () => this.productsReload.next(),
      error: (err) => {
        this.errorText = this.extractErrorMessage(err, 'A törlés sikertelen volt.');
      }
    });
  }

  editProduct(product: ProductShortDto) {
    this.router.navigate(['/products/edit', product.id], {
      state: { product }
    });
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const response = err as { status?: number; error?: { detail?: string } | string } | null;
    if (typeof response?.error === 'string') {
      try {
        const parsed = JSON.parse(response.error) as { detail?: string } | null;
        if (parsed?.detail) {
          return parsed.detail;
        }
      } catch {
        if (response.error.trim().length > 0) {
          return response.error;
        }
      }
    }
    if (typeof response?.error === 'object' && response?.error?.detail) {
      return response.error.detail;
    }
    if (response?.status === 403) {
      return 'Nincs jogosultságod a művelet végrehajtásához!';
    }
    return fallback;
  }
}
