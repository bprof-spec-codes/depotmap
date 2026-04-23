import { TestBed } from '@angular/core/testing';

import { WarehouseRoutePdfService } from './warehouse-route-pdf-service';

describe('WarehouseRoutePdfService', () => {
  let service: WarehouseRoutePdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarehouseRoutePdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
