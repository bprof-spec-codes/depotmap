import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { ProductStockService, StockMovementViewDto } from '../../../core/services/stock-service';

@Component({
  selector: 'app-stock-movement-list',
  standalone: false,
  templateUrl: './stockmovement.html',
  styleUrls: ['./stockmovement.scss']
})
export class StockMovementListComponent implements OnInit {
  // Beletettük a productId-t a stream-be! Nincs többé külön targetProductId változó.
  movementsVm$!: Observable<{ items: StockMovementViewDto[]; loading: boolean; error: boolean; productId: string | null }>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: ProductStockService
  ) {}

  ngOnInit(): void {
    this.movementsVm$ = this.route.paramMap.pipe(
      map(params => params.get('productId')),
      switchMap(id => {
        const request$ = id 
          ? this.stockService.getMovementsByProduct(id)
          : this.stockService.getAllMovements();
          console.log(id)

        return request$.pipe(
          map(items => ({ items, loading: false, error: false, productId: id })),
          startWith({ items: [], loading: true, error: false, productId: id }),
          catchError((err) => {
            console.error('Hiba történt:', err);
            return of({ items: [], loading: false, error: true, productId: id });
          })
        );
      }),
      shareReplay(1)
    );
  }

  goBack() {
    this.router.navigate(['/inventory']); 
  }

  getMovementColor(qtyChange: number): string {
    return qtyChange > 0 ? 'text-success' : 'text-danger';
  }
}