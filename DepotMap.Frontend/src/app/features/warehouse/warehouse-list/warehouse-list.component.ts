import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { WarehouseApiService } from '../../../core/services/warehouse-api-service';
import { WarehouseListDto, CreateWarehouseDto } from '../../../core/models/warehouse.models';

@Component({
  selector: 'app-warehouse-list',
  standalone: false,
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent {
  warehousesVm$: Observable<{ items: WarehouseListDto[]; loading: boolean; error: boolean }>;

  showCreateForm = false;
  newName = '';
  newGridWidth = 5;
  newGridHeight = 5;
  creating = false;

  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(
    private warehouseApiService: WarehouseApiService,
    private router: Router
  ) {
    this.warehousesVm$ = this.refresh$.pipe(
      switchMap(() => this.warehouseApiService.getAll().pipe(
        map(items => ({ items, loading: false, error: false })),
        startWith({ items: [] as WarehouseListDto[], loading: true, error: false }),
        catchError(() => of({ items: [] as WarehouseListDto[], loading: false, error: true }))
      )),
      shareReplay(1)
    );
  }

  openWarehouse(id: string): void {
    this.router.navigate(['/warehouses', id]);
  }

  deleteWarehouse(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Biztosan törölni szeretnéd a raktárat?')) return;
    this.warehouseApiService.delete(id).subscribe(() => this.refresh$.next());
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.resetForm();
  }

  createWarehouse(): void {
    if (!this.newName.trim() || this.newGridWidth < 1 || this.newGridHeight < 1) return;

    this.creating = true;
    const dto: CreateWarehouseDto = {
      name: this.newName.trim(),
      gridWidth: this.newGridWidth,
      gridHeight: this.newGridHeight
    };

    this.warehouseApiService.create(dto).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateForm = false;
        this.resetForm();
        this.refresh$.next();
      },
      error: () => {
        this.creating = false;
      }
    });
  }

  private resetForm(): void {
    this.newName = '';
    this.newGridWidth = 5;
    this.newGridHeight = 5;
  }
}
