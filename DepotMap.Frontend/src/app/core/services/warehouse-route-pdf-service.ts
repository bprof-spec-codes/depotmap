import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { take } from 'rxjs/operators';
import { ProfileService } from './profile-service';
import { PickingRouteMapDto } from './order-service';

export interface RouteStepItem {
  compartmentCode: string;
  productName: string;
  quantity: number;
  levelIndex?: number;
}

export interface RouteStep {
  shelfCode: string;
  items?: RouteStepItem[] | null;
}

@Injectable({ providedIn: 'root' })
export class RoutePdfService {
  constructor(private profileService: ProfileService) { }

  generate(orderId: string, route: RouteStep[], warehouseName = 'Raktár'): void {
    this.profileService.getOwnProfile().pipe(take(1)).subscribe({
      next: profile => {
        const operatorName =
          [profile?.lastName, profile?.firstName].filter(Boolean).join(' ').trim()
          || profile?.identifier
          || 'Ismeretlen operátor';

        this.buildPdf(orderId, route, warehouseName, operatorName);
      },
      error: () => {
        this.buildPdf(orderId, route, warehouseName, 'Ismeretlen operátor');
      }
    });
  }
  generateWithMap(orderId: string, routeMap: PickingRouteMapDto): void {
    const mapImage = this.renderRouteMapImage(routeMap);

    const route = (routeMap.route ?? [])
      .filter(step => step.cellType?.toLowerCase() !== 'entrance')
      .map(step => ({
        shelfCode: step.shelfCode,
        items: step.items ?? null
      }));

    this.profileService.getOwnProfile().pipe(take(1)).subscribe({
      next: profile => {
        const operatorName =
          [profile?.lastName, profile?.firstName].filter(Boolean).join(' ').trim()
          || profile?.identifier
          || 'Ismeretlen operátor';

        this.buildPdf(orderId, route, routeMap.warehouseName || 'Raktár', operatorName, mapImage);
      },
      error: () => {
        this.buildPdf(orderId, route, routeMap.warehouseName || 'Raktár', 'Ismeretlen operátor', mapImage);
      }
    });
  }
  private renderRouteMapImage(routeMap: PickingRouteMapDto): string | null {
    if (!routeMap.cells?.length || !routeMap.gridWidth || !routeMap.gridHeight) {
      return null;
    }

    const cellSize = 42;
    const padding = 28;
    const legendHeight = 42;

    const canvas = document.createElement('canvas');
    canvas.width = routeMap.gridWidth * cellSize + padding * 2;
    canvas.height = routeMap.gridHeight * cellSize + padding * 2 + legendHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(routeMap.warehouseName || 'Raktár', padding, 16);

    const gridTop = padding + 10;

    for (const cell of routeMap.cells) {
      const x = padding + cell.x * cellSize;
      const y = gridTop + cell.y * cellSize;

      ctx.fillStyle = this.getCellFillColor(cell.cellType);
      ctx.fillRect(x, y, cellSize, cellSize);

      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }

    const routePoints = (routeMap.routePath?.length ? routeMap.routePath : routeMap.route ?? [])
      .filter(point => typeof point.x === 'number' && typeof point.y === 'number');

    const stopPoints = (routeMap.route ?? [])
      .filter(point => typeof point.x === 'number' && typeof point.y === 'number');

    const entrancePoint = stopPoints.find(
      point => point.cellType?.toLowerCase() === 'entrance'
    );

    const pickingPoints = stopPoints.filter(
      point => point.cellType?.toLowerCase() !== 'entrance'
    );
    const toCanvasPoint = (point: { x: number; y: number }) => ({
      x: padding + point.x * cellSize + cellSize / 2,
      y: gridTop + point.y * cellSize + cellSize / 2
    });

    const drawConnectorToNearestRoutePoint = (point: { x: number; y: number }) => {
      if (!routePoints.length) {
        return;
      }

      const target = toCanvasPoint(point);

      let nearest = toCanvasPoint(routePoints[0]);
      let nearestDistance = Number.MAX_VALUE;

      routePoints.forEach(routePoint => {
        const source = toCanvasPoint(routePoint);
        const dx = source.x - target.x;
        const dy = source.y - target.y;
        const distance = dx * dx + dy * dy;

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = source;
        }
      });

      ctx.beginPath();
      ctx.moveTo(nearest.x, nearest.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    if (routePoints.length > 1) {
      ctx.beginPath();

      routePoints.forEach((point, index) => {
        const x = padding + point.x * cellSize + cellSize / 2;
        const y = gridTop + point.y * cellSize + cellSize / 2;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    if (entrancePoint) {
      drawConnectorToNearestRoutePoint(entrancePoint);
    }

    pickingPoints.forEach(point => {
      drawConnectorToNearestRoutePoint(point);
    });

    if (entrancePoint) {
      const x = padding + entrancePoint.x * cellSize + cellSize / 2;
      const y = gridTop + entrancePoint.y * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#16a34a';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', x, y);
    }

    pickingPoints.forEach((point, index) => {
      const x = padding + point.x * cellSize + cellSize / 2;
      const y = gridTop + point.y * cellSize + cellSize / 2;
      const isEnd = index === pickingPoints.length - 1;

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = isEnd ? '#dc2626' : '#2563eb';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x, y);
    });

    this.drawRouteMapLegend(ctx, padding, canvas.height - 24);

    return canvas.toDataURL('image/png');
  }
  private getCellFillColor(cellType: string | null | undefined): string {
    switch ((cellType ?? '').toLowerCase()) {
      case 'wall':
        return '#374151';
      case 'shelf_area':
        return '#dbeafe';
      case 'entrance':
        return '#bbf7d0';
      case 'corridor':
        return '#f3f4f6';
      default:
        return '#ffffff';
    }
  }
  private drawRouteMapLegend(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): void {
    const items = [
      { label: 'Folyosó', color: '#f3f4f6' },
      { label: 'Polcterület', color: '#dbeafe' },
      { label: 'Bejárat', color: '#bbf7d0' },
      { label: 'Fal', color: '#374151' },
      { label: 'Útvonal', color: '#2563eb' }
    ];

    let currentX = x;

    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.fillRect(currentX, y - 6, 12, 12);

      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentX, y - 6, 12, 12);

      ctx.fillStyle = '#374151';
      ctx.fillText(item.label, currentX + 16, y);

      currentX += ctx.measureText(item.label).width + 44;
    }
  }

  private buildPdf(
    orderId: string,
    route: RouteStep[],
    warehouseName: string,
    operatorName: string,
    mapImage?: string | null
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const margin = 12;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    const addPageIfNeeded = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - 20) {
        doc.addPage();
        y = margin;

        this.drawPageHeader(doc, margin, y, contentWidth, warehouseName, orderId, operatorName);
        y += 26;

        this.drawTableHeader(doc, margin, y);
        y += 8;
      }
    };

