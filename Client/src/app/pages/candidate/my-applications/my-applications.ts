
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ApplicationService, MyApplicationDto } from '../../../services/application.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.scss',
})
export class MyApplications implements OnInit {
  // Services
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  // Properties (NON-SIGNAL)
  myApplications: MyApplicationDto[] = [];
  isLoading = false;
  isEmpty = false;

  // Auth properties for navbar
  isLoggedIn = false;
  userRole = '';
  userFullName = '';

  constructor(
    private applicationService: ApplicationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Chỉ chạy logic này trên trình duyệt (Client Side)
    if (isPlatformBrowser(this.platformId)) {
      console.log('🌍 Running on Browser Platform');

      // Sử dụng setTimeout để đảm bảo execution sau khi view init (MacroTask)
      setTimeout(() => {
        const token = localStorage.getItem('authToken');

        if (token) {
          console.log('🔑 Token found');
          this.isLoggedIn = true;

          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.userRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
            this.userFullName = payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
          } catch (e) {
            console.error('❌ Error parsing token:', e);
          }

          // Load data
          this.loadMyApplications();
        } else {
          console.log('⚠️ No token found');
        }

        // Force update UI
        this.cdr.detectChanges();
      }, 100);
    }
  }

  /**
   * Gọi API để lấy danh sách hồ sơ đã nộp
   */
  loadMyApplications(): void {
    console.log('🔄 loadMyApplications() called');
    this.isLoading = true;

    this.applicationService.getMyApplications().subscribe({
      next: (response: any) => {
        console.log('📦 Response:', response);

        // Parse response
        if (response && response.success && response.data) {
          this.myApplications = response.data;
        } else if (Array.isArray(response)) {
          this.myApplications = response;
        } else {
          this.myApplications = [];
        }

        this.isEmpty = this.myApplications.length === 0;
        this.isLoading = false;

        console.log('✅ Loaded', this.myApplications.length, 'applications');
        this.cdr.detectChanges(); // <-- FORCE UPDATE UI
      },
      error: (error) => {
        console.error('❌ Error:', error);
        this.isLoading = false;
        this.isEmpty = true;
        this.cdr.detectChanges(); // <-- FORCE UPDATE UI
      }
    });
  }

  /**
   * Trả về class CSS cho Badge trạng thái dựa trên status
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'INTERVIEW':
        return 'px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1';
      case 'REJECTED':
        return 'px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1';
      case 'NEW_APPLIED':
        return 'px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1';
      default:
        return 'px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1';
    }
  }

  /**
   * Trả về label tiếng Việt cho trạng thái
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'INTERVIEW':
        return 'Được mời phỏng vấn';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'NEW_APPLIED':
        return 'Đã nộp hồ sơ';
      default:
        return 'Chưa rõ';
    }
  }

  /**
   * Mở CV trong tab mới
   */
  openCv(cvUrl: string | undefined): void {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  }

  /**
   * Chuyển hướng đến chi tiết công việc
   */
  goToJobDetail(jobId: string): void {
    this.router.navigate(['/jobs', jobId]);
  }

  /**
   * Chuyển hướng đến trang tìm việc
   */
  goToJobSearch(): void {
    this.router.navigate(['/jobs']);
  }

  /**
   * Format ngày tháng
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
