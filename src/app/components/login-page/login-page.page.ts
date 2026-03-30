import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  IonButton,
  IonHeader,
  IonContent,
  IonToolbar,
  IonInput,
  IonTitle,
  IonItem,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login-page.page.html',
  styleUrls: ['./login-page.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class LoginPagePage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    const { email, password } = this.loginForm.value;

    if (!email || !password) return;

    try {
      await this.authService.login(email, password);
      console.log('Login successful');
    } catch (err) {
      console.error('Login error', err);
    }
  }
}