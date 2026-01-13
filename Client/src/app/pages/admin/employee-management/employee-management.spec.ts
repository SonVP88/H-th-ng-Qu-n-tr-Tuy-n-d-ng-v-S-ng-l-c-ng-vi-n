import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeManagement } from './employee-management';

describe('EmployeeManagement', () => {
  let component: EmployeeManagement;
  let fixture: ComponentFixture<EmployeeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
