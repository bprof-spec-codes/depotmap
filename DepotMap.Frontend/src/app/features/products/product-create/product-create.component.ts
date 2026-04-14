import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';

@Component({
  selector: 'app-product-create',
  standalone: false,
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent implements OnInit {
  form = {
    sku: '',
    name: '',
    description: '',
    price: null as number | null,
    lowStockThreshold: null as number | null,
  };

  storageSelections: string[] = [''];
  compartments: CompartmentOptionDto[] = [];

  saving = false;
  errorText = '';

  constructor(
    private productService: ProductService,
    private compartmentService: CompartmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompartments();
  }

  loadCompartments(): void {
    this.compartmentService.getAll().subscribe({
      next: compartments => {
        this.compartments = compartments;
      },
      error: () => {
        this.errorText = 'A tárolóhelyek betöltése nem sikerült.';
      }
    });
  }

  addStorageSelection(): void {
    this.storageSelections.push('');
  }

  removeStorageSelection(index: number): void {
    if (index === 0 || this.storageSelections.length === 1) {
      return;
    }

    this.storageSelections.splice(index, 1);
  }

  isCompartmentUsed(compartmentId: string, currentIndex: number): boolean {
    return this.storageSelections.some((selected, index) => index !== currentIndex && selected === compartmentId);
  }

  create(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || !this.form.description || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    const initialStocks = this.storageSelections
      .filter(compartmentId => compartmentId.trim().length > 0)
      .map(compartmentId => ({ compartmentId, quantity: 0 }));

    if (initialStocks.length === 0) {
      this.errorText = 'Válassz legalább egy tárolóhelyet.';
      return;
    }

    this.saving = true;
    this.productService.create({
      sku: this.form.sku,
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      lowStockThreshold: this.form.lowStockThreshold,
      initialStocks
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: () => {
          this.errorText = 'A létrehozás sikertelen volt.';
        }
      });
  }
}
