import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadFilesStepComponent } from './upload-files-step.component';

describe('UploadFilesStepComponent', () => {
  let component: UploadFilesStepComponent;
  let fixture: ComponentFixture<UploadFilesStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFilesStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadFilesStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
