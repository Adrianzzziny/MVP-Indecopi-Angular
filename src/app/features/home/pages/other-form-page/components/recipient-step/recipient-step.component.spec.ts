import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipientStepComponent } from './recipient-step.component';

describe('RecipientStepComponent', () => {
  let component: RecipientStepComponent;
  let fixture: ComponentFixture<RecipientStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipientStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipientStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
