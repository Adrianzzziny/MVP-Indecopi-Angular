import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/layout/header/header.component';
import { FooterComponent } from '../../../../shared/layout/footer/footer.component';


@Component({
    selector: 'app-layout-page',
    standalone: true,
    imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
    templateUrl: './layout-page.component.html',
    styleUrls: ['./layout-page.component.scss']
})
export class LayoutPageComponent { }
