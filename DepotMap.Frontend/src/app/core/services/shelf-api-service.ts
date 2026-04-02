import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ShelfListDto,
  ShelfDetailDto,
  CreateShelfDto,
  UpdateShelfDto
} from '../models/warehouse.models';

@Injectable({ providedIn: 'root' })
export class ShelfApiService {
  private readonly cellsBase = `${environment.apiUrl}/cells`;
  private readonly shelvesBase = `${environment.apiUrl}/shelves`;

  constructor(private http: HttpClient) {}

  getShelvesByCell(cellId: string): Observable<ShelfListDto[]> {
    return this.http.get<ShelfListDto[]>(`${this.cellsBase}/${cellId}/shelves`);
  }

  getShelfDetail(cellId: string, shelfId: string): Observable<ShelfDetailDto> {
    return this.http.get<ShelfDetailDto>(`${this.cellsBase}/${cellId}/shelves/${shelfId}`);
  }

  createShelf(cellId: string, dto: CreateShelfDto): Observable<ShelfListDto> {
    return this.http.post<ShelfListDto>(`${this.cellsBase}/${cellId}/shelves`, dto);
  }

  updateShelf(cellId: string, shelfId: string, dto: UpdateShelfDto): Observable<ShelfListDto> {
    return this.http.put<ShelfListDto>(`${this.cellsBase}/${cellId}/shelves/${shelfId}`, dto);
  }

  deleteShelf(cellId: string, shelfId: string): Observable<void> {
    return this.http.delete<void>(`${this.cellsBase}/${cellId}/shelves/${shelfId}`);
  }

  addCompartment(shelfId: string, levelIndex: number): Observable<ShelfDetailDto> {
    return this.http.post<ShelfDetailDto>(`${this.shelvesBase}/${shelfId}/levels/${levelIndex}/compartments`, {});
  }

  removeCompartment(shelfId: string, levelIndex: number): Observable<ShelfDetailDto> {
    return this.http.delete<ShelfDetailDto>(`${this.shelvesBase}/${shelfId}/levels/${levelIndex}/compartments`);
  }
}
