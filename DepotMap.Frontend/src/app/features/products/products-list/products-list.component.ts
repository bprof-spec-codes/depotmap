import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, ProductShortDto, ProductHistoryDto } from '../../../core/services/product-service';
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, defer, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-products-list',
  standalone: false,
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent {
  productsVm$: Observable<{ items: ProductShortDto[]; loading: boolean; error: boolean }>;
  historyVm$: Observable<{ items: ProductHistoryDto[]; loading: boolean; error: boolean }>;
  visibleHistory$: Observable<ProductHistoryDto[]>;

  historyRequested = false;
  selectedProductName = '';
  highlightedProductId: string | null = null;
  historySearch = new BehaviorSubject<string>('');
  historySort = new BehaviorSubject<'newest' | 'oldest'>('newest');

  private historyRequest = new ReplaySubject<{ id: string; name: string }>(1);

  constructor(private productService: ProductService, private router: Router) {
    this.highlightedProductId = (history.state?.highlightProductId as string | undefined) ?? null;

    this.productsVm$ = defer(() => this.productService.loadAll()).pipe(
      map(items => ({ items, loading: false, error: false })),
      startWith({ items: [] as ProductShortDto[], loading: true, error: false }),
      catchError(() => of({ items: [] as ProductShortDto[], loading: false, error: true })),
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
    this.selectedProductName = productName;
    this.historyRequested = true;
    this.historyRequest.next({ id: productId, name: productName });
  }

  onHistorySearchChange(value: string): void {
    this.historySearch.next(value ?? '');
  }

  onHistorySortChange(value: 'newest' | 'oldest'): void {
    this.historySort.next(value ?? 'newest');
  }


  formatAction(actionType: string): string {
    if (actionType === 'edit') return 'Szerkesztés';
    if (actionType === 'delete') return 'Törlés';
    return actionType;
  }

  deleteProduct(id: string) {
    if (!confirm('Biztosan törölni szeretnéd a terméket?')) return;
    this.productService.delete(id).subscribe();
  }

  editProduct(product: ProductShortDto) {
    this.router.navigate(['/products/edit', product.id], {
      state: { product }
    });
  }
}
