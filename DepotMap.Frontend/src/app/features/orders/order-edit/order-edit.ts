import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, CreateOrderItemDto, OrderViewDto } from '../../../core/services/order-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';
import { CompartmentService, CompartmentOptionDto } from '../../../core/services/compartment-service';
import { finalize, forkJoin } from 'rxjs';

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

  availableProducts: ProductShortDto[] = [];
  compartments: CompartmentOptionDto[] = [];
  productsLoading = false;
  compartmentsLoading = false;

  editingItems: CreateOrderItemDto[] = [];

  currentRow: CreateOrderItemDto = {
    productSKU: '',
    quantity: 1,
    fromCompartmentCode: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
    private compartmentService: CompartmentService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id')!;

    this.loadAvailableProducts();
    this.loadCompartments();
    this.loadOrderData();

    
  }

  private loadAvailableProducts(): void {
    this.productsLoading = true;
    this.productService.loadAll()
      .pipe(finalize(() => (this.productsLoading = false)))
      .subscribe({
        next: (items) => {
          // Csak a cikkszámmal (SKU) rendelkező termékeket engedjük
          this.availableProducts = items.filter(p => p.sku);
        },
        error: () => console.error('Hiba a termékek betöltésekor')
      });
  }

  private loadCompartments(): void {
    this.compartmentsLoading = true;
    this.compartmentService.getAll().subscribe({
      next: (data) => {
        this.compartments = data;
        this.compartmentsLoading = false;
      },
      error: () => {
        this.compartmentsLoading = false;
        console.error('Hiba a rekeszek betöltésekor');
      }
    });
  }

  private loadOrderData(): void
  {
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
      productSKU: item.productSKU,
      quantity: item.quantity,
      fromCompartmentCode: item.fromCompartmentCode || ''
    }));
    this.isLoading = false;
  }

  getCompartmentsForProductSKU(sku: string): CompartmentOptionDto[] {
    if (!sku) return [];
    
    const product = this.availableProducts.find(p => p.sku === sku);
    if (!product || !product.productStocks || product.productStocks.length === 0) {
      return [];
    }

    const allowedCompartments: CompartmentOptionDto[] = [];

    // Csak azt a rekeszt engedjük, ahol fizikailag van a termékből
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

  onProductChange(item: CreateOrderItemDto): void {
    const validCompartments = this.getCompartmentsForProductSKU(item.productSKU);
    let found = false;

    for (const compartment of validCompartments) {
      if (compartment.code === item.fromCompartmentCode) {
        found = true;
        break;
      }
    }

    if (item.fromCompartmentCode && !found) {
      item.fromCompartmentCode = ''; // Ha már nem érvényes a rekesz, töröljük
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.isSavedOrDiscarded) {
      $event.returnValue = true;
    }
  }

  addNewItem() {
    if (!this.currentRow.productSKU) return alert('Kérlek, add meg a Termék ID-t!');
    if (!this.currentRow.quantity || this.currentRow.quantity < 1) return alert('A darabszám legalább 1 kell legyen!');

    this.editingItems.push({ ...this.currentRow });
    
    this.currentRow = { productSKU: '', quantity: 1, fromCompartmentCode: '' };
  }

  removeItem(index: number) {
    this.editingItems.splice(index, 1);
  }

  saveOrder() {
    if (this.currentRow.productSKU) {
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