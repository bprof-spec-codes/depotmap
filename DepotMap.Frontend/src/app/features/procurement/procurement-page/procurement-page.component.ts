import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import {
  CreatePurchasingTransactionDto,
  CreatePurchasingTransactionItemDto,
  PurchasingTransactionTableRowDto,
  PurchasingTransactionViewDto,
  PurchasingTransactionsService
} from '../../../core/services/purchasing-transactions-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';

interface ProcurementFormItem {
  productId: string;
  quantity: number | null;
  toCompartmentId: string;
}

interface ProcurementTableItem {
  productId: string;
  quantity: number;
}

interface ProcurementTableTransaction {
  id: string;
  status: string;
  statusLabel: string;
  isClosed: boolean;
  createdByUserId: string;
  timestamp: string;
  items: ProcurementTableItem[];
}

@Component({
  selector: 'app-procurement-page',
  standalone: false,
  templateUrl: './procurement-page.component.html',
  styleUrls: ['./procurement-page.component.scss']
})
export class ProcurementPageComponent implements OnInit {
  private readonly seedUserId = 'seed-admin-001';
  private readonly pageSize = 100;
  private readonly firstLoadRetryDelayMs = 1000;
  private readonly maxInitialLoadRetries = 1;
  private currentSkip = 0;
  private initialLoadRetryCount = 0;

  saving = false;
  loading = false;
  hasMore = true;
  errorText = '';
  //async pipe 
  transactions$ = new BehaviorSubject<ProcurementTableTransaction[]>([]);
  availableProducts: ProductShortDto[] = [];
  productsLoading = false;
  editingTransactionId: string | null = null;

  form = {
    createdByUserId: this.seedUserId,
    status: 'Planning',
    items: [this.createEmptyItem()] as ProcurementFormItem[]
  };

