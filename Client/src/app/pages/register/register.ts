import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
registerForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]*$')]], 
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue] 
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { password, confirmPassword } = this.registerForm.value;

      if (password !== confirmPassword) {
        alert('Mật khẩu nhập lại không khớp!');
        return;
      }

      const payload = {
        fullName: this.registerForm.value.fullName,
        email: this.registerForm.value.email,
        phone: this.registerForm.value.phone,
        password: this.registerForm.value.password
      };

      this.http.post('https://localhost:7181/api/auth/register', payload, { responseType: 'text' })
        .subscribe({
          next: () => {
            alert('Đăng ký thành công!');
            this.router.navigate(['/login']);
          },
          error: (err) => {
            alert('Lỗi: ' + (err.error?.message || 'Đăng ký thất bại'));
          }
        });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
