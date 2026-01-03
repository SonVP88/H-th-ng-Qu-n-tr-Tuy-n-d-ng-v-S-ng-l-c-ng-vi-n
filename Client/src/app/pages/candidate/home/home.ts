import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

// Interface khớp với Backend JobHomeDto
export interface JobHomeDto {
  jobId: string;
  title: string;
  companyName: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  employmentType: string | null;
  deadline: string | null;
  createdDate: string;
  skills: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  featuredJobs: JobHomeDto[] = [];
  loading = true;
  error: string | null = null;
  isLoggedIn = false;
  userFullName = '';

  private apiUrl = 'https://localhost:7181/api'; // HTTPS backend

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef cho zoneless mode
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadLatestJobs();
  }

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  checkAuthStatus(): void {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const token = window.localStorage.getItem('authToken');
      this.isLoggedIn = !!token;

      // Nếu có token, decode để lấy tên user (optional)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userFullName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
        } catch (e) {
          this.userFullName = 'User';
        }
      }
    }
  }

  /**
   * Gọi API lấy 6 job mới nhất
   */
  loadLatestJobs(): void {
    this.loading = true;
    this.error = null;

    this.http.get<JobHomeDto[]>(`${this.apiUrl}/jobs/latest/6`)
      .subscribe({
        next: (jobs) => {
          this.featuredJobs = jobs;
          this.loading = false;
          this.cdr.detectChanges(); // Trigger change detection manually
          console.log('Loaded jobs:', jobs);
        },
        error: (err) => {
          console.error('Error loading jobs:', err);
          this.error = 'Không thể tải danh sách việc làm. Vui lòng thử lại sau.';
          this.loading = false;
          this.cdr.detectChanges(); // Trigger change detection manually
        }
      });
  }

  /**
   * Format salary range
   * VD: formatSalary(10000000, 20000000) => "10 - 20 Triệu"
   */
  formatSalary(min: number | null, max: number | null): string {
    if (!min && !max) return 'Thỏa thuận';

    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(0)} Triệu`;
      }
      return `${num.toLocaleString('vi-VN')} VNĐ`;
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)}`;
    } else if (min) {
      return `Từ ${formatNumber(min)}`;
    } else if (max) {
      return `Lên đến ${formatNumber(max)}`;
    }

    return 'Thỏa thuận';
  }

  /**
   * Format deadline
   */
  formatDeadline(deadline: string | null): string {
    if (!deadline) return 'Không giới hạn';

    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Đã hết hạn';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    if (diffDays <= 7) return `Còn ${diffDays} ngày`;

    return date.toLocaleDateString('vi-VN');
  }
}
