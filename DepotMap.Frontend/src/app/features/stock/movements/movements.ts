import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import {
  CreateMovementTransactionItemDto,
  CreateMovementTransactionDto,
  MovementTransactionTableRowDto,
  MovementTransactionViewDto,
  MovementsService
} from '../../../core/services/movements-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';

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

@Component({
  selector: 'app-movements',
  standalone: false,
  templateUrl: './movements.html',
  styleUrl: './movements.scss'
})
export class MovementsComponent implements OnInit {
  private readonly seedUserId = 'seed-admin-001';
  private readonly pageSize = 100;
  private currentSkip = 0;

  saving = false;
  loading = false;
  hasMore = true;
  productsLoading = false;
  errorText = '';
  successText = '';
  editingTransactionId: string | null = null;

  transactions$ = new BehaviorSubject<MovementTableTransaction[]>([]);
  availableProducts: ProductShortDto[] = [];
  compartmentOptions: string[] = ['COMP-1', 'COMP-2'];

  form = {
    createdByUserId: this.seedUserId,
    status: 'Planning',
    items: [this.createEmptyItem()] as MovementFormItem[]
  };

  constructor(
    private movementsService: MovementsService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadAvailableProducts();
    this.loadTransactions(true);
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
      this.currentSkip = 0;
      this.transactions$.next([]);
      this.hasMore = true;
    }

    if (!this.hasMore) {
      return;
    }

    this.loading = true;
    this.errorText = '';

    this.movementsService
      .getTableRows(this.currentSkip, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => {
          const mapped = this.mapTableRowsToTransactions(rows);

          if (reset) {
            this.transactions$.next(mapped);
          } else {
            const merged = this.mergeTransactions(this.transactions$.value, mapped);
            this.transactions$.next(merged);
          }

          this.currentSkip += rows.length;
          this.hasMore = rows.length === this.pageSize;
        },
        error: (err: unknown) => {
          if (reset) {
            this.transactions$.next([]);
          }

          this.hasMore = false;
          this.errorText = this.extractErrorMessage(err, 'A mozgatások betöltése sikertelen volt.');
        }
      });
  }

  loadMoreTransactions(): void {
    this.loadTransactions(false);
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

  private mergeTransactions(
    currentTransactions: MovementTableTransaction[],
    incoming: MovementTableTransaction[]
  ): MovementTableTransaction[] {
    const byId = new Map<string, MovementTableTransaction>();

    for (const existing of currentTransactions) {
      byId.set(existing.id, {
        ...existing,
        items: [...existing.items]
      });
    }

    for (const tx of incoming) {
      const existing = byId.get(tx.id);

      if (existing) {
        existing.items.push(...tx.items);
        existing.status = tx.status;
        existing.statusLabel = tx.statusLabel;
        existing.isClosed = tx.isClosed;
        existing.isDeleteBlocked = tx.isDeleteBlocked;
        existing.createdByUserId = tx.createdByUserId;
        existing.timestamp = tx.timestamp;
      } else {
        byId.set(tx.id, tx);
      }
    }

    return Array.from(byId.values());
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
      return 'Összekészítés alatt';
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
