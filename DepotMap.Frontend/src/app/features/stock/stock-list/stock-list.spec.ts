import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStockListComponent } from './stock-list';

describe('StockList', () => {
  let component: ProductStockListComponent;
  let fixture: ComponentFixture<ProductStockListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductStockListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductStockListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
