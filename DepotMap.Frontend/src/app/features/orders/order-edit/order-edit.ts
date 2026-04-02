import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, CreateOrderItemDto, OrderViewDto } from '../../../core/services/order-service';

@Component({
  selector: 'app-order-edit',
  standalone: false,
  templateUrl: './order-edit.html',
  styleUrl: './order-edit.scss',
})
export class OrderEdit implements OnInit {
orderId!: string;
  isLoading = true;
  isSaving = false;
  isSavedOrDiscarded = false;

  editingItems: CreateOrderItemDto[] = [];

  currentRow: CreateOrderItemDto = {
    productId: '',
    quantity: 1,
    fromCompartmentId: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id')!;

    const stateOrder = history.state.order as OrderViewDto;
    
    if (stateOrder && stateOrder.items) {
      this.populateForm(stateOrder);
    } else {
      this.orderService.getOrderById(this.orderId).subscribe({
        next: (order) => this.populateForm(order),
        error: (err) => {
          alert('Nem sikerült betölteni a rendelést. Lehet, hogy már törölték.');
          this.router.navigate(['/orders']);
        }
      });
    }
  }

  private populateForm(order: OrderViewDto) {
    this.editingItems = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      fromCompartmentId: item.fromCompartmentId || ''
    }));
    this.isLoading = false;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.isSavedOrDiscarded) {
      $event.returnValue = true;
    }
  }

  addNewItem() {
    if (!this.currentRow.productId) return alert('Kérlek, add meg a Termék ID-t!');
    if (!this.currentRow.quantity || this.currentRow.quantity < 1) return alert('A darabszám legalább 1 kell legyen!');

    this.editingItems.push({ ...this.currentRow });
    
    this.currentRow = { productId: '', quantity: 1, fromCompartmentId: '' };
  }

  removeItem(index: number) {
    this.editingItems.splice(index, 1);
  }

  saveOrder() {
    if (this.currentRow.productId) {
      this.addNewItem();
    }

    if (this.editingItems.length === 0) {
      return alert('Egy rendelés nem lehet üres! Ha törölni akarod, használd a listaoldalon a Törlés gombot.');
    }

    this.isSaving = true;

    // Elküldjük a frissített listát a backend PUT végpontjára
    this.orderService.updateOrder(this.orderId, { items: this.editingItems }).subscribe({
      next: () => {
        this.isSavedOrDiscarded = true;
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        alert('Hiba a szerkesztés mentésekor: ' + (err.error?.message || err.message));
        this.isSaving = false;
      }
    });
  }

  discardOrder() {
    if (!confirm('Biztosan elveted a módosításokat? A rendelés visszaáll az eredeti állapotába!')) return;
    
    this.isSavedOrDiscarded = true;
    this.router.navigate(['/orders']);
  }
}


import { CanDeactivateFn } from '@angular/router';

export const orderEditGuard: CanDeactivateFn<OrderEdit> = (component) => {
  if (!component.isSavedOrDiscarded) {
    alert('Kérlek, mentsd el vagy vesd el a szerkesztést az oldal alján lévő gombokkal, mielőtt elhagyod a felületet!');
    return false;
  }
  return true;
}
