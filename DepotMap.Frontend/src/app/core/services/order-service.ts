import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface OrderItemViewDto {
  id: string;
  productId: string;
  quantity: number;
  fromCompartmentId?: string;
}

export interface OrderViewDto {
  id: string;
  type: string;
  status: string;
  createdByUserId: string;
  timestamp: string;
  items: OrderItemViewDto[];
}

export interface CreateOrderDto {
  createdByUserId?: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  items: CreateOrderItemDto[];
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  fromCompartmentId?: string;
}

export interface UpdateOrderItemDto {
  quantity: number;
  fromCompartmentId?: string;
}

interface ValuesWrapper<T> {
  $values?: T[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private orderApiBase = `${environment.apiUrl}/Order`;
  private orderItemApiBase = `${environment.apiUrl}/OrderItem`;

  // Állapotkezelés a rendelések listájához
  private ordersSubject = new BehaviorSubject<OrderViewDto[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Biztonsági háló a .NET $values válaszaihoz
  private normalizeResponse<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }
    const wrapped = response as ValuesWrapper<T> | null;
    if (wrapped && Array.isArray(wrapped.$values)) {
      return wrapped.$values;
    }
    return [];
  }


  loadAllOrders(): Observable<OrderViewDto[]> {
    return this.http.get<unknown>(this.orderApiBase).pipe(
      timeout(5000),
      map(response => this.normalizeResponse<OrderViewDto>(response)),
      tap(items => {
        this.ordersSubject.next(items);
      }),
      catchError(() => {
        this.ordersSubject.next([]);
        return of([]);
      })
    );
  }

  getOrderById(id: string): Observable<OrderViewDto> {
    return this.http.get<OrderViewDto>(`${this.orderApiBase}/${id}`);
  }

  createOrder(dto: CreateOrderDto): Observable<OrderViewDto> {
    return this.http.post<OrderViewDto>(this.orderApiBase, dto).pipe(
      tap(() => this.loadAllOrders().subscribe()) // Automatikus frissítés
    );
  }

  updateOrder(id: string, dto: UpdateOrderDto): Observable<OrderViewDto> {
    return this.http.put<OrderViewDto>(`${this.orderApiBase}/${id}`, dto).pipe(
      tap(() => this.loadAllOrders().subscribe())
    );
  }

  updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Observable<OrderViewDto> {
    return this.http.patch<OrderViewDto>(`${this.orderApiBase}/${id}/status`, dto).pipe(
      tap(() => this.loadAllOrders().subscribe())
    );
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete(`${this.orderApiBase}/${id}`, { responseType: 'text' }).pipe(
      tap(() => this.loadAllOrders().subscribe()),
      map(() => void 0)
    );
  }

  

  getOrderItemById(orderId: string, itemId: string): Observable<OrderItemViewDto> {
    return this.http.get<OrderItemViewDto>(`${this.orderItemApiBase}/${orderId}/items/${itemId}`);
  }

  addOrderItem(orderId: string, dto: CreateOrderItemDto): Observable<OrderViewDto> {
    return this.http.post<OrderViewDto>(`${this.orderItemApiBase}/${orderId}/items`, dto).pipe(
      tap(() => this.loadAllOrders().subscribe()) // Frissítjük a teljes listát
    );
  }

  updateOrderItem(orderId: string, itemId: string, dto: UpdateOrderItemDto): Observable<OrderItemViewDto> {
    return this.http.put<OrderItemViewDto>(`${this.orderItemApiBase}/${orderId}/items/${itemId}`, dto).pipe(
      tap(() => this.loadAllOrders().subscribe())
    );
  }

  deleteOrderItem(orderId: string, itemId: string): Observable<void> {
    return this.http.delete(`${this.orderItemApiBase}/${orderId}/items/${itemId}`, { responseType: 'text' }).pipe(
      tap(() => this.loadAllOrders().subscribe()),
      map(() => void 0)
    );
  }
}
