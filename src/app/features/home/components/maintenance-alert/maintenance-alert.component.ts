import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-maintenance-alert',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './maintenance-alert.component.html',
  styleUrls: ['./maintenance-alert.component.scss']
})
export class MaintenanceAlertComponent {}