import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, CreateOrderItemDto } from '../../../core/services/order-service';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-order-create',
  standalone: false,
  templateUrl: './order-create.html',
  styleUrls: ['./order-create.scss']
})
export class OrderCreate implements OnInit {
  isSaving = false;
  isSavedOrDiscarded = false;

  // Itt gyűjtjük a tételeket a memóriában (nem küldjük el rögtön!)
  addedItems: CreateOrderItemDto[] = [];

  // Az aktuálisan kitöltendő (üres) sor
  currentRow: CreateOrderItemDto = {
    productSKU: '',
    quantity: 1,
    fromCompartmentCode: ''
  };

  constructor(
    private orderService: OrderService, 
    private router: Router,
    private authService: AuthService 
  ) {}

  ngOnInit(): void {
    // Nincs több backend hívás és várakozás betöltéskor! Azonnal használható a felület.
  }

  // Böngésző fül bezárásának/frissítésének blokkolása, ha van már felvitt tétel
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.isSavedOrDiscarded && (this.addedItems.length > 0 || this.currentRow.productSKU)) {
      $event.returnValue = true;
    }
  }

  // --- ÚJ TÉTEL HOZZÁADÁSA (CSAK MEMÓRIÁBA!) ---
  addNewItem() {
    if (!this.currentRow.productSKU) return alert('Kérlek, add meg a Termék ID-t!');
    if (!this.currentRow.quantity || this.currentRow.quantity < 1) return alert('A darabszám legalább 1 kell legyen!');

    // Lemásoljuk a sort és betesszük a listába
    this.addedItems.push({ ...this.currentRow });
    
    // Kiürítjük a beviteli mezőket a következő tételnek
    this.currentRow = { productSKU: '', quantity: 1, fromCompartmentCode: '' };
  }

  // --- TÉTEL TÖRLÉSE A LISTÁBÓL ---
  removeItem(index: number) {
    this.addedItems.splice(index, 1);
  }

  saveOrder() {
    if (this.currentRow.productSKU) {
      this.addNewItem();
    }

    if (this.addedItems.length === 0) {
      return alert('Nem menthetsz el egy rendelést tételek nélkül!');
    }

    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      return alert('Hiba: Nem található a felhasználó azonosítója. Kérlek jelentkezz be újra!');
    }

    this.isSaving = true;

    const newOrder = {
      createdByUserId: currentUserId,
      items: this.addedItems
    };

    this.orderService.createOrder(newOrder).subscribe({
      next: (res) => {
        this.isSavedOrDiscarded = true;
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        alert('Hiba a rendelés mentésekor: ' + (err.error?.message || err.message));
        this.isSaving = false;
      }
    });
  }

  discardOrder() {
    if (this.addedItems.length > 0 || this.currentRow.productSKU) {
      if (!confirm('Biztosan elveted a rendelést? Minden megadott adat elvész!')) return;
    }
    
    this.isSavedOrDiscarded = true;
    this.router.navigate(['/orders']);
  }
}