import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'auth-login-page',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export  class LoginPageComponent {

}
