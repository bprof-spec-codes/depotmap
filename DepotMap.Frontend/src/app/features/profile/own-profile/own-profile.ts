import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NgForm } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile-service';
import { OwnProfileModel } from '../../../models/own-profile.model';
import { ChangePasswordModel } from '../../../models/change-password.model';

@Component({
  selector: 'app-own-profile',
  standalone: false,
  templateUrl: './own-profile.html',
  styleUrl: './own-profile.scss',
})
export class OwnProfile {
  profile$: Observable<OwnProfileModel>;

  currentPassword: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';

  isSaving: boolean = false;
  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor(private profileService: ProfileService) {
    this.profile$ = this.profileService.getOwnProfile();
  }

  changePassword(form: NgForm): void {
    this.feedbackMessage = '';

    if (!this.currentPassword.trim() || !this.newPassword.trim() || !this.confirmNewPassword.trim()) {
      this.feedbackType = 'error';
      this.feedbackMessage = 'Kérlek, tölts ki minden mezőt!';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.feedbackType = 'error';
      this.feedbackMessage = 'Az új jelszó és a megerősítés nem egyezik!';
      return;
    }

    this.isSaving = true;

    const data: ChangePasswordModel = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmNewPassword: this.confirmNewPassword
    };

    this.profileService.changePassword(data).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.feedbackType = 'success';

        this.feedbackMessage =
          res?.message ||
          'A jelszó sikeresen módosítva.';

        form.resetForm();
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
      },
      error: (err) => {
        this.isSaving = false;
        this.feedbackType = 'error';
        this.feedbackMessage = this.getErrorMessage(err);
      }
    });
  }
  private getErrorMessage(err: any): string {
    if (err?.error?.detail) {
      return err.error.detail;
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err?.message) {
      return err.message;
    }

    return 'Hiba történt a jelszó módosítása közben.';
  }
}
