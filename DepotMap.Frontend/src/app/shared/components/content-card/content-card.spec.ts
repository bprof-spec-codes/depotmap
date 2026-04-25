import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCard } from './content-card';

describe('ContentCard', () => {
  let component: ContentCard;
  let fixture: ComponentFixture<ContentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContentCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
