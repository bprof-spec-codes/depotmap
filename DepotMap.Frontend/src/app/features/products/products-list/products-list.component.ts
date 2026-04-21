import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, ProductShortDto, ProductHistoryDto } from '../../../core/services/product-service';
import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-products-list',
  standalone: false,
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent {
  productsVm$: Observable<{ items: ProductShortDto[]; loading: boolean; error: boolean }>;
  visibleProductsVm$: Observable<{ items: ProductShortDto[]; loading: boolean; error: boolean }>;
  historyVm$: Observable<{ items: ProductHistoryDto[]; loading: boolean; error: boolean }>;
  visibleHistory$: Observable<ProductHistoryDto[]>;

  openedHistoryProductId: string | null = null;
  highlightedProductId: string | null = null;
  productSearch = new BehaviorSubject<string>('');
  historySearch = new BehaviorSubject<string>('');
  historySort = new BehaviorSubject<'newest' | 'oldest'>('newest');

  private historyRequest = new ReplaySubject<{ id: string; name: string }>(1);
  private productsReload = new Subject<void>();

  constructor(private productService: ProductService, private router: Router) {
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
            (product.name ?? '').toLowerCase().includes(q)
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

  isHistoryOpen(productId: string): boolean {
    return this.openedHistoryProductId === productId;
  }

  onHistorySearchChange(value: string): void {
    this.historySearch.next(value ?? '');
  }

  onProductSearchChange(value: string): void {
    this.productSearch.next(value ?? '');
  }

  onHistorySortChange(value: 'newest' | 'oldest'): void {
    this.historySort.next(value ?? 'newest');
  }

  formatLocations(product: ProductShortDto): string {
    const ids = (product.productStocks ?? [])
      .map(stock => stock.compartmentId)
      .filter(id => !!id && id.trim().length > 0);

    const distinct = Array.from(new Set(ids));
    return distinct.length ? distinct.join(', ') : '-';
  }


  formatAction(actionType: string): string {
    if (actionType === 'edit') return 'Szerkesztés';
    if (actionType === 'delete') return 'Törlés';
    return actionType;
  }

  deleteProduct(id: string) {
    if (!confirm('Biztosan törölni szeretnéd a terméket?')) return;
    this.productService.delete(id).subscribe({
      next: () => this.productsReload.next(),
      error: () => {
        // Error state is already represented by the list VM on reload attempt.
      }
    });
  }

  editProduct(product: ProductShortDto) {
    this.router.navigate(['/products/edit', product.id], {
      state: { product }
    });
  }
}
