import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnProfile } from './own-profile';

describe('OwnProfile', () => {
  let component: OwnProfile;
  let fixture: ComponentFixture<OwnProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OwnProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
