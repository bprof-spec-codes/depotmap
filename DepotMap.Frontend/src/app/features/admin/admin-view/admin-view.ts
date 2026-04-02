import { ChangeDetectorRef, Component } from '@angular/core';
import { UserAdminDto } from '../../../core/models/dtos/admin/user-admin-dto';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserAdminService } from '../../../core/services/user-admin-service';

@Component({
  selector: 'app-admin-view',
  standalone: false,
  templateUrl: './admin-view.html',
  styleUrl: './admin-view.scss',
})
export class AdminView {
  users: UserAdminDto[] = [];
  selectedUser: UserAdminDto | null = null;
  isEditMode = false;
  showModal = false;
  errorMessage = '';

  roles = ['Szuperadmin', 'Admin', 'Raktáros', 'Beszerző'];

  userForm = new FormGroup({
    identifier: new FormControl('', Validators.required),
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    password: new FormControl(''),
    role: new FormControl('Raktáros', Validators.required),
    position: new FormControl('', Validators.required)
  });

  constructor(
    private userAdminService: UserAdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userAdminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.cdr.detectChanges();
      },
      error: () => this.errorMessage = 'Hiba a felhasználók betöltésekor'
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUser = null;
    this.errorMessage = '';

    this.userForm.reset({
      identifier: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'Raktáros',
      position: ''
    });

    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
    this.showModal = true;
  }

  openEditModal(user: UserAdminDto): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.errorMessage = '';

    const nameParts = user.fullName?.split(' ') ?? [];

    this.userForm.reset({
      identifier: user.identifier ?? '',
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' ') ?? '',
      password: '',
      role: user.role ?? 'Raktáros',
      position: user.position ?? ''
    });

    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
    this.showModal = true;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    const val = this.userForm.getRawValue();

    if (this.isEditMode && this.selectedUser) {
      this.userAdminService.updateUser(this.selectedUser.id, {
        identifier: val.identifier ?? undefined,
        firstName: val.firstName ?? undefined,
        lastName: val.lastName ?? undefined,
        password: val.password || undefined,
        role: val.role ?? undefined,
        position: val.position ?? undefined
      }).subscribe({
        next: () => {
          this.showModal = false;
          this.loadUsers();
        },
        error: () => this.errorMessage = 'Hiba a frissítéskor'
      });
    } else {
      this.userAdminService.createUser({
        identifier: val.identifier ?? '',
        firstName: val.firstName ?? '',
        lastName: val.lastName ?? '',
        password: val.password ?? '',
        role: val.role ?? 'Raktáros',
        position: val.position ?? ''
      }).subscribe({
        next: () => {
          this.showModal = false;
          this.loadUsers();
        },
        error: () => this.errorMessage = 'Hiba a létrehozáskor'
      });
    }
  }

  deleteUser(id: string): void {
    if (!confirm('Biztosan törli ezt a felhasználót?')) return;

    this.userAdminService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage = 'Hiba a törléskor'
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.isEditMode = false;
    this.errorMessage = '';

    this.userForm.reset({
      identifier: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'Raktáros',
      position: ''
    });

    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      'Admin': 'badge-admin',
      'Szuperadmin': 'badge-super',
      'Raktáros': 'badge-raktaros',
      'Beszerző': 'badge-beszerzo',
    };

    return map[role];
  }
}