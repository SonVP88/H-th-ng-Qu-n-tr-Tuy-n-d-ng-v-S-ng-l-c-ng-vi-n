import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, EmployeeDto, CreateEmployeeRequest } from '../../../services/employee';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.scss',
})
export class EmployeeManagement implements OnInit {
  private employeeService = inject(EmployeeService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  employees = signal<EmployeeDto[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 5;

  // Edit employee
  selectedEmployee = signal<EmployeeDto | null>(null);
  showEditModal = signal(false);

  employeeForm!: FormGroup;

  // Expose Math for template
  Math = Math;

  // Computed properties for pagination
  totalPages = (): number => Math.ceil(this.employees().length / this.itemsPerPage);

  paginatedEmployees = (): EmployeeDto[] => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.employees().slice(start, start + this.itemsPerPage);
  };

  ngOnInit(): void {
    console.log('🔄 EmployeeManagement ngOnInit called');
    this.initForm();
    this.loadEmployees();
  }

  /**
   * Khởi tạo Reactive Form
   */
  private initForm(): void {
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      role: ['HR', [Validators.required]]
    });
  }

  /**
   * Load danh sách nhân viên từ API
   */
  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    console.log('🔍 Calling API: GET /api/employee');

    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        console.log('✅ Employees loaded:', data);
        this.employees.set(data);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading employees:', error);
        this.errorMessage.set('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Mở modal thêm nhân viên
   */
  openAddModal(): void {
    this.employeeForm.reset({ role: 'HR' });
    this.showModal.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.employeeForm.reset();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Submit form tạo nhân viên mới
   */
  onSubmit(): void {
    if (this.employeeForm.invalid) {
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request: CreateEmployeeRequest = this.employeeForm.value;

    console.log('📤 Creating employee:', request);

    this.employeeService.createEmployee(request).subscribe({
      next: (newEmployee) => {
        console.log('✅ Employee created:', newEmployee);
        this.isLoading.set(false);
        this.successMessage.set('✅ Tạo nhân viên thành công!');

        // Đóng modal và reload sau 1.5s
        setTimeout(() => {
          this.closeModal();
          this.loadEmployees();
        }, 1500);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error creating employee:', error);
        this.isLoading.set(false);

        // Xử lý error message
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else if (error.status === 400) {
          this.errorMessage.set('Email đã tồn tại hoặc dữ liệu không hợp lệ');
        } else if (error.status === 403) {
          this.errorMessage.set('Bạn không có quyền thực hiện thao tác này');
        } else {
          this.errorMessage.set('Có lỗi xảy ra. Vui lòng thử lại.');
        }

        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Kiểm tra field có lỗi không
   */
  hasError(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Lấy error message cho field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }

    if (field?.hasError('email')) {
      return 'Email không hợp lệ';
    }

    return '';
  }

  /**
   * Format date sang tiếng Việt
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Get initials từ tên
   */
  getInitials(fullName: string): string {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  /**
   * Get badge class theo role
   */
  getRoleBadgeClass(role: string): string {
    if (role === 'HR') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
    if (role === 'INTERVIEWER') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Get avatar color theo role
   */
  getAvatarClass(role: string): string {
    if (role === 'HR') {
      return 'bg-blue-50 text-primary dark:bg-blue-900/20';
    }
    if (role === 'INTERVIEWER') {
      return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20';
    }
    return 'bg-gray-100 text-gray-600';
  }

  /**
   * View/Edit employee - Open modal with form populated
   */
  viewEmployee(employee: EmployeeDto): void {
    this.selectedEmployee.set(employee);
    // Populate form with employee data
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      email: employee.email,
      phoneNumber: employee.phone,
      role: employee.role
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedEmployee.set(null);
    this.employeeForm.reset({ role: 'HR' });
  }

  /**
   * Update employee info
   */
  updateEmployee(): void {
    if (this.employeeForm.invalid || !this.selectedEmployee()) {
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    const request: CreateEmployeeRequest = this.employeeForm.value;
    const userId = this.selectedEmployee()!.userId;

    this.employeeService.updateEmployee(userId, request).subscribe({
      next: (updated) => {
        console.log('✅ Employee updated:', updated);
        this.successMessage.set('✅ Cập nhật nhân viên thành công!');

        setTimeout(() => {
          this.closeEditModal();
          this.loadEmployees();
          this.successMessage.set(null);
        }, 1500);

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error updating employee:', error);
        this.errorMessage.set('Không thể cập nhật nhân viên. Email có thể đã tồn tại.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Reactivate employee
   */
  reactivateEmployee(userId: string): void {
    if (!confirm('Bạn có chắc chắn muốn kích hoạt lại nhân viên này?')) {
      return;
    }

    this.isLoading.set(true);

    this.employeeService.reactivateEmployee(userId).subscribe({
      next: () => {
        console.log('✅ Employee reactivated');
        this.successMessage.set('✅ Kích hoạt nhân viên thành công!');

        setTimeout(() => {
          this.successMessage.set(null);
          this.loadEmployees();
        }, 1500);

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error reactivating employee:', error);
        this.errorMessage.set('Không thể kích hoạt nhân viên. Vui lòng thử lại.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Delete (deactivate) employee
   */
  deleteEmployee(userId: string): void {
    if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?')) {
      return;
    }

    this.isLoading.set(true);

    this.employeeService.deactivateEmployee(userId).subscribe({
      next: () => {
        console.log('✅ Employee deactivated');
        this.successMessage.set('✅ Vô hiệu hóa nhân viên thành công!');

        setTimeout(() => {
          this.successMessage.set(null);
          this.loadEmployees();
        }, 1500);

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error deactivating employee:', error);
        this.errorMessage.set('Không thể vô hiệu hóa nhân viên. Vui lòng thử lại.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Pagination methods
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;

    const range: number[] = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1); // ellipsis
    }
    if (current + delta < total - 1) {
      range.push(-1); // ellipsis
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range;
  }
}
