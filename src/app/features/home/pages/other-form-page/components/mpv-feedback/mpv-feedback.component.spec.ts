import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpvFeedbackComponent } from './mpv-feedback.component';

describe('MpvFeedbackComponent', () => {
  let component: MpvFeedbackComponent;
  let fixture: ComponentFixture<MpvFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpvFeedbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MpvFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
