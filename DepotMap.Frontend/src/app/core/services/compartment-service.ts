import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, timeout } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface CompartmentOptionDto {
  id: string;
  code: string;
  levelIndex: number;
  slotIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompartmentService {
  private readonly apiBase = `${environment.apiUrl}/compartment`;
  private compartmentsCache$?: Observable<CompartmentOptionDto[]>;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CompartmentOptionDto[]> {
    if (!this.compartmentsCache$) {
      this.compartmentsCache$ = this.http.get<unknown>(this.apiBase).pipe(
      timeout(5000),
      map(response => {
        const rawItems = Array.isArray(response)
          ? response
          : ((response as { $values?: unknown[] } | null)?.$values ?? []);

        const normalized = rawItems
          .map(item => {
            const r = item as Record<string, unknown>;
            const id = (r['id'] ?? r['Id'] ?? '') as string;
            const code = (r['code'] ?? r['Code'] ?? '') as string;
            const levelIndex = Number(r['levelIndex'] ?? r['LevelIndex'] ?? 0);
            const slotIndex = Number(r['slotIndex'] ?? r['SlotIndex'] ?? 0);

            return {
              id,
              code,
              levelIndex,
              slotIndex
            } satisfies CompartmentOptionDto;
          })
          .filter(c => c.id && c.code);

        return normalized.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      }),
      catchError(() => {
        this.compartmentsCache$ = undefined;
        return of([]);
      }),
      shareReplay(1)
      );
    }

    return this.compartmentsCache$;
  }
}
