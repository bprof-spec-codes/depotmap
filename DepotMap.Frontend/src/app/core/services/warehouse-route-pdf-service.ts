import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface RouteStep {
  shelfCode: string;
  items?: {
    compartmentCode: string;
    productName: string;
    quantity: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class RoutePdfService {

  generate(orderId: string, route: RouteStep[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // --- Fejléc ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Kiszedési Útvonal', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Rendelés: #${orderId}`, margin, y);
    doc.text(
      `Nyomtatva: ${new Date().toLocaleString('hu-HU')}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 5;

    doc.setTextColor(0);
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Lépések ---
    route.forEach((step, index) => {
      checkPageBreak(14);

      // Sor fejléc
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${step.shelfCode}`, margin + 2, y + 1);
      y += 8;

      // Tételek
      if (step.items && step.items.length > 0) {
        step.items.forEach(item => {
          checkPageBreak(7);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `  • [${item.compartmentCode}]  ${item.productName}  —  ${item.quantity} db`,
            margin + 4,
            y
          );
          y += 6;
        });
      } else {
        checkPageBreak(7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('  Nincs kiszedendő tétel.', margin + 4, y);
        doc.setTextColor(0);  
        y += 6;
      }

      y += 3; // térköz lépések között
    });

    const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`utvonal_${orderId.slice(0, 8)}.pdf`);
  }
}