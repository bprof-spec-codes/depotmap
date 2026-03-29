import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap, map, timeout, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface ProductShortDto {
  id: string;
  name: string;
  sku?: string;
  quantity?: number;
  totalStock?: number;
}
interface ValuesWrapper<T> {
  $values?: T[];
}
export interface ProductHistoryDto {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  lowStockThreshold?: number;
  actionType: string;
  createdByUserId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiBase = `${environment.apiUrl}/products`;

  private productsSubject = new BehaviorSubject<ProductShortDto[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadAll(): Observable<ProductShortDto[]> {
  return this.http.get<ProductShortDto[]>(this.apiBase).pipe(
    timeout(5000), // Vegyük lejjebb 5 mp-re a teszt kedvéért
    tap(items => {
      console.log('Adat megérkezett:', items);
      this.productsSubject.next(items);
    }),
    catchError(err => {
      console.error('API hiba történt:', err);
      return of([]); // Hiba esetén üres listát adunk vissza, hogy ne ragadjon be a stream
    })
  );
}

  getById(id: string): Observable<ProductShortDto> {
    return this.http.get<ProductShortDto>(`${this.apiBase}/${id}`);
  }

  getHistory(productId?: string): Observable<ProductHistoryDto[]> {
    const url = `${this.apiBase}/history${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`;
    return this.http.get<ProductHistoryDto[]>(url).pipe(timeout(10000));
  }

  create(dto: Partial<ProductShortDto>): Observable<void> {
    return this.http.post<void>(this.apiBase, dto).pipe(
      switchMap(() => this.http.get<ProductShortDto[]>(this.apiBase)),
      tap(latest => this.productsSubject.next(latest)),
      map(() => void 0)
    );
  }   

  update(id: string, dto: Partial<ProductShortDto>): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${id}`, dto).pipe(
      switchMap(() => this.http.get<ProductShortDto[]>(this.apiBase)),
      tap(latest => this.productsSubject.next(latest)),
      map(() => void 0)
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`).pipe(
      switchMap(() => this.http.get<ProductShortDto[]>(this.apiBase)),
      tap(latest => this.productsSubject.next(latest)),
      map(() => void 0)
    );
  }
}
