import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

            return {
              id,
              code,
              levelIndex,
              slotIndex
            } satisfies CompartmentOptionDto;
          })
          .filter(c => c.id.length > 0)
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      })
    );
  }
}
