import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApplicationService, ApplicationDto } from '../../../services/application.service';

@Component({
  selector: 'app-manage-applications',
  imports: [CommonModule],
  templateUrl: './manage-applications.html',
  styleUrl: './manage-applications.scss',
})
export class ManageApplications implements OnInit {
  applications: ApplicationDto[] = [];
  jobId: string = '';
  isLoading = true;
  isEmpty = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('🔄 ManageApplications ngOnInit called');
    // Lấy jobId từ URL params
    this.route.params.subscribe(params => {
      this.jobId = params['jobId'];
      console.log('📋 JobId from route:', this.jobId);

      if (!this.jobId) {
        // Không có jobId trong URL
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Không tìm thấy thông tin công việc. Vui lòng chọn một công việc từ danh sách.';
      } else {
        this.loadApplications();
      }
    });
  }

  /**
   * Gọi API để lấy danh sách hồ sơ theo JobId
   */
  loadApplications(): void {
    console.log('🚀 Calling loadApplications for JobId:', this.jobId);
    this.isLoading = true;
    this.applicationService.getApplicationsByJobId(this.jobId).subscribe({
      next: (response) => {
        console.log('✅ loadApplications Success. Response:', response);
        if (response.success) {
          this.applications = response.data;
          this.isEmpty = this.applications.length === 0;
          console.log('📊 Applications loaded:', this.applications.length);
        } else {
          console.warn('⚠️ Response success is false:', response);
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Manually trigger change detection
      },
      error: (error) => {
        console.error('❌ Lỗi khi tải danh sách hồ sơ:', error);
        this.isLoading = false;
        this.isEmpty = true;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Trả về class CSS cho điểm AI Match
   */
  getScoreColor(score?: number): string {
    if (!score) return 'text-gray-500 bg-gray-50';
    if (score >= 70) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  }

  /**
   * Trả về label tiếng Việt cho trạng thái
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Mới nộp';
      case 'INTERVIEW':
        return 'Phỏng vấn';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status;
    }
  }

  /**
   * Trả về class CSS cho Badge trạng thái
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold';
      case 'INTERVIEW':
        return 'px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold';
      case 'REJECTED':
        return 'px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold';
      default:
        return 'px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold';
    }
  }

  /**
   * Cập nhật trạng thái hồ sơ
   */
  updateStatus(applicationId: string, newStatus: string): void {
    if (confirm(`Bạn có chắc muốn ${newStatus === 'INTERVIEW' ? 'mời phỏng vấn' : 'từ chối'} ứng viên này?`)) {
      this.applicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
        next: (response) => {
          if (response.success) {
            // Cập nhật UI
            const app = this.applications.find(a => a.applicationId === applicationId);
            if (app) {
              app.status = newStatus;
            }
            alert('Cập nhật trạng thái thành công!');
          }
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          alert('Có lỗi xảy ra khi cập nhật trạng thái!');
        }
      });
    }
  }

  /**
   * Mở CV trong tab mới
   */
  viewCv(cvUrl: string): void {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
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
}

