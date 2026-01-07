import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

      this.http.post<any>('/api/auth/login', payload)
        .subscribe({
          next: (res) => {
            // res.token là chuỗi JWT backend trả về
            const token = res.token;

            if (!token) {
              console.error('❌ Backend không trả về token!');
              alert('Đăng nhập thất bại! Server không trả về token.');
              return;
            }

            // 1. Lưu Token vào localStorage
            localStorage.setItem('authToken', token);
            console.log('✅ Token đã được lưu vào localStorage');

            // 2. Verify token đã lưu thành công
            const savedToken = localStorage.getItem('authToken');
            if (savedToken === token) {
              console.log('✅ Xác nhận: Token đã lưu thành công trong localStorage');
            } else {
              console.error('❌ Cảnh báo: Token không được lưu đúng!');
            }

            // 3. Giải mã Token để lấy thông tin user
            try {
              const decodedToken: any = jwtDecode(token);
              console.log('📦 Decoded Token:', decodedToken);

              const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];
              const email = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decodedToken['email'];
              const name = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken['name'];

              console.log('🎭 ROLE:', role);
              console.log('📧 EMAIL:', email);
              console.log('👤 TÊN:', name);

              // Hiển thị thông báo cho user

              // 4. Điều hướng dựa trên Role
              if (role === 'HR' || role === 'ADMIN' || role === 'INTERVIEWER') {
                console.log('➡️ Chuyển hướng đến HR Dashboard...');
                this.router.navigate(['/hr/dashboard']);
              } else {
                console.log('➡️ Chuyển hướng đến Candidate Home...');
                this.router.navigate(['/candidate/home']);
              }

            } catch (error) {
              console.error('❌ Lỗi giải mã token:', error);
              alert('Đăng nhập thành công nhưng không thể đọc thông tin user. Vui lòng thử lại.');
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