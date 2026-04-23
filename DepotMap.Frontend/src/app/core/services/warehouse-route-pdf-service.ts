import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { take } from 'rxjs/operators';
import { ProfileService } from './profile-service';

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
  constructor(private profileService: ProfileService) {}

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

  private buildPdf(
    orderId: string,
    route: RouteStep[],
    warehouseName: string,
    operatorName: string
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
    addPageIfNeeded(24);

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