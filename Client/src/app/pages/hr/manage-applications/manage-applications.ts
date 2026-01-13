import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApplicationService, ApplicationDto } from '../../../services/application.service';

interface InterviewForm {
  date: string;
  time: string;
  type: 'ONLINE' | 'OFFLINE';
  location: string;
}

@Component({
  selector: 'app-manage-applications',
  imports: [CommonModule, FormsModule],
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

  // Modal state
  showInterviewModal = false;
  selectedApplication: ApplicationDto | null = null;

  // Interview form
  interviewForm: InterviewForm = {
    date: '',
    time: '',
    type: 'ONLINE',
    location: ''
  };

  // Email preview
  emailPreviewContent = '';
  aiOpeningText = ''; // Lưu đoạn mở đầu do AI sinh

  // Loading states
  isGeneratingAI = false;
  isSendingEmail = false;

  // ==================== REJECT MODAL ====================
  showRejectModal = false;
  rejectApplication: ApplicationDto | null = null;
  rejectStep = 1; // 1: Chọn lý do, 2: Review email

  rejectReasons = {
    skill: false,
    salary: false,
    culture: false
  };
  rejectNote = '';
  rejectEmailContent = '';

  isGeneratingRejectEmail = false;
  isSendingRejectEmail = false;

  private apiUrl = 'https://localhost:7181/api';

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
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
      case 'NEW_APPLIED':
      case 'ACTIVE':
        return 'Mới nộp';
      case 'INTERVIEW':
        return 'Chờ phỏng vấn';
      case 'HIRED':
        return 'Đã tuyển';
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
      case 'NEW_APPLIED':
      case 'ACTIVE':
        return 'px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold';
      case 'INTERVIEW':
        return 'px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold';
      case 'HIRED':
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
    // Nếu chọn INTERVIEW -> Mở modal phỏng vấn
    if (newStatus === 'INTERVIEW') {
      const app = this.applications.find(a => a.applicationId === applicationId);
      if (app) {
        this.openInterviewModal(app);
      }
      return;
    }

    // Nếu chọn REJECTED -> Mở modal từ chối (Human-in-the-loop)
    if (newStatus === 'REJECTED') {
      const app = this.applications.find(a => a.applicationId === applicationId);
      if (app) {
        this.openRejectModal(app);
      }
      return;
    }

    let confirmMessage = '';

    switch (newStatus) {
      case 'HIRED':
        confirmMessage = 'Bạn chắc chắn muốn TUYỂN ứng viên này? Hành động này sẽ gửi thông báo đến ứng viên.';
        break;
      default:
        confirmMessage = `Bạn có chắc muốn cập nhật trạng thái thành ${newStatus}?`;
    }

    if (confirm(confirmMessage)) {
      this.applicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
        next: (response) => {
          if (response.success) {
            // Cập nhật UI
            const app = this.applications.find(a => a.applicationId === applicationId);
            if (app) {
              app.status = newStatus;
            }

            let successMessage = '';
            switch (newStatus) {
              case 'HIRED':
                successMessage = '🎉 Chúc mừng! Đã tuyển ứng viên thành công!';
                break;
              case 'REJECTED':
                successMessage = 'Đã từ chối ứng viên.';
                break;
              default:
                successMessage = 'Cập nhật trạng thái thành công!';
            }
            alert(successMessage);
            this.cdr.detectChanges();
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

  // ==================== MODAL INTERVIEW ====================

  /**
   * Mở modal lên lịch phỏng vấn
   */
  openInterviewModal(application: ApplicationDto): void {
    this.selectedApplication = application;
    this.showInterviewModal = true;

    // Reset form
    this.interviewForm = {
      date: '',
      time: '09:00',
      type: 'ONLINE',
      location: ''
    };
    this.aiOpeningText = '';
    this.updateEmailPreview();
    this.cdr.detectChanges();
  }

  /**
   * Đóng modal
   */
  closeInterviewModal(): void {
    this.showInterviewModal = false;
    this.selectedApplication = null;
    this.emailPreviewContent = '';
    this.aiOpeningText = '';
    this.cdr.detectChanges();
  }

  /**
   * Cập nhật nội dung email preview (Two-way binding)
   */
  updateEmailPreview(): void {
    const formattedDate = this.interviewForm.date
      ? new Date(this.interviewForm.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      : '[Chưa chọn ngày]';

    const typeLabel = this.interviewForm.type === 'ONLINE' ? 'Online (Video Call)' : 'Offline (Trực tiếp)';
    const locationLabel = this.interviewForm.type === 'ONLINE' ? 'Link Meeting' : 'Địa điểm';
    const locationValue = this.interviewForm.location || '[Chưa nhập]';

    // Template email
    this.emailPreviewContent = `${this.aiOpeningText ? this.aiOpeningText + '\n\n' : '[Bấm "✨ AI Personalize" để tạo đoạn mở đầu cá nhân hóa...]\n\n'}Chi tiết buổi phỏng vấn:
- Thời gian: ${formattedDate} lúc ${this.interviewForm.time || '[Chưa chọn giờ]'}
- Hình thức: ${typeLabel}
- ${locationLabel}: ${locationValue}

Vui lòng xác nhận tham gia bằng cách phản hồi email này.

Trân trọng,
Phòng Nhân sự`;
  }

  /**
   * Gọi API sinh đoạn mở đầu bằng AI
   */
  generateAIOpening(): void {
    if (!this.selectedApplication) return;

    this.isGeneratingAI = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const body = {
      candidateId: this.selectedApplication.candidateId,
      jobId: this.jobId
    };

    console.log('🤖 Calling AI generate-opening API...', body);

    this.http.post<{ opening: string }>(`${this.apiUrl}/Interview/generate-opening`, body, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ AI Opening generated:', response);
          this.aiOpeningText = response.opening;
          this.updateEmailPreview();
          this.isGeneratingAI = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error generating AI opening:', error);
          alert('Có lỗi khi tạo nội dung AI. Vui lòng thử lại!');
          this.isGeneratingAI = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Kiểm tra form hợp lệ
   */
  isFormValid(): boolean {
    return !!(
      this.interviewForm.date &&
      this.interviewForm.time &&
      this.interviewForm.location &&
      this.emailPreviewContent.trim()
    );
  }

  /**
   * Gửi lời mời phỏng vấn
   */
  sendInterviewInvitation(): void {
    if (!this.selectedApplication || !this.isFormValid()) return;

    this.isSendingEmail = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // 1. Gửi email thủ công
    const emailBody = {
      toEmail: this.selectedApplication.email,
      subject: `Thư mời phỏng vấn - ${this.selectedApplication.jobTitle || 'Vị trí tuyển dụng'}`,
      bodyHtml: this.emailPreviewContent.replace(/\n/g, '<br>')
    };

    console.log('📧 Sending email...', emailBody);

    this.http.post(`${this.apiUrl}/Interview/send-email-manual`, emailBody, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ Email sent successfully:', response);

          // 2. Cập nhật trạng thái INTERVIEW
          this.applicationService.updateApplicationStatus(
            this.selectedApplication!.applicationId,
            'INTERVIEW'
          ).subscribe({
            next: (statusResponse) => {
              if (statusResponse.success) {
                // Cập nhật UI
                const app = this.applications.find(a => a.applicationId === this.selectedApplication!.applicationId);
                if (app) {
                  app.status = 'INTERVIEW';
                }

                alert('🎉 Đã gửi lời mời phỏng vấn thành công!');
                this.closeInterviewModal();
                this.isSendingEmail = false;
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              console.error('❌ Error updating status:', error);
              alert('Email đã gửi nhưng có lỗi khi cập nhật trạng thái!');
              this.isSendingEmail = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: (error) => {
          console.error('❌ Error sending email:', error);
          alert('Có lỗi khi gửi email. Vui lòng thử lại!');
          this.isSendingEmail = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ==================== REJECT MODAL METHODS ====================

  /**
   * Mở modal từ chối hồ sơ
   */
  openRejectModal(application: ApplicationDto): void {
    this.rejectApplication = application;
    this.showRejectModal = true;
    this.rejectStep = 1;

    // Reset form
    this.rejectReasons = { skill: false, salary: false, culture: false };
    this.rejectNote = '';
    this.rejectEmailContent = '';

    this.cdr.detectChanges();
  }

  /**
   * Đóng modal từ chối
   */
  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectApplication = null;
    this.rejectStep = 1;
    this.rejectEmailContent = '';
    this.cdr.detectChanges();
  }

  /**
   * Kiểm tra có chọn ít nhất 1 lý do không
   */
  hasSelectedReason(): boolean {
    return this.rejectReasons.skill || this.rejectReasons.salary || this.rejectReasons.culture;
  }

  /**
   * Thu thập lý do từ checkboxes
   */
  private collectReasons(): string[] {
    const reasons: string[] = [];
    if (this.rejectReasons.skill) reasons.push('Chuyên môn chưa đạt');
    if (this.rejectReasons.salary) reasons.push('Mức lương không phù hợp');
    if (this.rejectReasons.culture) reasons.push('Văn hóa không phù hợp');
    return reasons;
  }

  /**
   * Gọi API sinh email từ chối bằng AI
   */
  generateRejectionDraft(): void {
    if (!this.rejectApplication || !this.hasSelectedReason()) return;

    this.isGeneratingRejectEmail = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const body = {
      candidateName: this.rejectApplication.candidateName,
      jobTitle: this.rejectApplication.jobTitle || 'Vị trí tuyển dụng',
      reasons: this.collectReasons(),
      note: this.rejectNote
    };

    console.log('🤖 Calling AI generate-rejection API...', body);

    this.http.post<{ body: string }>(`${this.apiUrl}/Interview/generate-rejection`, body, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ AI Rejection email generated:', response);
          this.rejectEmailContent = response.body;
          this.rejectStep = 2; // Chuyển sang bước 2
          this.isGeneratingRejectEmail = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error generating rejection email:', error);
          alert('Có lỗi khi tạo email. Vui lòng thử lại!');
          this.isGeneratingRejectEmail = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Xác nhận gửi email từ chối và cập nhật trạng thái
   */
  confirmReject(): void {
    if (!this.rejectApplication || !this.rejectEmailContent.trim()) return;

    this.isSendingRejectEmail = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // 1. Gửi email từ chối
    const emailBody = {
      toEmail: this.rejectApplication.email,
      subject: `Thông báo kết quả ứng tuyển - ${this.rejectApplication.jobTitle || 'Vị trí tuyển dụng'}`,
      bodyHtml: this.rejectEmailContent.replace(/\n/g, '<br>')
    };

    console.log('📧 Sending rejection email...', emailBody);

    this.http.post(`${this.apiUrl}/Interview/send-email-manual`, emailBody, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ Rejection email sent successfully:', response);

          // 2. Cập nhật trạng thái REJECTED
          this.applicationService.updateApplicationStatus(
            this.rejectApplication!.applicationId,
            'REJECTED'
          ).subscribe({
            next: (statusResponse) => {
              if (statusResponse.success) {
                // Cập nhật UI
                const app = this.applications.find(a => a.applicationId === this.rejectApplication!.applicationId);
                if (app) {
                  app.status = 'REJECTED';
                }

                alert('📧 Đã gửi email từ chối và cập nhật trạng thái thành công!');
                this.closeRejectModal();
                this.isSendingRejectEmail = false;
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              console.error('❌ Error updating status:', error);
              alert('Email đã gửi nhưng có lỗi khi cập nhật trạng thái!');
              this.isSendingRejectEmail = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: (error) => {
          console.error('❌ Error sending rejection email:', error);
          alert('Có lỗi khi gửi email. Vui lòng thử lại!');
          this.isSendingRejectEmail = false;
          this.cdr.detectChanges();
        }
      });
  }
}
