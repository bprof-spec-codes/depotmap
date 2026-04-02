import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WarehouseListDto,
  WarehouseDetailDto,
  CreateWarehouseDto,
  UpdateWarehouseDto
} from '../models/warehouse.models';

@Injectable({ providedIn: 'root' })
export class WarehouseApiService {
  private readonly baseUrl = `${environment.apiUrl}/warehouses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WarehouseListDto[]> {
    return this.http.get<WarehouseListDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<WarehouseDetailDto> {
    return this.http.get<WarehouseDetailDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateWarehouseDto): Observable<WarehouseListDto> {
    return this.http.post<WarehouseListDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateWarehouseDto): Observable<WarehouseListDto> {
    return this.http.put<WarehouseListDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
