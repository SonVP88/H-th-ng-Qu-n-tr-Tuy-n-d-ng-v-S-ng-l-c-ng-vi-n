import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostJob } from './post-job';

describe('PostJob', () => {
  let component: PostJob;
  let fixture: ComponentFixture<PostJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostJob);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
