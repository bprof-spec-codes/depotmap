import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { ProductStockService, StockMovementViewDto } from '../../../core/services/stock-service';

export type StockSortColumn = 'timestamp' | 'productSKU' | 'compartmentCode' | 'movementType' | 'quantityChange' | 'userName';

@Component({
  selector: 'app-stock-movement-list',
  standalone: false,
  templateUrl: './stockmovement.html',
  styleUrls: ['./stockmovement.scss']
})
export class StockMovementListComponent implements OnInit {
  movementsVm$!: Observable<{ items: StockMovementViewDto[]; loading: boolean; error: boolean; productId: string | null}>;
  targetProductId: string | null = null;
  searchTerm$ = new BehaviorSubject<string>('');
  sortBy$ = new BehaviorSubject<StockSortColumn>('timestamp');
  sortDirection$ = new BehaviorSubject<'asc' | 'desc'>('desc'); 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: ProductStockService
  ) {}

  ngOnInit(): void {
    const rawData$ = this.route.paramMap.pipe(
      map(params => params.get('productId')),
      tap(id => this.targetProductId = id),
      switchMap(id => {
        const request$ = id 
          ? this.stockService.getMovementsByProduct(id)
          : this.stockService.getAllMovements();
        return request$;
      }),
      catchError((err) => {
        console.error('Hiba történt:', err);
        return of(null);
      }),
      shareReplay(1)
    );

    this.movementsVm$ = combineLatest([
      rawData$,
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()),
      this.sortBy$,
      this.sortDirection$
    ]).pipe(
      map(([rawItems, search, sortBy, sortDirection]) => {
        if (!rawItems) return { items: [], loading: false, error: true, productId: this.targetProductId };

        let result = [...rawItems];

        if (search) {
          const s = search.toLowerCase();
          result = result.filter(item => 
            item.productSKU?.toLowerCase().includes(s) ||
            item.productId?.toLowerCase().includes(s) ||
            item.compartmentCode?.toLowerCase().includes(s) ||
            item.movementType?.toLowerCase().includes(s) ||
            item.userName?.toLowerCase().includes(s) ||
            item.transactionId?.toLowerCase().includes(s) ||
            item.quantityChange.toString().includes(s)
          );
        }

        result.sort((a, b) => {
          let valA: any = a[sortBy];
          let valB: any = b[sortBy];

          if (sortBy === 'timestamp') {
            valA = new Date(a.timestamp).getTime();
            valB = new Date(b.timestamp).getTime();
          }

          if (valA == null) valA = '';
          if (valB == null) valB = '';

          let comparison = 0;
          if (valA > valB) comparison = 1;
          if (valA < valB) comparison = -1;

          return sortDirection === 'asc' ? comparison : -comparison;
        });

        return { items: result, loading: false, error: false,productId: this.targetProductId };
      }),
      startWith({ items: [], loading: true, error: false, productId: this.targetProductId })
    );
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSortChange(column: StockSortColumn) {
    if (this.sortBy$.value === column) {
      this.sortDirection$.next(this.sortDirection$.value === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy$.next(column);
      this.sortDirection$.next('asc'); 
    }
  }

  getSortIcon(column: StockSortColumn): string {
    if (this.sortBy$.value !== column) return '↕';
    return this.sortDirection$.value === 'asc' ? '↑' : '↓';
  }

  goBack() {
    this.router.navigate(['/inventory']); 
  }

  getMovementColor(qtyChange: number): string {
    return qtyChange > 0 ? 'text-success' : 'text-danger';
  }
}