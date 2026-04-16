import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CellApiService } from '../../../core/services/cell-api-service';
import { ShelfApiService } from '../../../core/services/shelf-api-service';
import {
  CellDetailDto,
  ShelfListDto,
  CreateShelfDto,
  UpdateShelfDto
} from '../../../core/models/warehouse.models';

@Component({
  selector: 'app-cell-detail',
  standalone: false,
  templateUrl: './cell-detail.component.html',
  styleUrls: ['./cell-detail.component.scss']
})
export class CellDetailComponent implements OnInit, OnDestroy {
  warehouseId = '';
  cellId = '';
  cell: CellDetailDto | null = null;
  loading = true;
  error = false;

  // Grid dimensions
  gridCols = 3;
  gridRows = 3;

  // Shelf map for quick lookup by "x,y"
  shelfMap = new Map<string, ShelfListDto>();

  // Modal state
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  modalShelf: ShelfListDto | null = null;
  modalX = 0;
  modalY = 0;

  // Form fields
  formLevels = 3;
  formAccessibleFromBothSides = false;
  formLadderRequiredFromLevel: number | null = null;

  saving = false;

  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cellApiService: CellApiService,
    private shelfApiService: ShelfApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/warehouses', this.warehouseId]);
  }

  // --- Grid helpers ---

  get gridCells(): { x: number; y: number }[] {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridCols; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }

  getShelfAt(x: number, y: number): ShelfListDto | undefined {
    return this.shelfMap.get(`${x},${y}`);
  }

  // --- Click handlers ---

  onCellClick(x: number, y: number): void {
    const shelf = this.getShelfAt(x, y);
    if (shelf) {
      this.openEditModal(shelf);
    } else {
      this.openCreateModal(x, y);
    }
  }

  // dblclick → shelf detail navigation (disabled until F4 ShelfDetail route exists)
  // onShelfDblClick(shelf: ShelfListDto): void {
  //   this.router.navigate(['/warehouses', this.warehouseId, 'cells', this.cellId, 'shelves', shelf.id]);
  // }

  // --- Create modal ---

  openCreateModal(x: number, y: number): void {
    this.modalMode = 'create';
    this.modalShelf = null;
    this.modalX = x;
    this.modalY = y;
    this.formLevels = 3;
    this.formAccessibleFromBothSides = false;
    this.formLadderRequiredFromLevel = null;
    this.showModal = true;
  }

  // --- Edit modal ---

  openEditModal(shelf: ShelfListDto): void {
    this.modalMode = 'edit';
    this.modalShelf = shelf;
    this.modalX = shelf.x;
    this.modalY = shelf.y;
    this.formLevels = shelf.levels;
    this.formAccessibleFromBothSides = shelf.accessibleFromBothSides;
    this.formLadderRequiredFromLevel = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalShelf = null;
  }

  // --- Save (create or update) ---

  saveShelf(): void {
    if (this.modalMode === 'create') {
      this.createShelf();
    } else {
      this.updateShelf();
    }
  }

  // --- Delete ---

  deleteShelf(): void {
    if (!this.modalShelf) return;
    if (!confirm('Biztosan törölni szeretnéd ezt a polcot?')) return;

    const shelfId = this.modalShelf.id;
    this.saving = true;
    this.shelfApiService.deleteShelf(this.cellId, shelfId).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.refreshShelves();
      },
      error: (err) => {
        console.error('[CellDetail] Delete shelf failed:', err);
        this.saving = false;
      }
    });
  }

  // --- Private ---

  private loadData(): void {
    this.subscription = this.route.params.pipe(
      switchMap(params => {
        this.warehouseId = params['warehouseId'];
        this.cellId = params['cellId'];
        this.loading = true;
        this.error = false;
        return this.cellApiService.getCellDetail(this.warehouseId, this.cellId);
      })
    ).subscribe({
      next: (cell) => {
        this.cell = cell;
        this.buildShelfMap(cell.shelves);
        this.computeGridSize(cell.shelves);
        this.loading = false;
      },
      error: (err) => {
        console.error('[CellDetail] Failed to load cell:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  private refreshShelves(): void {
    this.shelfApiService.getShelvesByCell(this.cellId).subscribe({
      next: (shelves) => {
        if (this.cell) {
          this.cell = { ...this.cell, shelves };
        }
        this.buildShelfMap(shelves);
        this.computeGridSize(shelves);
      },
      error: (err) => {
        console.error('[CellDetail] Failed to refresh shelves:', err);
      }
    });
  }

  private buildShelfMap(shelves: ShelfListDto[]): void {
    this.shelfMap.clear();
    for (const shelf of shelves) {
      this.shelfMap.set(`${shelf.x},${shelf.y}`, shelf);
    }
  }

  private computeGridSize(shelves: ShelfListDto[]): void {
    let maxX = 2;
    let maxY = 2;
    for (const s of shelves) {
      if (s.x > maxX) maxX = s.x;
      if (s.y > maxY) maxY = s.y;
    }
    this.gridCols = maxX + 2;
    this.gridRows = maxY + 2;
  }

  private createShelf(): void {
    const dto: CreateShelfDto = {
      x: this.modalX,
      y: this.modalY,
      levels: this.formLevels,
      accessibleFromBothSides: this.formAccessibleFromBothSides,
      ladderRequiredFromLevel: this.formLadderRequiredFromLevel
    };

    this.saving = true;
    this.shelfApiService.createShelf(this.cellId, dto).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.refreshShelves();
      },
      error: (err) => {
        console.error('[CellDetail] Create shelf failed:', err);
        this.saving = false;
      }
    });
  }

  private updateShelf(): void {
    if (!this.modalShelf) return;

    const dto: UpdateShelfDto = {
      levels: this.formLevels,
      accessibleFromBothSides: this.formAccessibleFromBothSides,
      ladderRequiredFromLevel: this.formLadderRequiredFromLevel
    };

    this.saving = true;
    this.shelfApiService.updateShelf(this.cellId, this.modalShelf.id, dto).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.refreshShelves();
      },
      error: (err) => {
        console.error('[CellDetail] Update shelf failed:', err);
        this.saving = false;
      }
    });
  }
}
