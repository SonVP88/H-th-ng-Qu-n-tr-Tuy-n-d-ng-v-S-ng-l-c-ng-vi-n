import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageApplications } from './manage-applications';

describe('ManageApplications', () => {
  let component: ManageApplications;
  let fixture: ComponentFixture<ManageApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageApplications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