  constructor(
    private purchasingService: PurchasingTransactionsService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // oldal indulaskor termeklista + elso tabla lekeres
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

  private createEmptyItem(): ProcurementFormItem {
    return {
      productId: '',
      quantity: 1,
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

  resetToCreateMode(): void {
    this.editingTransactionId = null;
    this.errorText = '';
    this.form = {
      createdByUserId: this.seedUserId,
      status: 'Planning',
      items: [this.createEmptyItem()]
    };
  }

  submit(): void {
    this.errorText = '';

    if (!this.form.createdByUserId.trim()) {
      this.errorText = 'A felhasználó azonosító kötelező.';
      return;
    }

    const itemsCheck = this.buildItemsPayload();
    if (!itemsCheck.ok) {
      this.errorText = itemsCheck.error;
      return;
    }

    this.saving = true;

    if (this.isEditing() && this.editingTransactionId) {
      this.purchasingService
        .update(this.editingTransactionId, {
          status: this.form.status,
          items: itemsCheck.items
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.resetToCreateMode();
            this.loadTransactions(true);
          },
          error: (err: unknown) => {
            this.errorText = this.extractErrorMessage(err, 'A mentés sikertelen volt.');
          }
        });

      return;
    }

    const createDto: CreatePurchasingTransactionDto = {
      createdByUserId: this.form.createdByUserId,
      items: itemsCheck.items
    };

    this.purchasingService
      .create(createDto)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.resetToCreateMode();
          this.loadTransactions(true);
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A létrehozás sikertelen volt.');
        }
      });
  }

  isEditing(): boolean {
    return this.editingTransactionId !== null;
  }

  loadTransactions(reset = true, fromAutoRetry = false): void {
    // egyszerre csak 1 lekeres menjen
    if (this.loading) {
      return;
    }

    if (reset) {
      if (!fromAutoRetry) {
        this.initialLoadRetryCount = 0;
      }

      this.currentSkip = 0;
      this.transactions$.next([]);
      this.hasMore = true;
    }

    if (!this.hasMore) {
      return;
    }

    this.loading = true;
    this.errorText = '';

    this.purchasingService
      .getTableRows(this.currentSkip, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => {
          const mapStart = performance.now();
          const mapped = this.mapTableRowsToTransactions(rows);

          if (reset) {
            this.transactions$.next(mapped);
            this.initialLoadRetryCount = 0;
          } else {
            const merged = this.mergeTransactions(this.transactions$.value, mapped);
            this.transactions$.next(merged);
          }

          this.currentSkip += rows.length;
          this.hasMore = rows.length === this.pageSize;

          const elapsedMs = Math.round(performance.now() - mapStart);
          console.log(
            `[Procurement] Table mapped in ${elapsedMs} ms (apiRows=${rows.length}, transactions=${this.transactions$.value.length})`
          );
          console.log('[Procurement] First transaction preview:', this.transactions$.value[0]);
        },
        error: (err: unknown) => {
          if (reset && this.initialLoadRetryCount < this.maxInitialLoadRetries) {
            this.initialLoadRetryCount += 1;
            setTimeout(() => this.loadTransactions(true, true), this.firstLoadRetryDelayMs);
            return;
          }

          if (reset) {
            this.transactions$.next([]);
          }

          this.hasMore = false;
          this.errorText = this.extractErrorMessage(err, 'A beszerzések betöltése sikertelen volt.');
        }
      });
  }

  loadMoreTransactions(): void {
    this.loadTransactions(false);
  }

  trackByTransactionId(index: number, transaction: ProcurementTableTransaction): string {
    return transaction.id || `tx-${index}`;
  }

  trackByItemRow(index: number, item: ProcurementTableItem): string {
    return `${item.productId}_${index}`;
  }

  trackByProductId(_: number, product: ProductShortDto): string {
    return product.id;
  }

  editTransaction(transaction: ProcurementTableTransaction): void {
    if (transaction.isClosed) {
      return;
    }

    this.errorText = '';
    this.saving = true;

    this.purchasingService
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

  deleteTransaction(transaction: ProcurementTableTransaction): void {
    if (transaction.isClosed) {
      return;
    }

    const shouldDelete = confirm(`Biztosan törlöd ezt a beszerzést? (${transaction.id})`);
    if (!shouldDelete) {
      return;
    }

    this.errorText = '';
    this.saving = true;

    this.purchasingService
      .delete(transaction.id)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          if (this.editingTransactionId === transaction.id) {
            this.resetToCreateMode();
          }

          this.loadTransactions(true);
        },
        error: (err: unknown) => {
          this.errorText = this.extractErrorMessage(err, 'A törlés sikertelen volt.');
        }
      });
  }

  private mergeTransactions(
    currentTransactions: ProcurementTableTransaction[],
    incoming: ProcurementTableTransaction[]
  ): ProcurementTableTransaction[] {
    const byId = new Map<string, ProcurementTableTransaction>();

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
        existing.createdByUserId = tx.createdByUserId;
        existing.timestamp = tx.timestamp;
      } else {
        byId.set(tx.id, tx);
      }
    }

    return Array.from(byId.values());
  }

  private mapTableRowsToTransactions(rows: PurchasingTransactionTableRowDto[]): ProcurementTableTransaction[] {
    const mapById = new Map<string, ProcurementTableTransaction>();

    // itt direkt kezeljuk a camelCase + PascalCase valaszokat is
    for (const row of rows as unknown[]) {
      const rowData = row as Record<string, unknown>;

      const transactionId = this.getStringField(rowData, 'transactionId', 'TransactionId');
      const status = this.getStringField(rowData, 'status', 'Status') || 'Planning';
      const createdByUserId = this.getStringField(rowData, 'createdByUserId', 'CreatedByUserId');
      const timestamp = this.getStringField(rowData, 'timestamp', 'Timestamp');
      const productId = this.getStringField(rowData, 'productId', 'ProductId');
      const quantity = this.getNumberField(rowData, 'quantity', 'Quantity');

      const key = transactionId || `missing-id-${productId}-${timestamp}`;
      const existing = mapById.get(key);

      if (existing) {
        existing.items.push({
          productId,
          quantity
        });
        continue;
      }

      mapById.set(key, {
        id: transactionId,
        status,
        statusLabel: this.getStatusLabel(status),
        isClosed: this.isStatusClosed(status),
        createdByUserId,
        timestamp,
        items: [
          {
            productId,
            quantity
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

  private fillFormFromTransaction(transaction: PurchasingTransactionViewDto): void {
    const items = transaction.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
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

  private buildItemsPayload(): { ok: true; items: CreatePurchasingTransactionItemDto[] } | { ok: false; error: string } {
    const rows = this.form.items;
    // ha tenyleg semmi nincs beirva, akkor kuldunk ures listat
    const hasAnyFilledRow = rows.some(r =>
      r.productId.trim() !== '' || r.toCompartmentId.trim() !== '' || r.quantity !== null
    );

    if (!hasAnyFilledRow) {
      return { ok: true, items: [] };
    }

    const items: CreatePurchasingTransactionItemDto[] = [];

    for (const row of rows) {
      const productId = row.productId.trim();
      const toCompartmentId = row.toCompartmentId.trim();
      const quantity = row.quantity;

      const rowEmpty = productId === '' && toCompartmentId === '' && quantity === null;
      if (rowEmpty) {
        continue;
      }

      if (productId === '' || toCompartmentId === '' || quantity === null) {
        return { ok: false, error: 'Minden kitöltött tételsorban add meg a cikkszámot, darabszámot és rekeszt.' };
      }

      if (quantity < 1) {
        return { ok: false, error: 'A darabszám legalább 1 kell legyen.' };
      }

      items.push({ productId, quantity, toCompartmentId });
    }

    return { ok: true, items };
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } } | null;
    const message = maybeError?.error?.message;
    return message && message.trim() ? message : fallback;
  }
}
