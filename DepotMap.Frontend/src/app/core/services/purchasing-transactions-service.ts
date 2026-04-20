import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, map, retry, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment.development';

interface ValuesWrapper<T> {
	$values?: T[];
}

export interface CreatePurchasingTransactionItemDto {
	productId: string;
	quantity: number;
	toCompartmentId: string;
}

export interface CreatePurchasingTransactionDto {
	createdByUserId: string;
	items: CreatePurchasingTransactionItemDto[];
}

export interface UpdatePurchasingTransactionDto {
	items?: CreatePurchasingTransactionItemDto[];
	status?: string;
}

export interface PurchasingTransactionItemViewDto {
	productId: string;
	quantity: number;
	toCompartmentId: string;
}

export interface PurchasingTransactionViewDto {
	id: string;
	status: string;
	type: string;
	timestamp: string;
	createdByUserId: string;
	items: PurchasingTransactionItemViewDto[];
}

export interface PurchasingTransactionTableRowDto {
	transactionId: string;
	status: string;
	createdByUserId: string;
	timestamp: string;
	productId: string;
	toCompartmentId: string;
	quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PurchasingTransactionsService {
	private apiBase = `${environment.apiUrl}/purchasing/transactions`;

	constructor(private http: HttpClient) { }

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

	create(dto: CreatePurchasingTransactionDto): Observable<PurchasingTransactionViewDto> {
		return this.http.post<PurchasingTransactionViewDto>(this.apiBase, dto).pipe(timeout(7000));
	}

	getTableRows(skip = 0, take = 500): Observable<PurchasingTransactionTableRowDto[]> {
		return defer(() => {
			const startedAt = performance.now();
			console.log(`[Purchasing] GET /table started (skip=${skip}, take=${take})`);

			return this.http
				.get<unknown>(`${this.apiBase}/table?skip=${skip}&take=${take}`)
				.pipe(
					timeout(15000),
					retry({ count: 1, delay: 800 }),
					map(response => this.unwrapArray<PurchasingTransactionTableRowDto>(response)),
					tap({
						next: rows => {
							const elapsedMs = Math.round(performance.now() - startedAt);
							console.log(
								`[Purchasing] GET /table finished in ${elapsedMs} ms (rows=${rows.length}, skip=${skip}, take=${take})`
							);
						},
						error: () => {
							const elapsedMs = Math.round(performance.now() - startedAt);
							console.log(`[Purchasing] GET /table failed after ${elapsedMs} ms (skip=${skip}, take=${take})`);
						}
					})
				);
		});
	}

	getById(id: string): Observable<PurchasingTransactionViewDto> {
		return this.http.get<PurchasingTransactionViewDto>(`${this.apiBase}/${id}`).pipe(timeout(7000));
	}

	update(id: string, dto: UpdatePurchasingTransactionDto): Observable<PurchasingTransactionViewDto> {
		return this.http.put<PurchasingTransactionViewDto>(`${this.apiBase}/${id}`, dto).pipe(timeout(7000));
	}

	delete(id: string): Observable<void> {
		return this.http.delete<void>(`${this.apiBase}/${id}`).pipe(timeout(7000));
	}

}
