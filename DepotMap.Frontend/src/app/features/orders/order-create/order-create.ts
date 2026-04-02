import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderItemViewDto, CreateOrderItemDto } from '../../../core/services/order-service';

@Component({
  selector: 'app-order-create',
  standalone: false,
  templateUrl: './order-create.html',
  styleUrl: './order-create.scss',
})
export class OrderCreate {
  orderId: string | null = null;
  isLoading = true;
  isSavingItem = false;
  
  isSavedOrDiscarded = false;

  addedItems: OrderItemViewDto[] = [];

  currentRow: CreateOrderItemDto = {
    productId: '',
    quantity: 1,
    fromCompartmentId: ''
  };

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.orderService.createOrder({ items: [] }).subscribe({
      next: (res) => {
        this.orderId = res.id;
        this.isLoading = false;
      },
      error: (err) => {
        alert('Hiba a rendelés inicializálásakor!');
        this.router.navigate(['/orders']);
      }
    });
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
    if (!this.orderId) return;

    this.isSavingItem = true;

    this.orderService.addOrderItem(this.orderId, this.currentRow).subscribe({
      next: (updatedOrder) => {
        this.addedItems = updatedOrder.items;
        
        // Kiürítjük a sort a következő tételnek
        this.currentRow = { productId: '', quantity: 1, fromCompartmentId: '' };
        this.isSavingItem = false;
      },
      error: (err) => {
        alert('Hiba a tétel hozzáadásakor: ' + (err.error?.message || err.message));
        this.isSavingItem = false;
      }
    });
  }

  saveOrder() {
    if (this.currentRow.productId) {
      this.orderService.addOrderItem(this.orderId!, this.currentRow).subscribe({
        next: () => this.finalizeAndExit(),
        error: (err) => alert('Hiba az utolsó tétel mentésekor!')
      });
    } else {
      this.finalizeAndExit();
    }
  }

  discardOrder() {
    if (!confirm('Biztosan elveted a rendelést? Minden eddig felvitt tétel törlődik!')) return;
    
    if (this.orderId) {
      this.orderService.deleteOrder(this.orderId).subscribe({
        next: () => {
          this.isSavedOrDiscarded = true; // Zöld utat adunk a Guard-nak
          this.router.navigate(['/orders']);
        },
        error: (err) => alert('Nem sikerült törölni a piszkozatot.')
      });
    }
  }

  private finalizeAndExit() {
    this.isSavedOrDiscarded = true; // Zöld utat adunk a Guard-nak
    this.router.navigate(['/orders']);
  }
}

import { CanDeactivateFn } from '@angular/router';

export const orderCreateGuard: CanDeactivateFn<OrderCreate> = (component) => {
  if (!component.isSavedOrDiscarded) {
    alert('Kérlek, mentsd el vagy vesd el a rendelést az oldal alján lévő gombokkal, mielőtt elhagyod a felületet!');
    return false; // Megakadályozzuk az oldal elhagyását
  }
  return true;
}
