import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockMovementListComponent } from './stockmovement';

describe('Stockmovement', () => {
  let component: StockMovementListComponent;
  let fixture: ComponentFixture<StockMovementListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockMovementListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockMovementListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
