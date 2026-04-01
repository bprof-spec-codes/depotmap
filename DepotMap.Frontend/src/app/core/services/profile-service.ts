import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { OwnProfileModel } from '../../models/own-profile.model';
import { environment } from '../../../environments/environment.development';
import { ChangePasswordModel } from '../../models/change-password.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private ownProfile$?: Observable<OwnProfileModel>;

  constructor(private http: HttpClient) {}

  getOwnProfile(): Observable<OwnProfileModel> {
    if (!this.ownProfile$) {
      this.ownProfile$ = this.http
        .get<OwnProfileModel>(environment.apiUrl + '/profile/me')
        .pipe(shareReplay(1));
    }

    return this.ownProfile$;
  }

  clearOwnProfileCache(): void {
    this.ownProfile$ = undefined;
  }

  changePassword(data: ChangePasswordModel): Observable<string> {
    return this.http.put(
      environment.apiUrl + '/profile/updatePassword',
      data,
      { responseType: 'text' }
    );
  }
}
