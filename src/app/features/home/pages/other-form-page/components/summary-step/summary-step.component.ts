import { Component, inject, OnInit } from '@angular/core';
import { FormStateService } from '../../services/form-state.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormData, PersonalInfo } from '../../models/form-state';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-summary-step',
  standalone: true,
  imports: [MatButtonModule, CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './summary-step.component.html',
  styleUrls: ['./summary-step.component.scss']

})
export class SummaryStepComponent implements OnInit {
  private service = inject(FormStateService);
  protected data = this.service.data;
  protected canAdvance = this.service.canAdvance;

  //PAGINACION
  currentPage = 1;
  pageSize = 3;
  totalFiles = 0;

  /*

  form = new FormGroup({
    confirmed: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    })
  });
*/
  ngOnInit() {
    /*
    const savedConfirmed = this.service.data().confirmed;
    this.form.patchValue(
      { confirmed: savedConfirmed === true },
      { emitEvent: false }
    );

    this.form.controls.confirmed.valueChanges.subscribe(value => {
      this.service.confirm(value);
      console.log('summary: ', value);
    });
*/
    // Calcular total de archivos (principal + anexos)
    this.totalFiles =
      (this.data().files?.anexos?.length || 0) +
      (this.data().files?.documentoPrincipal ? 1 : 0);
  }

  // Devuelve los archivos de la página actual
  get paginatedFiles() {
    let allFiles: { type: string; name: string; size: number }[] = [];

    const files = this.data().files;

    if (files?.documentoPrincipal) {
      allFiles.push({
        type: 'Principal',
        name: files.documentoPrincipal.name,
        size: files.documentoPrincipal.size
      });
    }

    if (files?.anexos?.length) {
      allFiles.push(
        ...files.anexos.map(f => ({
          type: 'Anexo',
          name: f.name,
          size: f.size
        }))
      );
    }

    const start = (this.currentPage - 1) * this.pageSize;
    return allFiles.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  goToStep(stepIndex: number) {
    this.service.editStep(stepIndex); // Cambia el paso en el servicio
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

}
