import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OwnProfileModel } from '../../models/own-profile.model';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth-service';
import { ChangePasswordModel } from '../../models/change-password.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {

  constructor(private http: HttpClient, private authService: AuthService) {}

  getOwnProfile(): Observable<OwnProfileModel> {
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });

    return this.http.get<OwnProfileModel>(environment.apiUrl + '/profile/me', { headers });
  }

  changePassword(data: ChangePasswordModel) {
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });

    return this.http.put(environment.apiUrl + '/profile/updatePassword', data, { headers});
  }
}
