import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApplicationService, ApplicationDto } from '../../../services/application.service';
import { OfferModalComponent } from '../../../components/admin/offer-modal/offer-modal';

interface InterviewForm {
  date: string;
  time: string;
  type: 'ONLINE' | 'OFFLINE';
  location: string;
  interviewerId: string;
}

interface InterviewerListItem {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
}

@Component({
  selector: 'app-manage-applications',
  imports: [CommonModule, FormsModule, OfferModalComponent],
  templateUrl: './manage-applications.html',
  styleUrl: './manage-applications.scss',
})
export class ManageApplications implements OnInit, OnDestroy {
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
    location: '',
    interviewerId: ''
  };

  // Danh sách Interviewer
  interviewers: InterviewerListItem[] = [];
  isLoadingInterviewers = false;

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

  // ==================== SEARCH & FILTER ====================
  searchQuery = '';
  showFilterPanel = false;
  filterStatus = '';
  filterScoreRange = '';
  filterDateRange = '';
  rejectEmailContent = '';

  isGeneratingRejectEmail = false;
  isSendingRejectEmail = false;

  // ==================== OFFER MODAL ====================
  isOfferModalOpen = false;
  selectedCandidateForOffer: ApplicationDto | null = null;

  private apiUrl = 'https://localhost:7181/api';
  private refreshInterval: any; // Auto-refresh timer

  // ==================== REFRESH CONFIGURATION ====================
  // Toggle between DEMO mode (fast refresh for presentations) and PRODUCTION mode
  private readonly DEMO_MODE = true; // Set to false for production
  private readonly REFRESH_INTERVAL_DEMO = 5000; // 5 seconds - for demo/presentation
  private readonly REFRESH_INTERVAL_PROD = 15000; // 15 seconds - for production

  lastRefreshTime: Date | null = null; // For UI display

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router,
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
        this.startAutoRefresh(); // Start auto-refresh after initial load
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  /**
   * Get current refresh interval based on mode
   */
  getRefreshInterval(): number {
    return this.DEMO_MODE ? this.REFRESH_INTERVAL_DEMO : this.REFRESH_INTERVAL_PROD;
  }

  /**
   * Start auto-refresh with configurable interval
   * DEMO_MODE = true: 5 seconds (for presentations)
   * DEMO_MODE = false: 15 seconds (for production)
   */
  startAutoRefresh(): void {
    // Clear existing interval if any
    this.stopAutoRefresh();

    const interval = this.getRefreshInterval();
    const seconds = interval / 1000;

    // Set new interval
    this.refreshInterval = setInterval(() => {
      console.log(`🔄 Auto-refreshing applications... (${this.DEMO_MODE ? 'DEMO' : 'PROD'} mode)`);
      this.loadApplications();
    }, interval);

    console.log(`✅ Auto-refresh started (every ${seconds}s - ${this.DEMO_MODE ? 'DEMO' : 'PRODUCTION'} mode)`);
    console.log(`💡 Tip: Set DEMO_MODE = ${!this.DEMO_MODE} in manage-applications.ts to switch to ${this.DEMO_MODE ? 'production' : 'demo'} mode`);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }

  /**
   * Manual refresh button
   */
  refreshApplications(): void {
    console.log('🔄 Manual refresh triggered');
    this.loadApplications();
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
          this.lastRefreshTime = new Date(); // Update last refresh time
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
    const statusMap: Record<string, string> = {
      'NEW': 'Mới nộp',
      'NEW_APPLIED': 'Mới nộp',
      'ACTIVE': 'Mới nộp',
      'SCREENING': 'Sàng lọc',
      'INTERVIEW': 'Phỏng vấn',
      'OFFER': 'Đề nghị',
      'HIRED': 'Đã tuyển',
      'REJECTED': 'Từ chối'
    };
    return statusMap[status] || status;
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
      // If cvUrl is relative path, prepend backend URL
      const fullUrl = cvUrl.startsWith('http')
        ? cvUrl
        : `https://localhost:7181${cvUrl}`;
      window.open(fullUrl, '_blank');
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
      location: '',
      interviewerId: ''
    };
    this.aiOpeningText = '';
    this.updateEmailPreview();

    // Load danh sách Interviewer
    this.loadInterviewers();

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

  // ==================== OFFER MODAL METHODS ====================

  /**
   * Mở modal gửi Offer Letter
   */
  openOfferModal(application: ApplicationDto): void {
    this.selectedCandidateForOffer = application;
    this.isOfferModalOpen = true;
  }

  /**
   * Xử lý khi offer đã được gửi thành công
   */
  handleOfferSent(payload: any): void {
    console.log('✅ Offer sent successfully:', payload);

    // Close modal
    this.isOfferModalOpen = false;
    this.selectedCandidateForOffer = null;

    // Reload applications list để cập nhật status mới
    this.loadApplications();
  }

  /**
   * Navigate to Candidate Detail page
   */
  viewCandidateDetail(app: ApplicationDto): void {
    console.log('📄 Navigating to candidate detail:', app);
    this.router.navigate(['/hr/candidate-detail'], {
      state: { candidate: app }
    });
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
   * Gọi API lấy danh sách Interviewer
   */
  loadInterviewers(): void {
    this.isLoadingInterviewers = true;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('📋 Loading interviewers...');

    this.http.get<Array<{ id: string, fullName: string, email: string, roleName: string }>>(`${this.apiUrl}/employees/interviewers`, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ Interviewers loaded:', response);
          console.log('🔍 First interviewer:', response[0]);
          console.log('🔍 Keys of first item:', response[0] ? Object.keys(response[0]) : 'empty');
          this.interviewers = response;
          this.isLoadingInterviewers = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading interviewers:', error);
          alert('Có lỗi khi tải danh sách người phỏng vấn!');
          this.isLoadingInterviewers = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
 * Group interviewers theo Role để hiển thị trong optgroup
 */
  getInterviewersByRole(role: string): InterviewerListItem[] {
    return this.interviewers.filter(i => i.roleName === role);
  }

  /**
   * Kiểm tra có interviewer nào với role này không
   */
  hasInterviewersWithRole(role: string): boolean {
    return this.interviewers.some(i => i.roleName === role);
  }

  // ==================== CUSTOM DROPDOWN STATE ====================

  isDropdownOpen = false;
  dropdownSearchQuery = '';
  expandedGroups = {
    ADMIN: true,
    HR: true,
    INTERVIEWER: true
  };

  /**
   * Toggle dropdown open/close
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.dropdownSearchQuery = '';
      // Auto-expand all groups when opening
      this.expandedGroups = { ADMIN: true, HR: true, INTERVIEWER: true };
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.dropdownSearchQuery = '';
  }

  /**
   * Toggle group collapse/expand
   */
  toggleGroup(role: 'ADMIN' | 'HR' | 'INTERVIEWER'): void {
    this.expandedGroups[role] = !this.expandedGroups[role];
  }

  /**
   * Select interviewer
   */
  selectInterviewer(user: InterviewerListItem): void {
    this.interviewForm.interviewerId = user.id;
    this.closeDropdown();
  }

  /**
   * Get selected interviewer display name
   */
  getSelectedInterviewerName(): string {
    if (!this.interviewForm.interviewerId) return '';
    const selected = this.interviewers.find(i => i.id === this.interviewForm.interviewerId);
    return selected ? `${selected.fullName} - ${selected.email}` : '';
  }

  /**
   * Filter interviewers by search query
   */
  getFilteredInterviewersByRole(role: string): InterviewerListItem[] {
    const byRole = this.getInterviewersByRole(role);
    if (!this.dropdownSearchQuery.trim()) return byRole;

    const query = this.dropdownSearchQuery.toLowerCase();
    return byRole.filter(i =>
      i.fullName.toLowerCase().includes(query) ||
      i.email.toLowerCase().includes(query)
    );
  }

  /**
   * Get initials from name
   */
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get avatar color based on name
   */
  getAvatarColor(fullName: string): string {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-indigo-500'
    ];
    const index = fullName.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Kiểm tra form hợp lệ
   */
  isFormValid(): boolean {
    return !!(
      this.interviewForm.date &&
      this.interviewForm.time &&
      this.interviewForm.location &&
      this.interviewForm.interviewerId &&
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

    // Tính toán scheduledStart và scheduledEnd từ date + time
    // Normalize date format to YYYY-MM-DD (ISO 8601)
    let normalizedDate: string;

    if (this.interviewForm.date.includes('/')) {
      // Format: MM/DD/YYYY hoặc DD/MM/YYYY → parse sang YYYY-MM-DD
      const dateParts = this.interviewForm.date.split('/');
      const dateObj = new Date(this.interviewForm.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      normalizedDate = `${year}-${month}-${day}`;
    } else {
      // Đã đúng format YYYY-MM-DD
      normalizedDate = this.interviewForm.date;
    }

    // Normalize time format to HH:mm (24h format)
    let normalizedTime = this.interviewForm.time;
    if (normalizedTime.includes('AM') || normalizedTime.includes('PM')) {
      // Convert 12h format to 24h
      const timeParts = normalizedTime.replace(/\s?(AM|PM)/i, '').split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const isPM = normalizedTime.toUpperCase().includes('PM');

      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      normalizedTime = `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    const scheduledStart = `${normalizedDate}T${normalizedTime}:00`; // ISO 8601 format
    const scheduledEnd = this.calculateEndTime(scheduledStart, 60); // Mặc định 60 phút

    console.log('🕒 Time values:', {
      original: { date: this.interviewForm.date, time: this.interviewForm.time },
      normalized: { date: normalizedDate, time: normalizedTime },
      scheduledStart,
      scheduledEnd,
      startDate: new Date(scheduledStart),
      endDate: new Date(scheduledEnd),
      isValid: !isNaN(new Date(scheduledStart).getTime())
    });

    // Payload cho backend schedule-interview API
    const schedulePayload = {
      interviewerId: this.interviewForm.interviewerId,
      title: `Phỏng vấn - ${this.selectedApplication.jobTitle || 'Vị trí tuyển dụng'}`,
      scheduledStart: scheduledStart,
      scheduledEnd: scheduledEnd,
      meetingLink: this.interviewForm.type === 'ONLINE' ? this.interviewForm.location : null,
      location: this.interviewForm.type === 'OFFLINE' ? this.interviewForm.location : null
    };

    console.log('📅 Scheduling interview...', schedulePayload);

    // 1. Lên lịch phỏng vấn (POST /api/applications/{id}/schedule-interview)
    this.http.post(
      `${this.apiUrl}/applications/${this.selectedApplication.applicationId}/schedule-interview`,
      schedulePayload,
      { headers }
    ).subscribe({
      next: (response) => {
        console.log('✅ Interview scheduled successfully:', response);
        console.log('📧 Email with CC sent automatically by backend');

        // Update trạng thái INTERVIEW trong UI
        const app = this.applications.find(a => a.applicationId === this.selectedApplication!.applicationId);
        if (app) {
          app.status = 'INTERVIEW';
        }

        alert('🎉 Đã lên lịch phỏng vấn và gửi email thành công!');
        this.closeInterviewModal();
        this.isSendingEmail = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error scheduling interview:', error);
        const errorMsg = error.error?.message || 'Có lỗi khi lên lịch phỏng vấn. Vui lòng thử lại!';
        alert(errorMsg);
        this.isSendingEmail = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Tính thời gian kết thúc (thêm N phút vào start time)
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = new Date(startTime);

    // Validate date
    if (isNaN(start.getTime())) {
      console.error('❌ Invalid start time:', startTime);
      throw new Error('Invalid start time format');
    }

    const end = new Date(start.getTime() + durationMinutes * 60000);

    // Format as local datetime string (YYYY-MM-DDTHH:mm:ss), NOT UTC
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    const seconds = String(end.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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

  // ==================== SEARCH & FILTER METHODS ====================

  /**
   * Computed property: Danh sách applications đã được filter
   */
  filteredApplications(): ApplicationDto[] {
    let filtered = [...this.applications];

    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(app =>
        app.candidateName.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        (app.phone && app.phone.includes(query))
      );
    }

    // Apply status filter
    if (this.filterStatus) {
      filtered = filtered.filter(app => app.status === this.filterStatus);
    }

    // Apply AI score filter
    if (this.filterScoreRange) {
      const [min, max] = this.filterScoreRange.split('-').map(Number);
      filtered = filtered.filter(app => {
        const score = app.matchScore || 0;
        return score >= min && score <= max;
      });
    }

    // Apply date range filter
    if (this.filterDateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(app => {
        const appliedDate = new Date(app.appliedAt);
        const appDate = new Date(appliedDate.getFullYear(), appliedDate.getMonth(), appliedDate.getDate());

        if (this.filterDateRange === 'today') {
          return appDate.getTime() === today.getTime();
        } else if (this.filterDateRange === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo;
        } else if (this.filterDateRange === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return appDate >= monthAgo;
        }
        return true;
      });
    }

    return filtered;
  }

  /**
   * Toggle filter panel visibility
   */
  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  /**
   * Triggered when search input changes
   */
  onSearchChange(): void {
    // Debounce could be added here if needed
    this.cdr.detectChanges();
  }

  /**
   * Apply filters (called when dropdown changes)
   */
  applyFilters(): void {
    this.cdr.detectChanges();
  }

  /**
   * Clear all filters and search
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterScoreRange = '';
    this.filterDateRange = '';
    this.cdr.detectChanges();
  }

  /**
   * Get count of active filters
   */
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filterStatus) count++;
    if (this.filterScoreRange) count++;
    if (this.filterDateRange) count++;
    return count;
  }

  /**
   * Export filtered applications to Excel (CSV format)
   */
  exportToExcel(): void {
    const filtered = this.filteredApplications();

    if (filtered.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    // Prepare CSV data
    const headers = ['Tên ứng viên', 'Email', 'Số điện thoại', 'Ngày nộp', 'AI Match Score', 'Trạng thái', 'Vị trí'];
    const rows = filtered.map(app => [
      app.candidateName,
      `'${app.email}`, // Force text format with apostrophe
      app.phone ? `'${app.phone}` : '', // Force text format
      this.formatDate(app.appliedAt),
      app.matchScore ? `${app.matchScore}%` : 'N/A',
      this.getStatusLabel(app.status),
      app.jobTitle || ''
    ]);

    // Convert to CSV string with proper escaping
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape double quotes and wrap in quotes
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ].join('\n');

    // Create Blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `ung-vien-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Exported ${filtered.length} applications to CSV`);
  }
}
