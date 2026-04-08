// Warehouse
export interface WarehouseListDto {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
}

export interface WarehouseDetailDto {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cells: WarehouseCellDto[];
}

export interface CreateWarehouseDto {
  name: string;
  gridWidth: number;
  gridHeight: number;
}

export interface UpdateWarehouseDto {
  name: string;
  gridWidth: number;
  gridHeight: number;
}

// WarehouseCell
export interface WarehouseCellDto {
  id: string;
  x: number;
  y: number;
  cellType: string;
}

export interface CellDetailDto {
  id: string;
  x: number;
  y: number;
  cellType: string;
  shelves: ShelfListDto[];
}

export interface UpdateCellTypeDto {
  cellType: string;
}

export interface BatchUpdateCellsDto {
  cells: CellUpdateItem[];
}

export interface CellUpdateItem {
  x: number;
  y: number;
  cellType: string;
}

// Shelf
export interface ShelfListDto {
  id: string;
  code: string;
  x: number;
  y: number;
  levels: number;
  accessibleFromBothSides: boolean;
}

export interface ShelfDetailDto {
  id: string;
  code: string;
  x: number;
  y: number;
  levels: number;
  accessibleFromBothSides: boolean;
  ladderRequiredFromLevel: number | null;
  compartments: CompartmentDto[];
}

export interface CreateShelfDto {
  x: number;
  y: number;
  levels: number;
  accessibleFromBothSides: boolean;
  ladderRequiredFromLevel?: number | null;
}

export interface UpdateShelfDto {
  levels: number;
  accessibleFromBothSides: boolean;
  ladderRequiredFromLevel?: number | null;
}

// Compartment
export interface CompartmentDto {
  id: string;
  levelIndex: number;
  slotIndex: number;
  code: string;
  productStocks: ProductStockInfoDto[];
}

export interface ProductStockInfoDto {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}
