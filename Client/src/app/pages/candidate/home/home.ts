import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { JobDto, JobService } from '../../../services/job.service';
import { AuthService } from '../../../services/auth.service';

// Interface khớp với Backend JobHomeDto - Dùng cái này hoặc JobDto từ service
export interface JobHomeDto extends JobDto { }

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
  userRole = '';

  private apiUrl = '/api';

  constructor(
    private jobService: JobService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadLatestJobs();
  }

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();

    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userFullName = user.name || 'User';
        this.userRole = user.role || '';
        console.log('✅ User đã đăng nhập:', {
          name: this.userFullName,
          email: user.email,
          role: this.userRole
        });
      }
    } else {
      console.log('ℹ️ User chưa đăng nhập');
    }
  }

  /**
   * Gọi API lấy 6 job mới nhất
   */
  loadLatestJobs(): void {
    this.loading = true;
    this.error = null;

    // Sử dụng JobService để tận dụng cấu hình Proxy (tránh lỗi SSL self-signed)
    this.jobService.getLatestJobs(6)
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
  formatSalary(min: number | null | undefined, max: number | null | undefined): string {
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

  /**
   * Đăng xuất
   */
  logout(): void {
    this.authService.logout();
  }
}
