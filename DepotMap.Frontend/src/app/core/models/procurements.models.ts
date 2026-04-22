export interface ProcurementFormItem {
	productId: string;
	quantity: number | null;
	toCompartmentId: string;
}

export interface ProcurementTableItem {
	productId: string;
	toCompartmentId: string;
	quantity: number;
}

export interface ProcurementTableTransaction {
	id: string;
	status: string;
	statusLabel: string;
	isClosed: boolean;
	isDeleteBlocked: boolean;
	createdByUserId: string;
	timestamp: string;
	items: ProcurementTableItem[];
}

export type ProcurementSortColumn =
	| 'timestamp'
	| 'status'
	| 'createdByUserId'
	| 'productId'
	| 'toCompartmentId'
	| 'quantity';
