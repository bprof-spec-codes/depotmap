import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WarehouseCellDto,
  CellDetailDto,
  UpdateCellTypeDto,
  BatchUpdateCellsDto
} from '../models/warehouse.models';

@Injectable({ providedIn: 'root' })
export class CellApiService {
  private readonly baseUrl = `${environment.apiUrl}/warehouses`;

  constructor(private http: HttpClient) {}

  getCellsByWarehouse(warehouseId: string): Observable<WarehouseCellDto[]> {
    return this.http.get<WarehouseCellDto[]>(`${this.baseUrl}/${warehouseId}/cells`);
  }

  getCellDetail(warehouseId: string, cellId: string): Observable<CellDetailDto> {
    return this.http.get<CellDetailDto>(`${this.baseUrl}/${warehouseId}/cells/${cellId}`);
  }

  updateCellType(warehouseId: string, cellId: string, dto: UpdateCellTypeDto): Observable<WarehouseCellDto> {
    return this.http.put<WarehouseCellDto>(`${this.baseUrl}/${warehouseId}/cells/${cellId}`, dto);
  }

  batchUpdateCells(warehouseId: string, dto: BatchUpdateCellsDto): Observable<WarehouseCellDto[]> {
    return this.http.put<WarehouseCellDto[]>(`${this.baseUrl}/${warehouseId}/cells/batch`, dto);
  }
}
