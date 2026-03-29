import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService, ProductShortDto, ProductHistoryDto } from '../../../core/services/product-service';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-products-list',
  standalone: false,
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit, OnDestroy {
  get products$() {
    return this.productService.products$;
  }
  selectedHistory: ProductHistoryDto[] = [];
  loading = false;
  loadError = false;
  historyLoading = false;
  historyRequested = false;
  historyError = false;
  selectedProductName = '';
  historySearch = '';
  historySort: 'newest' | 'oldest' = 'newest';

  private historySub: Subscription | undefined;
  private productsSub: Subscription | undefined;
  private products: ProductShortDto[] = [];

  constructor(private productService: ProductService) {}

  private loadProducts(): void {
    this.loadError = false;
    this.loading = true;
    this.productService.loadAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        error: () => { this.loadError = true; }
      });
  }

  ngOnInit(): void {
    this.productsSub = this.products$.subscribe(p => {
      this.products = p;
    });
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.productsSub?.unsubscribe();
    this.historySub?.unsubscribe();
  }

  showHistory(productId: string): void {
    const product = this.products.find((p: ProductShortDto) => p.id === productId);
    this.selectedProductName = product?.name ?? '';
    this.historyRequested = true;
    this.historyError = false;
    this.selectedHistory = [];
    this.historyLoading = true;
    // cancel previous history request if any
    this.historySub?.unsubscribe();
    this.historySub = this.productService.getHistory(productId)
      .pipe(finalize(() => (this.historyLoading = false)))
      .subscribe({
        next: h => {
          this.selectedHistory = h;
        },
        error: () => {
          this.historyError = true;
        }
      });
  }

  get visibleHistory(): ProductHistoryDto[] {
    const q = this.historySearch.trim().toLowerCase();
    const filtered = q
      ? this.selectedHistory.filter(h =>
          `${h.actionType} ${h.name} ${h.sku} ${h.createdByUserId}`.toLowerCase().includes(q)
        )
      : this.selectedHistory;

    return [...filtered].sort((a, b) => {
      // Robusztus dátumkezelés: ISO string -> Date -> timestamp
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();

      // Ha a dátum feldolgozása hibás, fallback a default sorrendelésre
      if (isNaN(ta) || isNaN(tb)) {
        console.warn('Érvénytelen timestamp:', a.timestamp, b.timestamp);
        return 0;
      }

      // Explicit sorrendezés: newest = nagyobból kisebb (legújabb elöl), oldest = kicsibből nagyobb
      if (this.historySort === 'newest') {
        return tb - ta; // Újabb dátum lesz előbb
      } else {
        return ta - tb; // Régebbi dátum lesz előbb
      }
    });
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

  editProduct(id: string) {
    // placeholder - navigálni lehet egy edit oldalra
    console.log('Edit', id);
  }
}
