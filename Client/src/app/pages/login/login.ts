import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const payload = this.loginForm.value;

      this.http.post<any>('https://localhost:7181/api/auth/login', payload)
        .subscribe({
          next: (res) => {
            // res.token là chuỗi JWT backend trả về
            const token = res.token; 
            
            // 1. Lưu Token vào bộ nhớ trình duyệt
            localStorage.setItem('authToken', token);

            // 2. Giải mã Token để lấy Role
            try {
              const decodedToken: any = jwtDecode(token);
              // Backend thường lưu Role trong claim tên là "role" hoặc schema dài dòng
              // Ta lấy role ra (check log để xem backend đặt tên key là gì)
              const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];

              console.log('User Role:', role); // Log ra để kiểm tra

              // 3. Điều hướng dựa trên Role
              if (role === 'HR' || role === 'ADMIN') {
                this.router.navigate(['/hr/dashboard']); // Vào trang quản trị
              } else {
                this.router.navigate(['/candidate/home']); // Vào trang chủ tìm việc
              }

            } catch (error) {
              console.error('Lỗi giải mã token:', error);
              // Nếu lỗi thì cứ cho về trang chủ
              this.router.navigate(['/']);
            }
          },
          error: (err) => {
            console.error(err);
            alert('Đăng nhập thất bại! Kiểm tra lại email hoặc mật khẩu.');
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}