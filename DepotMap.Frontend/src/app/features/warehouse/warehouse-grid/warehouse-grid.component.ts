import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Konva from 'konva';
import { WarehouseApiService } from '../../../core/services/warehouse-api-service';
import { CellApiService } from '../../../core/services/cell-api-service';
import {
  WarehouseDetailDto,
  WarehouseCellDto,
  BatchUpdateCellsDto,
  CellUpdateItem
} from '../../../core/models/warehouse.models';

const CELL_SIZE = 50;
const LABEL_OFFSET = 30;
const PADDING = 10;

const CELL_COLORS: Record<string, string> = {
  corridor: '#e0e0e0',
  shelf_area: '#90caf9',
  wall: '#424242',
  entrance: '#a5d6a7',
};
const DEFAULT_COLOR = '#f5f5f5';

const CELL_TYPE_LABELS: Record<string, string> = {
  corridor: 'Folyosó',
  shelf_area: 'Polcterület',
  wall: 'Fal',
  entrance: 'Bejárat',
};

@Component({
  selector: 'app-warehouse-grid',
  standalone: false,
  templateUrl: './warehouse-grid.component.html',
  styleUrls: ['./warehouse-grid.component.scss']
})
export class WarehouseGridComponent implements OnInit, OnDestroy {
  @ViewChild('konvaContainer', { static: true }) konvaContainer!: ElementRef<HTMLDivElement>;

  warehouseName = '';
  warehouseId = '';
  loading = true;
  error = false;

  // Edit mode
  isEditMode = false;
  selectedCellType = 'corridor';
  saving = false;
  modifiedCount = 0;

  // Selected cell info
  selectedCellInfo: { x: number; y: number; cellType: string } | null = null;

  // Success feedback
  saveSuccess = false;

  readonly cellTypes = ['corridor', 'shelf_area', 'wall', 'entrance'];
  readonly cellColors = CELL_COLORS;
  readonly cellTypeLabels = CELL_TYPE_LABELS;

  private stage: Konva.Stage | null = null;
  private gridLayer!: Konva.Layer;
  private tooltipLayer!: Konva.Layer;
  private cellsGroup!: Konva.Group;
  private labelsGroup!: Konva.Group;
  private tooltip!: Konva.Label;

  private cellMap = new Map<string, WarehouseCellDto>();
  private originalCellMap = new Map<string, WarehouseCellDto>();
  private modifiedCells = new Map<string, CellUpdateItem>();
  private detail: WarehouseDetailDto | null = null;
  private stageReady = false;

