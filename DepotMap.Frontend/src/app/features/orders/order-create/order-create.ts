import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, CreateOrderItemDto } from '../../../core/services/order-service';
import { AuthService } from '../../../core/services/auth-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';
import { CompartmentService, CompartmentOptionDto } from '../../../core/services/compartment-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-order-create',
  standalone: false,
  templateUrl: './order-create.html',
  styleUrls: ['./order-create.scss']
})
export class OrderCreate implements OnInit {
  isSaving = false;
  isSavedOrDiscarded = false;

  availableProducts: ProductShortDto[] = [];
  compartments: CompartmentOptionDto[] = [];
  productsLoading = false;
  compartmentsLoading = false;

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
    private authService: AuthService,
    private productService: ProductService,
    private compartmentService: CompartmentService 
  ) {}

  ngOnInit(): void {
    this.loadAvailableProducts();
    this.loadCompartments();
  }

  private loadAvailableProducts(): void {
    this.productsLoading = true;
    this.productService.loadAll()
      .pipe(finalize(() => this.productsLoading = false))
      .subscribe(items => {
        // Opcionális: Csak azokat a termékeket engedjük kiválasztani, aminek van SKU-ja
        this.availableProducts = items.filter(p => p.sku); 
      });
  }

  private loadCompartments(): void {
    this.compartmentsLoading = true;
    this.compartmentService.getAll()
      .pipe(finalize(() => this.compartmentsLoading = false))
      .subscribe(data => {
        this.compartments = data;
      });
  }

  // Böngésző fül bezárásának/frissítésének blokkolása, ha van már felvitt tétel
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.isSavedOrDiscarded && (this.addedItems.length > 0 || this.currentRow.productSKU)) {
      $event.returnValue = true;
    }
  }

  // --- LEGÖRDÜLŐ LOGIKA ---
  onProductChange(): void {
    // Ha a termék változott, megnézzük, hogy a korábban kiválasztott rekesz még érvényes-e hozzá
    const validCompartments = this.getCompartmentsForProductSKU(this.currentRow.productSKU);
    const stillValid = validCompartments.some(c => c.code === this.currentRow.fromCompartmentCode);

    if (!stillValid) {
      this.currentRow.fromCompartmentCode = ''; // Töröljük a rekeszt, ha már nem érvényes
    }
  }

  getCompartmentsForProductSKU(sku: string): CompartmentOptionDto[] {
    if (!sku) return [];

    const product = this.availableProducts.find(p => p.sku === sku);
    if (!product || !product.productStocks || product.productStocks.length === 0) {
      return []; // Ha nincs ilyen termék vagy nincs készleten, üres a lista
    }

    const allowedCompartments: CompartmentOptionDto[] = [];

    // Összegyűjtjük azokat a rekeszeket, amikben van az adott termékből
    for (const compartment of this.compartments) {
      for (const stock of product.productStocks) {
        if (stock.compartmentId === compartment.id) {
          allowedCompartments.push(compartment);
          break;
        }
      }
    }

    return allowedCompartments;
  }

  // --- ÚJ TÉTEL HOZZÁADÁSA (CSAK MEMÓRIÁBA!) ---
  addNewItem() {
    if (!this.currentRow.productSKU) return alert('Kérlek, válassz egy terméket!');
    if (!this.currentRow.quantity || this.currentRow.quantity < 1) return alert('A darabszám legalább 1 kell legyen!');
    if (!this.currentRow.fromCompartmentCode) return alert('Kérlek, válassz forrás rekeszt!'); // Most már kötelezővé tehetjük

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