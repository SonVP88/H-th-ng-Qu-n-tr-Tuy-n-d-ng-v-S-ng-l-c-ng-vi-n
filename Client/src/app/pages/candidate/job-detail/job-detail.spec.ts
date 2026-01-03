import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDetail } from './job-detail';

describe('JobDetail', () => {
  let component: JobDetail;
  let fixture: ComponentFixture<JobDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
