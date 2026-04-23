import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { UserAdminDto } from '../models/dtos/admin/user-admin-dto';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserCreateDto } from '../models/dtos/admin/user-create-dto';
import { UserUpdateDto } from '../models/dtos/admin/user-update-dto';
import { UserQueryParameters } from '../models/dtos/admin/user-query-parameters';

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  private url = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) { }

  getUsers(params?: UserQueryParameters): Observable<UserAdminDto[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params?.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);

    return this.http.get<UserAdminDto[]>(this.url, { params: httpParams });
  }


  createUser(dto: UserCreateDto): Observable<UserAdminDto> {
    return this.http.post<UserAdminDto>(this.url, dto);
  }

  updateUser(id: string, dto: UserUpdateDto): Observable<UserAdminDto> {
    return this.http.put<UserAdminDto>(`${this.url}/${id}`, dto);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
