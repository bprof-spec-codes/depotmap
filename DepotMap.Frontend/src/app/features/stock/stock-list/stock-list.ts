import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, defer, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
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

  // --- ÚJ RÉSZ: Lenyitott sorok nyilvántartása ---
  expandedStockIds = new Set<string>();

  constructor(private stockService: ProductStockService, private router: Router) {
    this.stocksVm$ = defer(() => this.stockService.getAllStocks()).pipe(
      map((rawStocks: ProductStockViewDto[]) => {
        const map = new Map<string, GroupedStockVm>();
        
        rawStocks.forEach(s => {
          if (!map.has(s.productId)) {
            map.set(s.productId, { 
              productId: s.productId, 
              sku: s.sku, 
              productName: s.productName, 
              totalQuantity: 0, 
              compartments: [] 
            });
          }
          const group = map.get(s.productId)!;
          group.totalQuantity += s.quantity;
          group.compartments.push({ 
            compartmentId: s.compartmentId, 
            compartmentCode: s.compartmentCode, 
            quantity: s.quantity 
          });
        });
        
        return { items: Array.from(map.values()), loading: false, error: false };
      }),
      startWith({ items: [], loading: true, error: false }),
      catchError(() => of({ items: [], loading: false, error: true })),
      shareReplay(1)
    );
  }

  ngOnInit(): void {}

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