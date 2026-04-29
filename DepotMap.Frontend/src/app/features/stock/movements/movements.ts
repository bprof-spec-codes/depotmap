import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-service';
import {
  CreateMovementTransactionItemDto,
  CreateMovementTransactionDto,
  MovementTransactionTableFilters,
  MovementTransactionTableRowDto,
  MovementTransactionViewDto,
  MovementsService
} from '../../../core/services/movements-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';

interface MovementFormItem {
  productId: string;
  quantity: number | null;
  fromCompartmentId: string;
  toCompartmentId: string;
}

interface MovementTableItem {
  productId: string;
  quantity: number;
  fromCompartmentId: string;
  toCompartmentId: string;
}

interface MovementTableTransaction {
  id: string;
  status: string;
  statusLabel: string;
  isClosed: boolean;
  isDeleteBlocked: boolean;
  createdByUserId: string;
  timestamp: string;
  items: MovementTableItem[];
}

type MovementSortColumn =
  | 'timestamp'
  | 'status'
  | 'createdByUserId'
  | 'productId'
  | 'fromCompartmentId'
  | 'toCompartmentId'
  | 'quantity';

@Component({
  selector: 'app-movements',
  standalone: false,
  templateUrl: './movements.html',
  styleUrl: './movements.scss'
})
export class MovementsComponent implements OnInit {
  private readonly seedUserId = 'seed-admin-001';
  private readonly pageSize = 500;
  readonly tablePageSizeOptions = [10, 50, 100, 500];
  compartmentOptions: CompartmentOptionDto[] = [];
  compartmentsLoading = false;

  tablePageSize = 100;
  currentPage = 1;
  sortColumn: MovementSortColumn | null = null;
  sortDirection: 'desc' | 'asc' = 'desc';

  saving = false;
  loading = false;
  productsLoading = false;
  errorText = '';
  successText = '';
  editingTransactionId: string | null = null;
  statusUpdatingId: string | null = null;
  userRole: string | null = null;

  transactions$ = new BehaviorSubject<MovementTableTransaction[]>([]);
  availableProducts: ProductShortDto[] = [];
  tableFilters = {
    date: '',
    status: '',
    createdByUserId: '',
    productId: '',
    fromCompartmentId: '',
    toCompartmentId: '',
    quantity: null as number | null
  };

  form = {
    createdByUserId: this.seedUserId,
    status: 'Planning',
    items: [this.createEmptyItem()] as MovementFormItem[]
  };

  constructor(
    private movementsService: MovementsService,
    private productService: ProductService,
    private compartmentService: CompartmentService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.loadAvailableProducts();
    this.loadCompartments();
    this.loadTransactions(true);
  }

  canManageMovements(): boolean {
    return this.userRole === 'Manager' || this.userRole === 'Officer';
  }

  private loadCompartments(): void {
    this.compartmentsLoading = true;

    this.compartmentService.getAll()
      .pipe(finalize(() => (this.compartmentsLoading = false)))
      .subscribe(items => {
        this.compartmentOptions = items;
      });
  }
  getAvailableFromCompartments(selectedToCompartmentId: string): CompartmentOptionDto[] {
    return this.compartmentOptions.filter(c => c.id !== selectedToCompartmentId);
  }

  getAvailableToCompartments(selectedFromCompartmentId: string): CompartmentOptionDto[] {
    return this.compartmentOptions.filter(c => c.id !== selectedFromCompartmentId);
  }
  private loadAvailableProducts(): void {
    this.productsLoading = true;

    this.productService
      .loadAll()
      .pipe(finalize(() => (this.productsLoading = false)))
      .subscribe(items => {
        this.availableProducts = items;
      });
  }

  private createEmptyItem(): MovementFormItem {
    return {
      productId: '',
      quantity: 1,
      fromCompartmentId: '',
      toCompartmentId: ''
    };
  }

  addItemRow(): void {
    this.form.items.push(this.createEmptyItem());
  }

  removeItemRow(index: number): void {
    if (this.form.items.length === 1) {
      this.form.items[0] = this.createEmptyItem();
      return;
    }

    this.form.items.splice(index, 1);
  }

  resetForm(): void {
    this.editingTransactionId = null;
    this.errorText = '';
    this.successText = '';
    this.form = {
      createdByUserId: this.seedUserId,
      status: 'Planning',
      items: [this.createEmptyItem()]
    };
  }

