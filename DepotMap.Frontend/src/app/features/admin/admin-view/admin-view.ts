import { ChangeDetectorRef, Component } from '@angular/core';
import { UserAdminDto } from '../../../core/models/dtos/admin/user-admin-dto';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserAdminService } from '../../../core/services/user-admin-service';
import { BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, EMPTY, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-admin-view',
  standalone: false,
  templateUrl: './admin-view.html',
  styleUrl: './admin-view.scss',
})
export class AdminView {
  users$!: Observable<UserAdminDto[]>;
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

  searchTerm$ = new BehaviorSubject<string>('');
  sortBy$ = new BehaviorSubject<string>('fullname');
  sortDirection$ = new BehaviorSubject<'asc' | 'desc'>('asc');

  private refresh$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  constructor(private userAdminService: UserAdminService) { }

  ngOnInit(): void {
    this.users$ = combineLatest([
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()),
      this.sortBy$,
      this.sortDirection$,
      this.refresh$,
    ]).pipe(
      switchMap(([search, sortBy, sortDirection]) =>
        this.userAdminService.getUsers({
          search: search || undefined,
          sortBy,
          sortDirection,
        })
      )
    );
  }

  private refreshUsers(): void {
    this.refresh$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  onSort(column: string): void {
    if (this.sortBy$.value === column) {
      this.sortDirection$.next(this.sortDirection$.value === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy$.next(column);
      this.sortDirection$.next('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy$.value !== column) return '↕';
    return this.sortDirection$.value === 'asc' ? '↑' : '↓';
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
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.errorMessage = '';
    const val = this.userForm.getRawValue();

    const request$ = this.isEditMode && this.selectedUser
      ? this.userAdminService.updateUser(this.selectedUser.id, {
        identifier: val.identifier ?? undefined,
        firstName: val.firstName ?? undefined,
        lastName: val.lastName ?? undefined,
        password: val.password || undefined,
        role: val.role ?? undefined,
        position: val.position ?? undefined,
      })
      : this.userAdminService.createUser({
        identifier: val.identifier ?? '',
        firstName: val.firstName ?? '',
        lastName: val.lastName ?? '',
        password: val.password ?? '',
        role: val.role ?? 'Raktáros',
        position: val.position ?? '',
      });

    request$.pipe(
      tap(() => { this.showModal = false; this.refreshUsers(); }),
      catchError(() => {
        this.errorMessage = this.isEditMode ? 'Hiba a frissítéskor' : 'Hiba a létrehozáskor';
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  deleteUser(id: string): void {
    if (!confirm('Biztosan törli ezt a felhasználót?')) return;

    this.userAdminService.deleteUser(id).pipe(
      tap(() => this.refreshUsers()),
      catchError(() => { this.errorMessage = 'Hiba a törlésnél'; return EMPTY; }),
      takeUntil(this.destroy$)
    ).subscribe();
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