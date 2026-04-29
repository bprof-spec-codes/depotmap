import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-service';
import {
	CreatePurchasingTransactionDto,
	CreatePurchasingTransactionItemDto,
	PurchasingTransactionTableFilters,
	PurchasingTransactionTableRowDto,
	PurchasingTransactionViewDto,
	PurchasingTransactionsService
} from '../../../core/services/purchasing-transactions-service';
import { ProductService, ProductShortDto } from '../../../core/services/product-service';
import { CompartmentOptionDto, CompartmentService } from '../../../core/services/compartment-service';
import { ProcurementFormItem, ProcurementSortColumn, ProcurementTableItem, ProcurementTableTransaction } from '../../../core/models/procurements.models';


@Component({
	selector: 'app-procurement-page',
	standalone: false,
	templateUrl: './procurement-page.component.html',
	styleUrls: ['./procurement-page.component.scss']
})
export class ProcurementPageComponent implements OnInit {
	private readonly seedUserId = 'seed-admin-001';
	private readonly pageSize = 500;
	private readonly firstLoadRetryDelayMs = 1000;
	private readonly maxInitialLoadRetries = 1;
	private initialLoadRetryCount = 0;
	readonly tablePageSizeOptions = [10, 50, 100, 500];
	compartments: CompartmentOptionDto[] = [];
	compartmentsLoading = false;
	tablePageSize = 100;
	currentPage = 1;
	sortColumn: ProcurementSortColumn | null = 'timestamp';
	sortDirection: 'desc' | 'asc' = 'desc';

	saving = false;
	loading = false;
	errorText = '';
	//async pipe 
	transactions$ = new BehaviorSubject<ProcurementTableTransaction[]>([]);
	availableProducts: ProductShortDto[] = [];
	productsLoading = false;
	editingTransactionId: string | null = null;
	statusUpdatingId: string | null = null;
	userRole: string | null = null;
	searchTerm = '';
	tableFilters = {
		date: '',
		status: '',
		createdByUserId: '',
		productId: '',
		toCompartmentId: '',
		quantity: null as number | null
	};

	form = {
		createdByUserId: this.seedUserId,
		status: 'Planning',
		items: [this.createEmptyItem()] as ProcurementFormItem[]
	};

	constructor(
		private purchasingService: PurchasingTransactionsService,
		private productService: ProductService,
		private compartmentService: CompartmentService,
		private authService: AuthService
	) { }

	ngOnInit(): void {
		this.userRole = this.authService.getRole();
		// oldal indulaskor termeklista + elso tabla lekeres
		this.loadCompartments();
		this.loadAvailableProducts();
		this.loadTransactions(true);
	}

	canManagePurchasing(): boolean {
		return this.userRole === 'Manager' || this.userRole === 'Officer';
	}

	private loadCompartments(): void {
		this.compartmentsLoading = true;
		this.compartmentService.getAll().subscribe({
			next: data => { this.compartments = data; this.compartmentsLoading = false; },
			error: () => { this.compartmentsLoading = false; }
		});
	}

	onSearchChange(value: string): void {
		this.searchTerm = value ?? '';
		this.currentPage = 1;
		this.ensureCurrentPageInRange();
	}

	clearSearch(): void {
		this.onSearchChange('');
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

		// Létrehozáskor a státusz mindig Planning maradjon.
		this.form.status = 'Planning';

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

	get pagedTransactions(): ProcurementTableTransaction[] {
		const start = (this.currentPage - 1) * this.tablePageSize;
		const sorted = this.getSortedTransactions(this.filteredTransactions);
		return sorted.slice(start, start + this.tablePageSize);
	}

	get filteredTransactions(): ProcurementTableTransaction[] {
		const query = this.searchTerm.trim().toLowerCase();
		const sorted = this.getSortedTransactions(this.transactions$.value);

		if (!query) {
			return sorted;
		}

		return sorted
			.map(transaction => ({
				...transaction,
				items: transaction.items.filter(item => this.matchesSearch(transaction, item, query))
			}))
			.filter(transaction => transaction.items.length > 0);
	}

	toggleSort(column: ProcurementSortColumn): void {
		if (this.sortColumn !== column) {
			this.sortColumn = column;
			this.sortDirection = 'desc';
			return;
		}

		this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
	}

	getSortIndicator(column: ProcurementSortColumn): string {
		if (this.sortColumn !== column) {
			return '';
		}

		return this.sortDirection === 'desc' ? '↓' : '↑';
	}

	get totalPages(): number {
		const total = this.filteredTransactions.length;
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
			toCompartmentId: '',
			quantity: null
		};

		this.currentPage = 1;
		this.loadTransactions(true);
	}

