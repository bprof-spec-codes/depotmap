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

  errorMessage = '';

  availableProducts: ProductShortDto[] = [];
  compartments: CompartmentOptionDto[] = [];
  productsLoading = false;
  compartmentsLoading = false;

  addedItems: CreateOrderItemDto[] = [];

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
    this.errorMessage = '';
    if (!this.currentRow.productSKU)
    {
      this.errorMessage = 'Kérlek, válassz egy terméket!';
      return;
    }
    if (!this.currentRow.quantity || this.currentRow.quantity < 1) {
      this.errorMessage = 'A darabszám legalább 1 kell legyen!';
      return;
    }
    if (!this.currentRow.fromCompartmentCode){
      this.errorMessage = 'Kérlek, válassz forrás rekeszt!';
      return;
    }

    this.addedItems.push({ ...this.currentRow });
    
    this.currentRow = { productSKU: '', quantity: 1, fromCompartmentCode: '' };
  }

  removeItem(index: number) {
    this.addedItems.splice(index, 1);
  }

  saveOrder() {
    this.errorMessage = '';
    if (this.currentRow.productSKU) {
      this.addNewItem();
      if (this.errorMessage) return;
    }

    if (this.addedItems.length === 0) {
      this.errorMessage = 'Nem menthetsz el egy rendelést tételek nélkül!';
      return;
    }

    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      this.errorMessage = 'Hiba: Nem található a felhasználó azonosítója. Kérlek jelentkezz be újra!';
      return;    
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
        this.errorMessage = err.error?.detail || (err.status === 403 ? 'Nincs jogosultságod új rendelés rögzítéséhez!' : 'Ismeretlen hiba történt a rendelés mentésekor.');
        this.isSaving = false;
      }
    });
  }

  discardOrder() {
    this.isSavedOrDiscarded = true;
    this.router.navigate(['/orders']);
  }
}