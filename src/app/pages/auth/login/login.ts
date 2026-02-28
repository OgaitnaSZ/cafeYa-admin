import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { UserLogin } from '../../../core/interfaces/user.model';
import { LucideAngularModule, AtSign, LockKeyhole, Eye, EyeOff, CircleAlert } from 'lucide-angular';
import { NotificacionService } from '../../../core/services/notificacion';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);
  private ns = inject(NotificacionService);

  user = this.auth.user;
  loading = this.auth.loading;
  error = this.auth.error;
  success = this.auth.success;
  showPassword = signal(false);

  formLogin: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onLogin() {
    if (this.formLogin.invalid) return this.ns.error('Faltan datos','Completa los campos requeridos');

    const { email, password } = this.formLogin.getRawValue(); 
    const user: UserLogin = {
      email: email,
      password: password
    };
    this.auth.login(user);
  }

  // Icons
  readonly AtSign = AtSign;
  readonly LockKeyhole = LockKeyhole;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CircleAlert = CircleAlert;
}
