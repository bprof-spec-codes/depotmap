import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-login-component',
  standalone: false,
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = "";
  @ViewChild('loginModal') loginModal!: ElementRef;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    const { identifier, password } = this.loginForm.value;

    this.authService.login(identifier, password).subscribe({
      next: () => {
        console.log("Sikeres bejelentkezés!")
        // Majd ha kész lesz valami főoldal:
        //this.router.navigate(['/dashboard']);

        this.closeModal();
      },
      error: () => {
        this.errorMessage = 'Hibás azonosító vagy jelszó.';
        this.cdr.detectChanges();
      }
    });
  }
  private closeModal() {
    const modal = bootstrap.Modal.getInstance(this.loginModal.nativeElement);
    modal?.hide();

    // Ha mégsem záródna megfelően, akkor manuálisan
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelector('.modal-backdrop')?.remove();
  }

}
