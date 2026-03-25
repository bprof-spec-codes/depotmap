import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../../core/services/profile-service';
import { OwnProfileModel } from '../../../models/own-profile.model';

@Component({
  selector: 'app-own-profile',
  standalone: false,
  templateUrl: './own-profile.html',
  styleUrl: './own-profile.scss',
})
export class OwnProfile implements OnInit {

  profile: OwnProfileModel | null = null;

  currentPassword: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';
  message: string = '';
  errorMessage: string = '';

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileService.getOwnProfile().subscribe({
      next: (data) => {
        this.profile = data;
        console.log('PROFILE:', data);
      },
      error: (err) => {
        console.error('Hiba történt:', err);
      }
    });
  }

  changePassword() {
    this.message = '';
    this.errorMessage = '';

    const data = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmNewPassword: this.confirmNewPassword
    };

    this.profileService.changePassword(data).subscribe({
      next: (res) => {
        this.message = 'Password changed successfully!';

        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
      },
      error: (err) => {
        this.errorMessage = err.error;
      }
    });
  }


}
