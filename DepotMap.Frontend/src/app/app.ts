import { Component, OnInit, signal } from '@angular/core';
import { ProductService } from './core/services/product-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('DepotMap.Frontend');

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // indításkor betölti a termékeket (nem blokkolja a bootstrapot)
    this.productService.loadAll().subscribe({
      error: (err) => console.error('Initial products load failed', err)
    });
  }
}
