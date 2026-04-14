import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
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
  private readonly apiBase = `${environment.apiUrl}/compartments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CompartmentOptionDto[]> {
    return this.http.get<CompartmentOptionDto[]>(this.apiBase).pipe(
      catchError(() => of([]))
    );
  }
}
