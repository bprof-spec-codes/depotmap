import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, defer, of } from 'rxjs';
import { catchError, debounceTime, map, shareReplay, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ProductStockService, ProductStockViewDto } from '../../../core/services/stock-service';

export interface GroupedStockVm {
  productId: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  compartments: { compartmentId: string; compartmentCode: string; quantity: number }[];
}

@Component({
  selector: 'app-product-stock-list',
  standalone: false,
  templateUrl: './stock-list.html',
  styleUrls: ['./stock-list.scss']
})
export class ProductStockListComponent implements OnInit {
  stocksVm$: Observable<{ items: GroupedStockVm[]; loading: boolean; error: boolean }>;
  expandedStockIds = new Set<string>();

  searchTerm$ = new BehaviorSubject<string>('');
  sortBy$ = new BehaviorSubject<'productName' | 'sku' | 'totalQuantity'>('productName');
  sortDirection$ = new BehaviorSubject<'asc' | 'desc'>('asc');

  constructor(private stockService: ProductStockService, private router: Router) {
    const rawData$ = this.stockService.getAllStocks().pipe(
      map((rawStocks: ProductStockViewDto[]) => {
        // ... Csoportosítás logikája (változatlan) ...
        const map = new Map<string, GroupedStockVm>();
        rawStocks.forEach(s => {
          if (!map.has(s.productId)) {
            map.set(s.productId, { productId: s.productId, sku: s.sku, productName: s.productName, totalQuantity: 0, compartments: [] });
          }
          const group = map.get(s.productId)!;
          group.totalQuantity += s.quantity;
          group.compartments.push({ compartmentId: s.compartmentId, compartmentCode: s.compartmentCode, quantity: s.quantity });
        });
        return Array.from(map.values());
      }),
      catchError(() => of(null)) // Ha hiba van, null-t adunk tovább
    );

    // 2. Összekötjük a csoportosított adatokat a keresővel és a rendezővel
    this.stocksVm$ = combineLatest([
      rawData$,
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()), // Késleltetett keresés
      this.sortBy$,
      this.sortDirection$
    ]).pipe(
      map(([groupedData, search, sortBy, sortDirection]) => {
        if (!groupedData) return { items: [], loading: false, error: true }; // Backend hiba esetén

        let result = [...groupedData];

        // --- KERESÉS ---
        if (search) {
          const s = search.toLowerCase();
          result = result.filter(item => 
            item.productName.toLowerCase().includes(s) || // Keresés Névben
            item.sku.toLowerCase().includes(s) ||         // Keresés Cikkszámban
            item.compartments.some(c => c.compartmentCode?.toLowerCase().includes(s)) // Keresés a Rekesz kódok között!
          );
        }

        // --- RENDEZÉS ---
        result.sort((a, b) => {
          let valA: any, valB: any;

          if (sortBy === 'totalQuantity') {
            valA = a.totalQuantity; valB = b.totalQuantity;
          } else if (sortBy === 'sku') {
            valA = a.sku; valB = b.sku;
          } else {
            valA = a.productName; valB = b.productName;
          }

          let comparison = 0;
          if (valA > valB) comparison = 1;
          if (valA < valB) comparison = -1;

          return sortDirection === 'asc' ? comparison : -comparison;
        });

        return { items: result, loading: false, error: false };
      }),
      startWith({ items: [], loading: true, error: false }),
      shareReplay(1)
    );
  }

  ngOnInit(): void {}

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSortChange(column: 'productName' | 'sku' | 'totalQuantity') {
    if (this.sortBy$.value === column) {
      // Ha ugyanarra kattintunk, megfordítjuk az irányt
      this.sortDirection$.next(this.sortDirection$.value === 'asc' ? 'desc' : 'asc');
    } else {
      // Ha újra kattintunk, alapértelmezetten növekvő
      this.sortBy$.next(column);
      this.sortDirection$.next('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy$.value !== column) return '↕';
    return this.sortDirection$.value === 'asc' ? '↑' : '↓';
  }

  // --- ÚJ RÉSZ: Lenyitó/Csukó függvények ---
  toggleStockDetails(productId: string): void {
    if (this.expandedStockIds.has(productId)) {
      this.expandedStockIds.delete(productId);
    } else {
      this.expandedStockIds.add(productId);
    }
  }

  isStockExpanded(productId: string): boolean {
    return this.expandedStockIds.has(productId);
  }

  goToHistory(productId: string) {
    this.router.navigate(['/stock-movements', productId]);
  }
}