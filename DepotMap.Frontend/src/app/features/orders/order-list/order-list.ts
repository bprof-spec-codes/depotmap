import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderViewDto, PickingTaskDto } from '../../../core/services/order-service';
import { BehaviorSubject, combineLatest, Observable, defer, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

export type OrderSortColumn = 'timestamp' | 'status' | 'id' | 'userName';

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.scss']
})
export class OrderList implements OnInit {
  ordersVm$!: Observable<{ items: OrderViewDto[]; loading: boolean; error: boolean }>;

  expandedOrderIds = new Set<string>();
  private refresh$ = new BehaviorSubject<void>(undefined);
  searchTerm$ = new BehaviorSubject<string>('');
  sortBy$ = new BehaviorSubject<OrderSortColumn>('timestamp');
  sortDirection$ = new BehaviorSubject<'asc' | 'desc'>('desc');
  routeByOrderId: Record<string, PickingTaskDto[]> = {};
  routeErrorByOrderId: Record<string, string> = {};
  routeLoadingOrderId: string | null = null;
  routeLoadedOrderIds = new Set<string>();

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    const rawData$ = this.refresh$.pipe(
      switchMap(() => this.orderService.loadAllOrders()),
      catchError((err) => {
        console.error('Hiba az adatok lekérésekor', err);
        return of(null);
      }),
      shareReplay(1)
    );

    // 2. Keresés és Rendezés összekötése a memóriában
    this.ordersVm$ = combineLatest([
      rawData$,
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()),
      this.sortBy$,
      this.sortDirection$
    ]).pipe(
      map(([rawItems, search, sortBy, sortDirection]) => {
        if (!rawItems) return { items: [], loading: false, error: true };

        let result = [...rawItems];

        // --- KERESÉS ---
        if (search) {
          const s = search.toLowerCase();
          result = result.filter(order => {
            // A. Fő rendelés adatokban keresés
            const inMain = 
              order.id?.toLowerCase().includes(s) ||
              order.status?.toLowerCase().includes(s) ||
              order.userIdentifier?.toLowerCase().includes(s) ||
              order.userName?.toLowerCase().includes(s) ||
              order.timestamp?.includes(s);

            // B. A rendelés BELSŐ TÉTELEIBEN (cikkszám, kód) való keresés!
            const inItems = order.items?.some(item => 
              item.productSKU?.toLowerCase().includes(s) ||
              item.fromCompartmentCode?.toLowerCase().includes(s) ||
              item.quantity.toString().includes(s)
            );

            // Ha bármelyikben benne van, a rendelés megjelenik!
            return inMain || inItems;
          });
        }

        // --- RENDEZÉS ---
        result.sort((a, b) => {
          let valA: any = a[sortBy];
          let valB: any = b[sortBy];

          // Dátumok összehasonlítása
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

        return { items: result, loading: false, error: false };
      }),
      startWith({ items: [], loading: true, error: false }) // Betöltés alatti állapot
    );
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSortChange(column: OrderSortColumn) {
    if (this.sortBy$.value === column) {
      this.sortDirection$.next(this.sortDirection$.value === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy$.next(column);
      this.sortDirection$.next('desc'); // Új oszlopnál legyen csökkenő a kezdő (pl legújabb, vagy Z-A)
    }
  }

  getSortIcon(column: OrderSortColumn): string {
    if (this.sortBy$.value !== column) return '↕';
    return this.sortDirection$.value === 'asc' ? '↑' : '↓';
  }

  canEdit(status: string): boolean {
    return status === 'Planning' || status === 'Processing';
  }

  canDelete(status: string): boolean {
    return status === 'Planning';
  }

  toggleOrderDetails(orderId: string): void {
    if (this.expandedOrderIds.has(orderId)) {
      this.expandedOrderIds.delete(orderId);
    } else {
      this.expandedOrderIds.add(orderId);
    }
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderIds.has(orderId);
  }

  editOrder(order: OrderViewDto) {
    this.router.navigate(['/orders/edit', order.id], {
      state: { order }
    });
  }

  deleteOrder(id: string) {
    if (!confirm('Biztosan törölni szeretnéd a rendelést? Ezt nem lehet visszavonni!')) return;
    
    this.orderService.deleteOrder(id).subscribe({
      next: () => { 
        console.log(`Order ${id} deleted.`);
        this.refresh$.next(); 
      },
      error: (err) => alert('Nem sikerült törölni a rendelést.')
    });
  }

  advanceStatus(order: OrderViewDto) {
    let nextStatus = '';
    if (order.status === 'Planning') nextStatus = 'Processing';
    else if (order.status === 'Processing') nextStatus = 'Closed';
    
    if (!nextStatus) return;

    if (nextStatus === 'Closed') {
       if(!confirm('Biztosan lezárod a rendelést? Ezzel fizikailag levonjuk a termékeket a polcról!')) return;
    }

    this.orderService.updateOrderStatus(order.id, { status: nextStatus }).subscribe({
      next: () => { console.log(`Order ${order.id} advanced to ${nextStatus}.`);
      this.refresh$.next(); },
      error: (err) => alert('Nem sikerült a státusz frissítése.')
    });
  }

  createRoute(orderId: string) {
    this.routeLoadingOrderId = orderId;
    this.routeErrorByOrderId[orderId] = '';

    this.orderService.getOptimizedRoute(orderId).subscribe({
      next: (route) => {
        this.routeByOrderId[orderId] = route.filter(
          (step) => step.cellType?.toLowerCase() !== 'entrance'
        );
        this.routeLoadedOrderIds.add(orderId);
        this.routeLoadingOrderId = null;
        this.expandedOrderIds.add(orderId);
      },
      error: () => {
        this.routeByOrderId[orderId] = [];
        this.routeErrorByOrderId[orderId] = 'Nem sikerült lekérni az útvonalat.';
        this.routeLoadedOrderIds.add(orderId);
        this.routeLoadingOrderId = null;
      }
    });
  }

  getRouteForOrder(orderId: string): PickingTaskDto[] {
    return this.routeByOrderId[orderId] ?? [];
  }

  getRouteError(orderId: string): string {
    return this.routeErrorByOrderId[orderId] ?? '';
  }

  isRouteLoading(orderId: string): boolean {
    return this.routeLoadingOrderId === orderId;
  }

  isRouteLoaded(orderId: string): boolean {
    return this.routeLoadedOrderIds.has(orderId);
  }

  getNextStatusLabel(currentStatus: string): string {
    if (currentStatus === 'Planning') return '-> Összekészítés';
    if (currentStatus === 'Processing') return '-> Lezárás';
    return '';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Planning': return 'badge-planning';
      case 'Processing': return 'badge-processing';
      case 'Closed': return 'badge-closed';
      default: return '';
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'Planning': return 'Tervezés alatt';
      case 'Processing': return 'Összekészítés';
      case 'Closed': return 'Lezárva';
      default: return status;
    }
  }
}