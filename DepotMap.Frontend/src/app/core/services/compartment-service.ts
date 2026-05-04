import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface CompartmentOptionDto {
  id: string;
  code: string;
  levelIndex: number;
  slotIndex: number;
  productStocks?: CompartmentProductStockDto[];
}

export interface CompartmentProductStockDto {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompartmentService {
  private readonly apiBase = `${environment.apiUrl}/compartment`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CompartmentOptionDto[]> {
    return this.http.get<unknown>(this.apiBase).pipe(
      map(response => {
        const rawItems = Array.isArray(response)
          ? response
          : ((response as { $values?: unknown[] } | null)?.$values ?? []);

        return rawItems
          .map(item => {
            const r = item as Record<string, unknown>;
            const id = String(r['id'] ?? r['Id'] ?? '').trim();
            const code = String(r['code'] ?? r['Code'] ?? '').trim();
            const levelIndex = Number(r['levelIndex'] ?? r['LevelIndex'] ?? 0);
            const slotIndex = Number(r['slotIndex'] ?? r['SlotIndex'] ?? 0);
            const productStocksRaw = r['productStocks'] ?? r['ProductStocks'] ?? [];
            const productStocks = Array.isArray(productStocksRaw)
              ? productStocksRaw
              : ((productStocksRaw as { $values?: unknown[] } | null)?.$values ?? []);

            return {
              id,
              code,
              levelIndex,
              slotIndex,
              productStocks: productStocks
                .map(stock => {
                  const s = stock as Record<string, unknown>;
                  return {
                    productId: String(s['productId'] ?? s['ProductId'] ?? '').trim(),
                    productName: String(s['productName'] ?? s['ProductName'] ?? '').trim(),
                    sku: String(s['sku'] ?? s['SKU'] ?? '').trim(),
                    quantity: Number(s['quantity'] ?? s['Quantity'] ?? 0)
                  } satisfies CompartmentProductStockDto;
                })
                .filter(stock => stock.productId.length > 0)
            } satisfies CompartmentOptionDto;
          })
          .filter(c => c.id.length > 0)
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      })
    );
  }
}
