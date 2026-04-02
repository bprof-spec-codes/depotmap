import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderViewDto } from '../../../core/services/order-service';
import { Observable, defer, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {
  ordersVm$: Observable<{ items: OrderViewDto[]; loading: boolean; error: boolean }>;

  expandedOrderIds = new Set<string>();

  constructor(private orderService: OrderService, private router: Router) {
    // 1. Rendelések betöltése és reaktív állapotkezelés
    this.ordersVm$ = defer(() => this.orderService.loadAllOrders()).pipe(
      map(items => {
        // Alapértelmezetten minden rendelést lenyitunk
        items.forEach(order => this.expandedOrderIds.add(order.id));
        return { items, loading: false, error: false };
      }),
      startWith({ items: [] as OrderViewDto[], loading: true, error: false }),
      catchError(() => of({ items: [] as OrderViewDto[], loading: false, error: true })),
      shareReplay(1)
    );
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
      next: () => console.log(`Order ${id} deleted.`),
      error: (err) => alert('Nem sikerült törölni a rendelést: ' + (err.error?.message || err.message))
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
      next: () => console.log(`Order ${order.id} advanced to ${nextStatus}.`),
      error: (err) => alert('Nem sikerült a státusz frissítése: ' + (err.error?.message || err.message))
    });
  }

  // Útvonal készítés gomb -> Átvisz egy másik útvonalra
  createRoute(orderId: string) {
    this.router.navigate(['/routes/create'], { queryParams: { orderId: orderId } });
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