	private buildTableFilters(): PurchasingTransactionTableFilters {
		const quantity = this.tableFilters.quantity;
		return {
			date: this.tableFilters.date.trim() || undefined,
			status: this.tableFilters.status.trim() || undefined,
			createdByUserId: this.tableFilters.createdByUserId.trim() || undefined,
			productId: this.tableFilters.productId.trim() || undefined,
			toCompartmentId: this.tableFilters.toCompartmentId.trim() || undefined,
			quantity: typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : undefined
		};
	}

	private matchesSearch(transaction: ProcurementTableTransaction, item: ProcurementTableItem, query: string): boolean {
		const timestamp = new Date(transaction.timestamp);
		const isoDate = Number.isNaN(timestamp.getTime())
			? ''
			: `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}`;
		const formattedDateTime = Number.isNaN(timestamp.getTime())
			? ''
			: `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}. ${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;
		const yearOnly = Number.isNaN(timestamp.getTime()) ? '' : String(timestamp.getFullYear());

		const haystack = [
			transaction.timestamp,
			timestamp.toLocaleString('hu-HU'),
			isoDate,
			formattedDateTime,
			yearOnly,
			transaction.status,
			transaction.statusLabel,
			transaction.createdByUserId,
			item.productId,
			this.getProductLabel(item.productId),
			item.toCompartmentId,
			this.getCompartmentCode(item.toCompartmentId),
			String(item.quantity)
		].join(' ').toLowerCase();

		return haystack.includes(query);
	}

	private ensureCurrentPageInRange(): void {
		if (this.currentPage > this.totalPages) {
			this.currentPage = this.totalPages;
		}

		if (this.currentPage < 1) {
			this.currentPage = 1;
		}
	}

	private getSortedTransactions(items: ProcurementTableTransaction[]): ProcurementTableTransaction[] {
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

	private getSortValue(transaction: ProcurementTableTransaction, column: ProcurementSortColumn): string | number {
		switch (column) {
			case 'timestamp':
				return new Date(transaction.timestamp).getTime() || 0;
			case 'status':
				return transaction.status;
			case 'createdByUserId':
				return transaction.createdByUserId;
			case 'productId':
				return transaction.items[0]?.productId ?? '';
			case 'toCompartmentId':
				return transaction.items[0]?.toCompartmentId ?? '';
			case 'quantity':
				return transaction.items[0]?.quantity ?? 0;
			default:
				return '';
		}
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

			this.currentPage = 1;
			this.transactions$.next([]);
		}

		this.loading = true;
		this.errorText = '';

		this.purchasingService
			.getTableRows(0, this.pageSize)
			.pipe(finalize(() => (this.loading = false)))
			.subscribe({
				next: rows => {
					const mapStart = performance.now();
					const mapped = this.mapTableRowsToTransactions(rows);
					this.transactions$.next(mapped);
					this.initialLoadRetryCount = 0;

					this.ensureCurrentPageInRange();

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
						this.ensureCurrentPageInRange();
					}

					this.errorText = this.extractErrorMessage(err, 'A beszerzések betöltése sikertelen volt.');
				}
			});
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

	advanceStatus(transaction: ProcurementTableTransaction): void {
		const nextStatus = this.getNextStatus(transaction.status);
		if (!nextStatus) {
			return;
		}

		this.errorText = '';
		this.statusUpdatingId = transaction.id;

		this.purchasingService
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

	deleteTransaction(transaction: ProcurementTableTransaction): void {
		if (transaction.isDeleteBlocked) {
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
			const toCompartmentId = this.getStringField(rowData, 'toCompartmentId', 'ToCompartmentId');
			const quantity = this.getNumberField(rowData, 'quantity', 'Quantity');

			const key = transactionId || `missing-id-${productId}-${timestamp}`;
			const existing = mapById.get(key);

			if (existing) {
				existing.items.push({
					productId,
					toCompartmentId,
					quantity
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
						toCompartmentId,
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
	getCompartmentCode(compartmentId: string): string {
		const compartment = this.compartments.find(c => c.id === compartmentId);
		return compartment?.code ?? '-';
	}
	getProductLabel(productId: string): string {
		const product = this.availableProducts.find(p => p.id === productId);
		if (!product) return productId; // fallback: ID ha még nem töltött be
		return product.sku ? `${product.sku} - ${product.name}` : product.name;
	}
}
