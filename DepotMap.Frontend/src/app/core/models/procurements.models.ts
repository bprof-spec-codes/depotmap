interface ProcurementFormItem {
	productId: string;
	quantity: number | null;
	toCompartmentId: string;
}

interface ProcurementTableItem {
	productId: string;
	toCompartmentId: string;
	quantity: number;
}

interface ProcurementTableTransaction {
	id: string;
	status: string;
	statusLabel: string;
	isClosed: boolean;
	isDeleteBlocked: boolean;
	createdByUserId: string;
	timestamp: string;
	items: ProcurementTableItem[];
}

type ProcurementSortColumn =
	| 'timestamp'
	| 'status'
	| 'createdByUserId'
	| 'productId'
	| 'toCompartmentId'
	| 'quantity';
