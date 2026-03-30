import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap, map, timeout, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface ProductShortDto {
  id: string;
  name: string;
  sku?: string;
  price?: number;
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

export interface CreateProductDto {
  name: string;
  sku: string;
  price: number;
  description: string;
  lowStockThreshold: number;
}

export interface UpdateProductDto {
  name: string;
  sku: string;
  price: number;
  description: string;
  lowStockThreshold: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiBase = `${environment.apiUrl}/products`;

  private productsSubject = new BehaviorSubject<ProductShortDto[]>([]);
  public products$ = this.productsSubject.asObservable();
  private latestHistoryByProductId = new Map<string, ProductHistoryDto>();

  constructor(private http: HttpClient) {}

  private normalizeProductsResponse(response: unknown): ProductShortDto[] {
    if (Array.isArray(response)) {
      return response as ProductShortDto[];
    }

    const wrapped = response as ValuesWrapper<ProductShortDto> | null;
    if (wrapped && Array.isArray(wrapped.$values)) {
      return wrapped.$values;
    }

    return [];
  }

  loadAll(): Observable<ProductShortDto[]> {
    return this.http.get<unknown>(this.apiBase).pipe(
      timeout(5000),
      map(response => this.normalizeProductsResponse(response)),
      tap(items => {
        this.productsSubject.next(items);
        this.warmLatestHistoryCache();
      }),
      catchError(() => {
        this.productsSubject.next([]);
        return of([]);
      })
    );
  }

  private warmLatestHistoryCache(): void {
    this.getHistory()
      .pipe(catchError(() => of([] as ProductHistoryDto[])))
      .subscribe(items => {
        const nextMap = new Map<string, ProductHistoryDto>();
        for (const item of items) {
          if (item.productId && !nextMap.has(item.productId)) {
            nextMap.set(item.productId, item);
          }
        }
        this.latestHistoryByProductId = nextMap;
      });
  }

  getLatestHistoryForProduct(productId: string): ProductHistoryDto | undefined {
    return this.latestHistoryByProductId.get(productId);
  }

  getById(id: string): Observable<ProductShortDto> {
    return this.http.get<ProductShortDto>(`${this.apiBase}/${id}`);
  }

  getHistory(productId?: string): Observable<ProductHistoryDto[]> {
    const url = `${this.apiBase}/history${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`;
    return this.http.get<ProductHistoryDto[]>(url).pipe(
      timeout(10000),
      map(items => {
        // Normalizálunk: biztosítjuk, hogy a timestamp ISO formátum
        return items.map(item => ({
          ...item,
          timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString()
        }));
      })
    );
  }

  create(dto: CreateProductDto): Observable<void> {
    return this.http.post(this.apiBase, dto, { responseType: 'text' }).pipe(
      tap(() => {
        // Fire-and-forget refresh so list page gets fresher cache when available.
        this.loadAll().subscribe();
      }),
      map(() => void 0)
    );
  }   

  update(id: string, dto: UpdateProductDto): Observable<void> {
    return this.http.put(`${this.apiBase}/${id}`, dto, { responseType: 'text' }).pipe(
      tap(() => {
        const updated = this.productsSubject.value.map(p =>
          p.id === id
            ? {
                ...p,
                name: dto.name,
                sku: dto.sku
              }
            : p
        );
        this.productsSubject.next(updated);
        this.loadAll().subscribe();
      }),
      map(() => void 0)
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete(`${this.apiBase}/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.loadAll().subscribe();
      }),
      map(() => void 0)
    );
  }
}
