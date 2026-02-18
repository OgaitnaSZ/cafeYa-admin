import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  formLogin: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onLogin(): void {
    if (this.formLogin.invalid) {
      this.error.set('Por favor completá todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.formLogin.value;

    // TODO: Reemplazar con tu servicio de auth
    // this.authAdminService.login(email, password).subscribe(...)
    
    // Simulación temporal
    setTimeout(() => {
      if (email === 'admin@cafeya.com' && password === '123456') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.error.set('Email o contraseña incorrectos');
        this.loading.set(false);
      }
    }, 1000);
  }
}
