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

  primaryStorageSelection = '';
  secondaryStorageSelections: string[] = [];
  compartments: CompartmentOptionDto[] = [];
  compartmentsLoading = true;

  saving = false;
  errorText = '';

  constructor(
    private productService: ProductService,
    private compartmentService: CompartmentService,
    private router: Router
  ) {
    this.loadCompartments();
  }

  ngOnInit(): void {
  }

  loadCompartments(): void {
    this.compartmentsLoading = true;
    this.compartmentService.getAll().subscribe({
      next: compartments => {
        this.compartments = compartments;
        this.compartmentsLoading = false;
      },
      error: () => {
        this.errorText = 'A tárolóhelyek betöltése nem sikerült.';
        this.compartmentsLoading = false;
      }
    });
  }

  addStorageSelection(): void {
    this.secondaryStorageSelections.push('');
  }

  removeStorageSelection(index: number): void {
    if (index < 0 || index >= this.secondaryStorageSelections.length) {
      return;
    }

    this.secondaryStorageSelections.splice(index, 1);
  }

  isCompartmentUsedInSecondary(compartmentId: string, currentIndex: number): boolean {
    if (this.primaryStorageSelection === compartmentId) {
      return true;
    }

    return this.secondaryStorageSelections.some((selected, index) => index !== currentIndex && selected === compartmentId);
  }

  isPrimaryCompartmentDisabled(compartmentId: string): boolean {
    return this.secondaryStorageSelections.includes(compartmentId);
  }

  create(): void {
    this.errorText = '';

    if (!this.form.sku || !this.form.name || !this.form.description || this.form.price === null || this.form.lowStockThreshold === null) {
      this.errorText = 'Minden kötelező mezőt tölts ki.';
      return;
    }

    const initialStocks = [this.primaryStorageSelection, ...this.secondaryStorageSelections]
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
