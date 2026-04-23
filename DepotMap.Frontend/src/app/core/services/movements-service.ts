import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment.development';

interface ValuesWrapper<T> {
  $values?: T[];
}

export interface CreateMovementTransactionItemDto {
  productId: string;
  quantity: number;
  fromCompartmentId: string;
  toCompartmentId: string;
}

export interface CreateMovementTransactionDto {
  createdByUserId: string;
  items: CreateMovementTransactionItemDto[];
}

export interface UpdateMovementTransactionDto {
  items?: CreateMovementTransactionItemDto[];
  status?: string;
}

export interface MovementTransactionItemViewDto {
  productId: string;
  quantity: number;
  fromCompartmentId: string;
  toCompartmentId: string;
}

export interface MovementTransactionViewDto {
  id: string;
  status: string;
  type: string;
  timestamp: string;
  createdByUserId: string;
  items: MovementTransactionItemViewDto[];
}

export interface MovementTransactionTableRowDto {
  transactionId: string;
  status: string;
  createdByUserId: string;
  timestamp: string;
  productId: string;
  quantity: number;
  fromCompartmentId: string;
  toCompartmentId: string;
}

export interface MovementTransactionTableFilters {
  date?: string;
  status?: string;
  createdByUserId?: string;
  productId?: string;
  fromCompartmentId?: string;
  toCompartmentId?: string;
  quantity?: number;
}

@Injectable({ providedIn: 'root' })
export class MovementsService {
  private apiBase = `${environment.apiUrl}/movement/transactions`;

  constructor(private http: HttpClient) {}

  private unwrapArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    const wrapped = response as ValuesWrapper<T> | null;
    if (wrapped && Array.isArray(wrapped.$values)) {
      return wrapped.$values;
    }

    return [];
  }

  getAll(): Observable<MovementTransactionViewDto[]> {
    return this.http
      .get<unknown>(this.apiBase)
      .pipe(timeout(7000), map(response => this.unwrapArray<MovementTransactionViewDto>(response)));
  }

  getTableRows(skip = 0, take = 500, filters?: MovementTransactionTableFilters): Observable<MovementTransactionTableRowDto[]> {
    const query = new URLSearchParams({
      skip: String(skip),
      take: String(take)
    });

    if (filters?.date) query.set('date', filters.date);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.createdByUserId) query.set('createdByUserId', filters.createdByUserId);
    if (filters?.productId) query.set('productId', filters.productId);
    if (filters?.fromCompartmentId) query.set('fromCompartmentId', filters.fromCompartmentId);
    if (filters?.toCompartmentId) query.set('toCompartmentId', filters.toCompartmentId);
    if (typeof filters?.quantity === 'number') query.set('quantity', String(filters.quantity));

    return this.http
      .get<unknown>(`${this.apiBase}/table?${query.toString()}`)
      .pipe(timeout(15000), map(response => this.unwrapArray<MovementTransactionTableRowDto>(response)));
  }

  getById(id: string): Observable<MovementTransactionViewDto> {
    return this.http.get<MovementTransactionViewDto>(`${this.apiBase}/${id}`).pipe(timeout(7000));
  }

  create(dto: CreateMovementTransactionDto): Observable<MovementTransactionViewDto> {
    return this.http.post<MovementTransactionViewDto>(this.apiBase, dto).pipe(timeout(7000));
  }

  update(id: string, dto: UpdateMovementTransactionDto): Observable<MovementTransactionViewDto> {
    return this.http.put<MovementTransactionViewDto>(`${this.apiBase}/${id}`, dto).pipe(timeout(7000));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`).pipe(timeout(7000));
  }
}