  private subscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private warehouseApiService: WarehouseApiService,
    private cellApiService: CellApiService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.stage?.destroy();
  }

  // --- Public actions ---

  enterEditMode(): void {
    this.isEditMode = true;
    this.originalCellMap = new Map(this.cellMap);
    this.modifiedCells.clear();
    this.modifiedCount = 0;
    this.selectedCellInfo = null;
  }

  cancelEdit(): void {
    this.cellMap = new Map(this.originalCellMap);
    this.modifiedCells.clear();
    this.modifiedCount = 0;
    this.isEditMode = false;
    if (this.detail) this.drawGrid(this.detail);
  }

  saveEdit(): void {
    if (this.modifiedCells.size === 0) {
      this.isEditMode = false;
      return;
    }

    this.saving = true;
    const dto: BatchUpdateCellsDto = {
      cells: Array.from(this.modifiedCells.values())
    };

    this.cellApiService.batchUpdateCells(this.warehouseId, dto).subscribe({
      next: () => {
        this.saving = false;
        this.isEditMode = false;
        this.saveSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/warehouses']);
        }, 1500);
      },
      error: (err) => {
        console.error('[WarehouseGrid] Batch update failed:', err);
        this.saving = false;
      }
    });
  }

  selectCellType(type: string): void {
    this.selectedCellType = type;
  }

  goBack(): void {
    this.router.navigate(['/warehouses']);
  }

  // --- Private: Stage init ---

  private ensureStage(): boolean {
    if (this.stageReady && this.stage) return true;

    const container = this.konvaContainer?.nativeElement;
    if (!container) {
      console.error('[WarehouseGrid] konvaContainer not available');
      return false;
    }

    // Make sure container is visible and has dimensions
    const width = container.offsetWidth || container.clientWidth || 800;
    const height = container.offsetHeight || container.clientHeight || 600;

    if (this.stage) {
      this.stage.destroy();
    }

    this.stage = new Konva.Stage({
      container,
      width,
      height,
      draggable: true,
    });

    this.gridLayer = new Konva.Layer();
    this.tooltipLayer = new Konva.Layer();

    this.labelsGroup = new Konva.Group();
    this.cellsGroup = new Konva.Group();
    this.gridLayer.add(this.labelsGroup);
    this.gridLayer.add(this.cellsGroup);

    this.stage.add(this.gridLayer);
    this.stage.add(this.tooltipLayer);

    this.initTooltip();
    this.setupZoom();
    this.setupResize(container);

    this.stageReady = true;
    return true;
  }

  private initTooltip(): void {
    this.tooltip = new Konva.Label({ visible: false });
    this.tooltip.add(new Konva.Tag({
      fill: '#333',
      cornerRadius: 4,
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 6,
    }));
    this.tooltip.add(new Konva.Text({
      padding: 6,
      fontSize: 12,
      fill: '#fff',
    }));
    this.tooltipLayer.add(this.tooltip);
  }

  private setupZoom(): void {
    if (!this.stage) return;
    const stage = this.stage;
    const scaleBy = 1.1;
    const minScale = 0.3;
    const maxScale = 3.0;

    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0
        ? Math.min(oldScale * scaleBy, maxScale)
        : Math.max(oldScale / scaleBy, minScale);

      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    });
  }

  private setupResize(container: HTMLElement): void {
    if (!this.stage) return;
    const stage = this.stage;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          stage.width(width);
          stage.height(height);
        }
      }
    });
    this.resizeObserver.observe(container);
  }

  // --- Private: Data loading ---

  private loadData(): void {
    this.subscription = this.route.params.pipe(
      switchMap(params => {
        this.warehouseId = params['id'];
        this.loading = true;
        this.error = false;
        return this.warehouseApiService.getById(this.warehouseId);
      })
    ).subscribe({
      next: (detail) => {
        this.detail = detail;
        this.warehouseName = detail.name;
        this.buildCellMap(detail.cells);
        this.loading = false;
        this.error = false;
        this.cdr.detectChanges(); // Force Angular to update DOM (remove [hidden])

        // Next tick: container is now visible, init Stage and draw
        setTimeout(() => {
          try {
            if (this.ensureStage()) {
              this.drawGrid(detail);
            }
          } catch (err) {
            console.error('[WarehouseGrid] Failed to draw grid:', err);
          }
        });
      },
      error: (err) => {
        console.error('[WarehouseGrid] Failed to load warehouse:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  private buildCellMap(cells: WarehouseCellDto[]): void {
    this.cellMap.clear();
    for (const cell of cells) {
      this.cellMap.set(`${cell.x},${cell.y}`, cell);
    }
  }

  // --- Private: Drawing ---

  private drawGrid(detail: WarehouseDetailDto): void {
    if (!this.cellsGroup || !this.labelsGroup) return;

    this.cellsGroup.destroyChildren();
    this.labelsGroup.destroyChildren();

    // X axis labels (top)
    for (let x = 0; x < detail.gridWidth; x++) {
      this.labelsGroup.add(new Konva.Text({
        x: PADDING + LABEL_OFFSET + x * CELL_SIZE,
        y: PADDING,
        width: CELL_SIZE,
        text: String(x),
        fontSize: 11,
        fill: '#666',
        align: 'center',
      }));
    }

    // Y axis labels (left)
    for (let y = 0; y < detail.gridHeight; y++) {
      this.labelsGroup.add(new Konva.Text({
        x: PADDING,
        y: PADDING + LABEL_OFFSET + y * CELL_SIZE,
        width: LABEL_OFFSET - 4,
        height: CELL_SIZE,
        text: String(y),
        fontSize: 11,
        fill: '#666',
        align: 'right',
        verticalAlign: 'middle',
      }));
    }

    // Cells
    for (let y = 0; y < detail.gridHeight; y++) {
      for (let x = 0; x < detail.gridWidth; x++) {
        const cell = this.cellMap.get(`${x},${y}`);
        const cellType = cell?.cellType ?? 'corridor';
        const color = CELL_COLORS[cellType] ?? DEFAULT_COLOR;

        const rect = new Konva.Rect({
          x: PADDING + LABEL_OFFSET + x * CELL_SIZE,
          y: PADDING + LABEL_OFFSET + y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          fill: color,
          stroke: '#bdbdbd',
          strokeWidth: 1,
        });

        rect.setAttr('gridX', x);
        rect.setAttr('gridY', y);

        this.bindCellEvents(rect, x, y);
        this.cellsGroup.add(rect);
      }
    }

    this.gridLayer.batchDraw();
  }

  // --- Private: Cell events ---

  private bindCellEvents(rect: Konva.Rect, x: number, y: number): void {
    rect.on('mouseenter', () => {
      if (this.stage) this.stage.container().style.cursor = 'pointer';
      const cell = this.cellMap.get(`${x},${y}`);
      const cellType = cell?.cellType ?? 'corridor';

      const tooltipText = this.tooltip.getChildren()[1] as Konva.Text;
      tooltipText.text(`X: ${x}, Y: ${y} — ${CELL_TYPE_LABELS[cellType] ?? cellType}`);

      this.tooltip.position({
        x: rect.x() + CELL_SIZE / 2,
        y: rect.y() - 8,
      });
      this.tooltip.visible(true);
      this.tooltipLayer.batchDraw();

      if (this.isEditMode) {
        rect.stroke('#1565c0');
        rect.strokeWidth(2);
        this.gridLayer.batchDraw();
      }
    });

    rect.on('mouseleave', () => {
      if (this.stage) this.stage.container().style.cursor = 'default';
      this.tooltip.visible(false);
      this.tooltipLayer.batchDraw();

      if (this.isEditMode) {
        rect.stroke('#bdbdbd');
        rect.strokeWidth(1);
        this.gridLayer.batchDraw();
      }
    });

    rect.on('click', () => {
      this.zone.run(() => {
        if (this.isEditMode) {
          this.onCellClickEdit(x, y, rect);
        } else {
          const cell = this.cellMap.get(`${x},${y}`);
          this.selectedCellInfo = {
            x,
            y,
            cellType: cell?.cellType ?? 'corridor'
          };
        }
      });
    });

    // dblclick → cell detail navigation (disabled until F3 CellDetail route exists)
    // rect.on('dblclick', () => {
    //   if (this.isEditMode) return;
    //   const cell = this.cellMap.get(`${x},${y}`);
    //   if (cell?.id) {
    //     this.router.navigate(['/warehouses', this.warehouseId, 'cells', cell.id]);
    //   }
    // });
  }

  private onCellClickEdit(x: number, y: number, rect: Konva.Rect): void {
    const key = `${x},${y}`;
    const currentCell = this.cellMap.get(key);
    if (currentCell && currentCell.cellType === this.selectedCellType) return;

    const updated: WarehouseCellDto = currentCell
      ? { ...currentCell, cellType: this.selectedCellType }
      : { id: '', x, y, cellType: this.selectedCellType };
    this.cellMap.set(key, updated);

    const original = this.originalCellMap.get(key);
    if (original && original.cellType === this.selectedCellType) {
      this.modifiedCells.delete(key);
    } else {
      this.modifiedCells.set(key, { x, y, cellType: this.selectedCellType });
    }
    this.modifiedCount = this.modifiedCells.size;

    rect.fill(CELL_COLORS[this.selectedCellType] ?? DEFAULT_COLOR);
    this.gridLayer.batchDraw();
  }
}