  isEditing(): boolean {
    return this.editingTransactionId !== null;
  }

  get pagedTransactions(): MovementTableTransaction[] {
    const start = (this.currentPage - 1) * this.tablePageSize;
    const sorted = this.getSortedTransactions(this.transactions$.value);
    return sorted.slice(start, start + this.tablePageSize);
  }

  toggleSort(column: MovementSortColumn): void {
    if (this.sortColumn !== column) {
      this.sortColumn = column;
      this.sortDirection = 'desc';
      return;
    }

    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
  }

  getSortIndicator(column: MovementSortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }

    return this.sortDirection === 'desc' ? '↓' : '↑';
  }

  get totalPages(): number {
    const total = this.transactions$.value.length;
    return total > 0 ? Math.ceil(total / this.tablePageSize) : 1;
  }

  get canGoPrevPage(): boolean {
    return this.currentPage > 1;
  }

  get canGoNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  onTablePageSizeChange(size: number | string): void {
    const parsed = Number(size);
    if (![10, 50, 100, 500].includes(parsed)) {
      return;
    }

    this.tablePageSize = parsed;
    this.currentPage = 1;
    this.ensureCurrentPageInRange();
  }

  goToPrevPage(): void {
    if (!this.canGoPrevPage) {
      return;
    }

    this.currentPage -= 1;
  }

  goToNextPage(): void {
    if (!this.canGoNextPage) {
      return;
    }

    this.currentPage += 1;
  }

  applyTableFilters(): void {
    this.currentPage = 1;
    this.loadTransactions(true);
  }

  clearTableFilters(): void {
    this.tableFilters = {
      date: '',
      status: '',
      createdByUserId: '',
      productId: '',
      fromCompartmentId: '',
      toCompartmentId: '',
      quantity: null
    };

    this.currentPage = 1;
    this.loadTransactions(true);
  }

  private buildTableFilters(): MovementTransactionTableFilters {
    const quantity = this.tableFilters.quantity;
    return {
      date: this.tableFilters.date.trim() || undefined,
      status: this.tableFilters.status.trim() || undefined,
      createdByUserId: this.tableFilters.createdByUserId.trim() || undefined,
      productId: this.tableFilters.productId.trim() || undefined,
      fromCompartmentId: this.tableFilters.fromCompartmentId.trim() || undefined,
      toCompartmentId: this.tableFilters.toCompartmentId.trim() || undefined,
      quantity: typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : undefined
    };
  }

  private ensureCurrentPageInRange(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private getSortedTransactions(items: MovementTableTransaction[]): MovementTableTransaction[] {
    if (!this.sortColumn) {
      return items;
    }

    const directionFactor = this.sortDirection === 'desc' ? -1 : 1;
    const column = this.sortColumn;

    return [...items].sort((a, b) => {
      const aValue = this.getSortValue(a, column);
      const bValue = this.getSortValue(b, column);

      if (typeof aValue === 'number' || typeof bValue === 'number') {
        return (Number(aValue) - Number(bValue)) * directionFactor;
      }

      return String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: 'base'
      }) * directionFactor;
    });
  }

  private getSortValue(transaction: MovementTableTransaction, column: MovementSortColumn): string | number {
    switch (column) {
      case 'timestamp':
        return new Date(transaction.timestamp).getTime() || 0;
      case 'status':
        return transaction.status;
      case 'createdByUserId':
        return transaction.createdByUserId;
      case 'productId':
        return transaction.items[0]?.productId ?? '';
      case 'fromCompartmentId':
        return transaction.items[0]?.fromCompartmentId ?? '';
      case 'toCompartmentId':
        return transaction.items[0]?.toCompartmentId ?? '';
      case 'quantity':
        return transaction.items[0]?.quantity ?? 0;
      default:
        return '';
    }
  }

  submit(): void {
    this.errorText = '';
    this.successText = '';

    if (!this.form.createdByUserId.trim()) {
      this.errorText = 'A felhasználó azonosító kötelező.';
      return;
    }

    const itemsResult = this.buildItemsPayload();
    if (!itemsResult.ok) {
      this.errorText = itemsResult.error;
      return;
    }

    this.saving = true;

    if (this.isEditing() && this.editingTransactionId) {
      this.movementsService
        .update(this.editingTransactionId, {
          status: this.form.status,
          items: itemsResult.items
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.successText = 'A mozgatás sikeresen mentve.';
            this.resetForm();
            this.loadTransactions(true);
          },
          error: (err: unknown) => {
            this.errorText = this.extractErrorMessage(err, 'A mentés sikertelen volt.');
          }
        });

      return;
    }

    // Létrehozáskor a státusz mindig Planning maradjon.
    this.form.status = 'Planning';

    const dto: CreateMovementTransactionDto = {
      createdByUserId: this.form.createdByUserId,
      items: itemsResult.items
    };

    this.movementsService
      .create(dto)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.successText = 'A mozgatás sikeresen létrejött.';
          this.resetForm();
          this.loadTransactions(true);
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A létrehozás sikertelen volt.');
        }
      });
  }

  trackByProductId(_: number, product: ProductShortDto): string {
    return product.id;
  }

  trackByTransactionId(index: number, transaction: MovementTableTransaction): string {
    return transaction.id || `tx-${index}`;
  }

  trackByItemRow(index: number, item: MovementTableItem): string {
    return `${item.productId}_${item.fromCompartmentId}_${item.toCompartmentId}_${index}`;
  }

  loadTransactions(reset = true): void {
    if (this.loading) {
      return;
    }

    if (reset) {
      this.currentPage = 1;
      this.transactions$.next([]);
    }

    this.loading = true;
    this.errorText = '';

    this.movementsService
      .getTableRows(0, this.pageSize, this.buildTableFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => {
          const mapped = this.mapTableRowsToTransactions(rows);

          this.transactions$.next(mapped);

          this.ensureCurrentPageInRange();
        },
        error: (err: unknown) => {
          if (reset) {
            this.transactions$.next([]);
            this.ensureCurrentPageInRange();
          }

          this.errorText = this.extractErrorMessage(err, 'A mozgatások betöltése sikertelen volt.');
        }
      });
  }

  editTransaction(transaction: MovementTableTransaction): void {
    if (transaction.isClosed) {
      return;
    }

    this.errorText = '';
    this.successText = '';
    this.saving = true;

    this.movementsService
      .getById(transaction.id)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: detail => {
          this.fillFormFromTransaction(detail);
          this.editingTransactionId = transaction.id;
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A szerkesztéshez tartozó adatok nem tölthetők be.');
        }
      });
  }

  advanceStatus(transaction: MovementTableTransaction): void {
    const nextStatus = this.getNextStatus(transaction.status);
    if (!nextStatus) {
      return;
    }

    this.errorText = '';
    this.statusUpdatingId = transaction.id;

    this.movementsService
      .update(transaction.id, { status: nextStatus })
      .pipe(finalize(() => (this.statusUpdatingId = null)))
      .subscribe({
        next: () => {
          this.loadTransactions(true);
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A státusz frissítése sikertelen volt.');
        }
      });
  }

  isStatusArrowVisible(status: string): boolean {
    return this.getNextStatus(status) !== null;
  }

  getStatusClass(status: string): string {
    const value = status.toLowerCase();

    if (value === 'active') {
      return 'status-active';
    }

    if (value === 'closed') {
      return 'status-closed';
    }

    return 'status-planning';
  }

  deleteTransaction(transaction: MovementTableTransaction): void {
    if (transaction.isDeleteBlocked) {
      return;
    }

    const shouldDelete = confirm(`Biztosan törlöd ezt a mozgatást? (${transaction.id})`);
    if (!shouldDelete) {
      return;
    }

    this.errorText = '';
    this.successText = '';
    this.saving = true;

    this.movementsService
      .delete(transaction.id)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          if (this.editingTransactionId === transaction.id) {
            this.resetForm();
          }

          this.successText = 'A mozgatás törölve.';
          this.loadTransactions(true);
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A törlés sikertelen volt.');
        }
      });
  }

  private mapTableRowsToTransactions(rows: MovementTransactionTableRowDto[]): MovementTableTransaction[] {
    const mapById = new Map<string, MovementTableTransaction>();

    for (const row of rows as unknown[]) {
      const rowData = row as Record<string, unknown>;

      const transactionId = this.getStringField(rowData, 'transactionId', 'TransactionId');
      const status = this.getStringField(rowData, 'status', 'Status') || 'Planning';
      const createdByUserId = this.getStringField(rowData, 'createdByUserId', 'CreatedByUserId');
      const timestamp = this.getStringField(rowData, 'timestamp', 'Timestamp');
      const productId = this.getStringField(rowData, 'productId', 'ProductId');
      const quantity = this.getNumberField(rowData, 'quantity', 'Quantity');
      const fromCompartmentId = this.getStringField(rowData, 'fromCompartmentId', 'FromCompartmentId');
      const toCompartmentId = this.getStringField(rowData, 'toCompartmentId', 'ToCompartmentId');

      const key = transactionId || `missing-id-${productId}-${timestamp}`;
      const existing = mapById.get(key);

      if (existing) {
        existing.items.push({
          productId,
          quantity,
          fromCompartmentId,
          toCompartmentId
        });
        continue;
      }

      mapById.set(key, {
        id: transactionId,
        status,
        statusLabel: this.getStatusLabel(status),
        isClosed: this.isStatusClosed(status),
        isDeleteBlocked: this.isDeleteBlockedStatus(status),
        createdByUserId,
        timestamp,
        items: [
          {
            productId,
            quantity,
            fromCompartmentId,
            toCompartmentId
          }
        ]
      });
    }

    return Array.from(mapById.values());
  }

  private getStringField(source: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }

  private getNumberField(source: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
        return Number(value);
      }
    }

    return 0;
  }

  private getStatusLabel(status: string): string {
    if (this.isStatusClosed(status)) {
      return 'Lezárva';
    }

    if (status.toLowerCase() === 'active') {
      return 'Összekészítés';
    }

    return 'Tervezés';
  }

  private isStatusClosed(status: string): boolean {
    return status.toLowerCase() === 'closed';
  }

  private isDeleteBlockedStatus(status: string): boolean {
    const s = status.toLowerCase();
    return s === 'closed' || s === 'active';
  }

  private getNextStatus(status: string): string | null {
    const value = status.toLowerCase();

    if (value === 'planning') {
      return 'Active';
    }

    if (value === 'active') {
      return 'Closed';
    }

    return null;
  }

  private fillFormFromTransaction(transaction: MovementTransactionViewDto): void {
    const items = transaction.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      fromCompartmentId: item.fromCompartmentId,
      toCompartmentId: item.toCompartmentId
    }));

    this.form = {
      createdByUserId: transaction.createdByUserId || this.seedUserId,
      status: this.normalizeStatus(transaction.status),
      items: items.length ? items : [this.createEmptyItem()]
    };
  }

  private normalizeStatus(status: string): string {
    const value = status.toLowerCase();

    if (value === 'closed') {
      return 'Closed';
    }

    if (value === 'active') {
      return 'Active';
    }

    return 'Planning';
  }

  private buildItemsPayload(): { ok: true; items: CreateMovementTransactionItemDto[] } | { ok: false; error: string } {
    const rows = this.form.items;

    const hasAnyFilledRow = rows.some(
      r =>
        r.productId.trim() !== '' ||
        r.fromCompartmentId.trim() !== '' ||
        r.toCompartmentId.trim() !== '' ||
        r.quantity !== null
    );

    if (!hasAnyFilledRow) {
      return { ok: false, error: 'Adj meg legalább egy tételt.' };
    }

    const items: CreateMovementTransactionItemDto[] = [];

    for (const row of rows) {
      const productId = row.productId.trim();
      const fromCompartmentId = row.fromCompartmentId.trim();
      const toCompartmentId = row.toCompartmentId.trim();
      const quantity = row.quantity;

      const rowEmpty = productId === '' && fromCompartmentId === '' && toCompartmentId === '' && quantity === null;
      if (rowEmpty) {
        continue;
      }

      if (productId === '' || fromCompartmentId === '' || toCompartmentId === '' || quantity === null) {
        return {
          ok: false,
          error: 'Minden kitöltött tételsorban add meg a terméket, darabszámot, forrás és cél rekeszt.'
        };
      }

      if (quantity < 1) {
        return { ok: false, error: 'A darabszám legalább 1 kell legyen.' };
      }

      if (fromCompartmentId === toCompartmentId) {
        return { ok: false, error: 'A forrás és cél rekesz nem lehet azonos.' };
      }

      items.push({
        productId,
        quantity,
        fromCompartmentId,
        toCompartmentId
      });
    }

    if (!items.length) {
      return { ok: false, error: 'Adj meg legalább egy tételt.' };
    }

    return { ok: true, items };
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } } | null;
    const message = maybeError?.error?.message;
    return message && message.trim() ? message : fallback;
  }
}
