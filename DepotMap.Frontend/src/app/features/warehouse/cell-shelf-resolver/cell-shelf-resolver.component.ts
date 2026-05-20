import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShelfApiService } from '../../../core/services/shelf-api-service';
import { CreateShelfDto, ShelfListDto } from '../../../core/models/warehouse.models';

@Component({
  selector: 'app-cell-shelf-resolver',
  standalone: false,
  templateUrl: './cell-shelf-resolver.component.html'
})
export class CellShelfResolverComponent implements OnInit {
  warehouseId = '';
  cellId = '';
  loading = true;
  creating = false;
  error = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shelfApiService: ShelfApiService
  ) {}

  ngOnInit(): void {
    this.warehouseId = this.route.snapshot.paramMap.get('warehouseId') ?? '';
    this.cellId = this.route.snapshot.paramMap.get('cellId') ?? '';
    this.resolveShelf();
  }

  goToWarehouse(): void {
    this.router.navigate(['/warehouses', this.warehouseId]);
  }

  private resolveShelf(): void {
    this.loading = true;
    this.error = false;
    this.shelfApiService.getShelvesByCell(this.cellId).subscribe({
      next: (shelves) => {
        if (shelves.length > 0) {
          this.navigateToShelf(shelves[0]);
        } else {
          this.createDefaultShelf();
        }
      },
      error: (err) => {
        console.error('[CellShelfResolver] Failed to load shelves:', err);
        this.loading = false;
        this.error = true;
        this.errorMessage = err.error?.detail || null;
      }
    });
  }

  private createDefaultShelf(): void {
    this.creating = true;
    const dto: CreateShelfDto = {
      x: 0,
      y: 0,
      levels: 3,
      accessibleFromBothSides: false,
      ladderRequiredFromLevel: null
    };
    this.shelfApiService.createShelf(this.cellId, dto).subscribe({
      next: (shelf) => {
        this.navigateToShelf(shelf);
      },
      error: (err) => {
        console.error('[CellShelfResolver] Failed to create default shelf:', err);
        this.creating = false;
        this.loading = false;
        this.error = true;
        this.errorMessage = err.error?.detail || null;
      }
    });
  }

  private navigateToShelf(shelf: ShelfListDto): void {
    this.router.navigate(
      ['/warehouses', this.warehouseId, 'cells', this.cellId, 'shelves', shelf.id],
      { queryParams: { returnTo: 'grid' }, replaceUrl: true }
    );
  }
}
