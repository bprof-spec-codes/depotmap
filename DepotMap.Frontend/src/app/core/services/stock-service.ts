import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment.development';

// DTO-k
export interface ProductStockViewDto {
  productId: string;
  sku: string;
  productName: string;
  compartmentCode: string;
  quantity: number;
  compartmentId: string;
}

export interface StockMovementViewDto {
  id: string;
  productId: string;
  compartmentId: string;
  quantityChange: number;
  movementType: string;
  transactionId?: string;
  createdByUserId?: string;
  timestamp: string;
}

interface ValuesWrapper<T> {
  $values?: T[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductStockService {
  private stockApiBase = `${environment.apiUrl}/ProductStock`;
  private movementApiBase = `${environment.apiUrl}/StockMovement`;

  constructor(private http: HttpClient) {}

  private normalizeResponse<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    const wrapped = response as ValuesWrapper<T> | null;
    if (wrapped && Array.isArray(wrapped.$values)) return wrapped.$values;
    return [];
  }

  // --- KÉSZLET (STOCK) VÉGPONTOK ---
  getAllStocks(): Observable<ProductStockViewDto[]> {
    return this.http.get<unknown>(this.stockApiBase).pipe(
      timeout(5000),
      map(res => this.normalizeResponse<ProductStockViewDto>(res)),
      catchError(() => of([]))
    );
  }

  // --- MOZGÁSOK (MOVEMENT) VÉGPONTOK ---
  getAllMovements(): Observable<StockMovementViewDto[]> {
    return this.http.get<unknown>(this.movementApiBase).pipe(
      timeout(5000),
      map(res => this.normalizeResponse<StockMovementViewDto>(res)),
      catchError(() => of([]))
    );
  }

  getMovementsByProduct(productId: string): Observable<StockMovementViewDto[]> {
    return this.http.get<unknown>(`${this.movementApiBase}/product/${productId}`).pipe(
      timeout(5000),
      map(res => this.normalizeResponse<StockMovementViewDto>(res)),
      catchError(() => of([]))
    );
    console.log(productId)
  }
}