    this.drawPageHeader(doc, margin, y, contentWidth, warehouseName, orderId, operatorName);
    y += 26;

    this.drawTableHeader(doc, margin, y);
    y += 8;

    let rowIndex = 1;

    route.forEach(step => {
      const items = step.items ?? [];

      if (!items.length) {
        addPageIfNeeded(8);

        this.drawRow(doc, margin, y, {
          index: rowIndex++,
          shelfCode: step.shelfCode,
          compartmentCode: '-',
          productName: 'Nincs kiszedendő tétel',
          quantity: 0
        });

        y += 8;
        return;
      }

      items.forEach(item => {
        addPageIfNeeded(8);

        this.drawRow(doc, margin, y, {
          index: rowIndex++,
          shelfCode: step.shelfCode,
          compartmentCode: item.compartmentCode,
          productName: item.productName,
          quantity: item.quantity
        });

        y += 8;
      });
    });

    y += 8;

    if (mapImage) {
      const mapTitleHeight = 8;

      const imageProps = doc.getImageProperties(mapImage);
      const imageRatio = imageProps.height / imageProps.width;

      let imageWidth = contentWidth;
      let imageHeight = imageWidth * imageRatio;

      const maxImageHeight = 115;

      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = imageHeight / imageRatio;
      }

      const imageX = margin + (contentWidth - imageWidth) / 2;
      const totalMapBlockHeight = mapTitleHeight + imageHeight + 8;

      if (y + totalMapBlockHeight > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text('Raktártérkép útvonallal', margin, y);
      y += 6;

      doc.addImage(mapImage, 'PNG', imageX, y, imageWidth, imageHeight);
      y += imageHeight + 8;
    }

    const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`utvonal_${orderId.slice(0, 8)}.pdf`);
  }

  private drawPageHeader(
    doc: jsPDF,
    margin: number,
    y: number,
    contentWidth: number,
    warehouseName: string,
    orderId: string,
    operatorName: string
  ): void {
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Kiszedési útvonal', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Rendelés: #${orderId}`, margin + 4, y + 18);

    doc.text(`Operátor: ${operatorName}`, margin + 90, y + 13);
    doc.text(`Nyomtatva: ${new Date().toLocaleString('hu-HU')}`, margin + 90, y + 18);
  }

  private drawTableHeader(doc: jsPDF, x: number, y: number): void {
    doc.setFillColor(230, 230, 230);
    doc.rect(x, y - 5, 186, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', x + 2, y);
    doc.text('Polc', x + 12, y);
    doc.text('Rekesz', x + 42, y);
    doc.text('Termék', x + 72, y);
    doc.text('Db', x + 155, y);
    doc.text('Kész', x + 170, y);
  }

  private drawRow(
    doc: jsPDF,
    x: number,
    y: number,
    row: {
      index: number;
      shelfCode: string;
      compartmentCode: string;
      productName: string;
      quantity: number;
    }
  ): void {
    doc.setDrawColor(220);
    doc.rect(x, y - 5, 186, 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(String(row.index), x + 2, y);
    doc.text(row.shelfCode || '-', x + 12, y);
    doc.text(row.compartmentCode || '-', x + 42, y);

    const productText = row.productName.length > 42
      ? row.productName.slice(0, 39) + '...'
      : row.productName;

    doc.text(productText, x + 72, y);
    doc.text(`${row.quantity}`, x + 155, y);

    doc.rect(x + 171, y - 4, 4, 4);
  }
}
