import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ShelfApiService } from '../../../core/services/shelf-api-service';
import {
  ShelfDetailDto,
  CompartmentDto,
  UpdateShelfDto
} from '../../../core/models/warehouse.models';

@Component({
  selector: 'app-shelf-detail',
  standalone: false,
  templateUrl: './shelf-detail.component.html',
  styleUrls: ['./shelf-detail.component.scss']
})
export class ShelfDetailComponent implements OnInit, OnDestroy {
  warehouseId = '';
  cellId = '';
  shelfId = '';
  shelf: ShelfDetailDto | null = null;
  loading = true;
  error = false;
  actionLoading = false;
  returnTo: string | null = null;

  // Settings modal state
  showSettingsModal = false;
  formLevels = 3;
  formAccessibleFromBothSides = false;
  formLadderRequiredFromLevel: number | null = null;
  saving = false;

  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shelfApiService: ShelfApiService
  ) {}

  ngOnInit(): void {
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goBack(): void {
    if (this.returnTo === 'grid') {
      this.router.navigate(['/warehouses', this.warehouseId]);
    } else {
      this.router.navigate(['/warehouses', this.warehouseId, 'cells', this.cellId]);
    }
  }

  /** Returns level indices from top to bottom for display (highest level at top). */
  get levelIndices(): number[] {
    if (!this.shelf) return [];
    const levels: number[] = [];
    for (let i = this.shelf.levels - 1; i >= 0; i--) {
      levels.push(i);
    }
    return levels;
  }

  getCompartmentsForLevel(levelIndex: number): CompartmentDto[] {
    if (!this.shelf) return [];
    return this.shelf.compartments
      .filter(c => c.levelIndex === levelIndex)
      .sort((a, b) => a.slotIndex - b.slotIndex);
  }

  isLadderLevel(levelIndex: number): boolean {
    if (!this.shelf || this.shelf.ladderRequiredFromLevel == null) return false;
    return levelIndex >= this.shelf.ladderRequiredFromLevel;
  }

  hasStock(compartment: CompartmentDto): boolean {
    return compartment.productStocks && compartment.productStocks.length > 0;
  }

  addCompartment(levelIndex: number): void {
    if (!this.shelf || this.actionLoading) return;
    this.actionLoading = true;
    this.shelfApiService.addCompartment(this.shelfId, levelIndex).subscribe({
      next: (updated) => {
        this.shelf = updated;
        this.actionLoading = false;
      },
      error: (err) => {
        console.error('[ShelfDetail] Add compartment failed:', err);
        this.actionLoading = false;
      }
    });
  }

  removeCompartment(levelIndex: number): void {
    if (!this.shelf || this.actionLoading) return;
    this.actionLoading = true;
    this.shelfApiService.removeCompartment(this.shelfId, levelIndex).subscribe({
      next: (updated) => {
        this.shelf = updated;
        this.actionLoading = false;
      },
      error: (err) => {
        console.error('[ShelfDetail] Remove compartment failed:', err);
        this.actionLoading = false;
      }
    });
  }

  // --- Settings modal ---

  openSettingsModal(): void {
    if (!this.shelf) return;
    this.formLevels = this.shelf.levels;
    this.formAccessibleFromBothSides = this.shelf.accessibleFromBothSides;
    this.formLadderRequiredFromLevel = this.shelf.ladderRequiredFromLevel;
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    if (this.saving) return;
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    if (!this.shelf || this.saving) return;
    if (this.formLevels < 1) return;
    if (
      this.formLadderRequiredFromLevel != null &&
      (this.formLadderRequiredFromLevel < 0 || this.formLadderRequiredFromLevel >= this.formLevels)
    ) {
      return;
    }

    const dto: UpdateShelfDto = {
      levels: this.formLevels,
      accessibleFromBothSides: this.formAccessibleFromBothSides,
      ladderRequiredFromLevel: this.formLadderRequiredFromLevel
    };

    this.saving = true;
    this.shelfApiService.updateShelf(this.cellId, this.shelfId, dto).subscribe({
      next: () => {
        this.shelfApiService.getShelfDetail(this.cellId, this.shelfId).subscribe({
          next: (shelf) => {
            this.shelf = shelf;
            this.saving = false;
            this.showSettingsModal = false;
          },
          error: (err) => {
            console.error('[ShelfDetail] Reload after save failed:', err);
            this.saving = false;
          }
        });
      },
      error: (err) => {
        console.error('[ShelfDetail] Update shelf failed:', err);
        this.saving = false;
      }
    });
  }

  private loadData(): void {
    this.subscription = this.route.params.pipe(
      switchMap(params => {
        this.warehouseId = params['warehouseId'];
        this.cellId = params['cellId'];
        this.shelfId = params['shelfId'];
        this.loading = true;
        this.error = false;
        return this.shelfApiService.getShelfDetail(this.cellId, this.shelfId);
      })
    ).subscribe({
      next: (shelf) => {
        this.shelf = shelf;
        this.loading = false;
      },
      error: (err) => {
        console.error('[ShelfDetail] Failed to load shelf:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }
}
