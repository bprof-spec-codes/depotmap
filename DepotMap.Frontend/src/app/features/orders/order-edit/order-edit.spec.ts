import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderEdit } from './order-edit';

describe('OrderEdit', () => {
  let component: OrderEdit;
  let fixture: ComponentFixture<OrderEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
