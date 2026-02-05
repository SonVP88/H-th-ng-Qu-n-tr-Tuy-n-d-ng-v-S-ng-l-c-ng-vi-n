import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyInterviews } from './my-interviews';

describe('MyInterviews', () => {
  let component: MyInterviews;
  let fixture: ComponentFixture<MyInterviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyInterviews]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyInterviews);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
