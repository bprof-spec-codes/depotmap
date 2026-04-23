import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCreate } from './order-create';

describe('OrderCreate', () => {
  let component: OrderCreate;
  let fixture: ComponentFixture<OrderCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
