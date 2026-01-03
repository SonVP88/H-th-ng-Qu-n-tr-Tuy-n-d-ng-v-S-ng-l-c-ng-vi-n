import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MasterDataService, JobType, Skill } from '../../../services/master-data.service';
import { JobService, CreateJobRequest } from '../../../services/job.service';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-job.html',
  styleUrl: './post-job.scss',
})
export class PostJob implements OnInit {
  jobForm!: FormGroup;
  jobTypes: JobType[] = [];
  skills: Skill[] = [];
  selectedSkillIds: string[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private masterDataService: MasterDataService,
    private jobService: JobService
  ) { }

  ngOnInit(): void {
    // Khởi tạo form với validation
    this.initForm();

    // Gọi API để lấy dữ liệu Master Data
    this.loadMasterData();
  }

  /**
   * Khởi tạo Reactive Form với các validators
   */
  private initForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      employmentType: ['', Validators.required],
      location: ['', Validators.required],
      salaryMin: [null],
      salaryMax: [null],
      deadline: [null],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * Gọi API để lấy JobTypes và Skills
   */
  private loadMasterData(): void {
    // Gọi API lấy JobTypes
    this.masterDataService.getJobTypes().subscribe({
      next: (data) => {
        this.jobTypes = data;
        console.log('JobTypes loaded:', data);
      },
      error: (error) => {
        console.error('Error loading job types:', error);
        alert('Không thể tải danh sách loại công việc. Vui lòng thử lại!');
      }
    });

    // Gọi API lấy Skills
    this.masterDataService.getSkills().subscribe({
      next: (data) => {
        this.skills = data;
        console.log('Skills loaded:', data);
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        alert('Không thể tải danh sách kỹ năng. Vui lòng thử lại!');
      }
    });
  }

  /**
   * Toggle skill selection - Thêm hoặc xóa skill ID khỏi mảng selectedSkillIds
   */
  toggleSkill(skillId: string): void {
    const index = this.selectedSkillIds.indexOf(skillId);

    if (index > -1) {
      // Skill đã được chọn -> Xóa khỏi mảng
      this.selectedSkillIds.splice(index, 1);
    } else {
      // Skill chưa được chọn -> Thêm vào mảng
      this.selectedSkillIds.push(skillId);
    }

    console.log('Selected skills:', this.selectedSkillIds);
  }

  /**
   * Kiểm tra xem skill có được chọn hay không
   */
  isSkillSelected(skillId: string): boolean {
    return this.selectedSkillIds.includes(skillId);
  }

  /**
   * Xử lý submit form
   */
  onSubmit(event: Event): void {
    event.preventDefault();

    // Validate form
    if (this.jobForm.invalid) {
      // Đánh dấu tất cả các field là touched để hiển thị lỗi
      Object.keys(this.jobForm.controls).forEach(key => {
        this.jobForm.get(key)?.markAsTouched();
      });

      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    // Chuẩn bị dữ liệu để gửi
    const formValue = this.jobForm.value;

    const jobData: CreateJobRequest = {
      title: formValue.title,
      description: formValue.description,
      salaryMin: formValue.salaryMin ? Number(formValue.salaryMin) : undefined,
      salaryMax: formValue.salaryMax ? Number(formValue.salaryMax) : undefined,
      location: formValue.location,
      employmentType: formValue.employmentType,
      deadline: formValue.deadline ? new Date(formValue.deadline).toISOString() : undefined,
      skillIds: this.selectedSkillIds
    };

    console.log('Submitting job data:', jobData);
    this.isSubmitting = true;

    // Gọi API POST
    this.jobService.createJob(jobData).subscribe({
      next: (response) => {
        console.log('Job created successfully:', response);
        alert('Đăng tin thành công! 🎉');

        // Reset form và selected skills
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating job:', error);
        const errorMessage = error.error?.message || 'Đã xảy ra lỗi khi đăng tin tuyển dụng. Vui lòng thử lại!';
        alert(`Lỗi: ${errorMessage}`);
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Reset form về trạng thái ban đầu
   */
  resetForm(): void {
    this.jobForm.reset();
    this.selectedSkillIds = [];

    // Reset về giá trị mặc định cho các select
    this.jobForm.patchValue({
      employmentType: '',
    });
  }

  /**
   * Hủy và quay lại
   */
  onCancel(): void {
    if (confirm('Bạn có chắc muốn hủy? Tất cả dữ liệu đã nhập sẽ bị mất.')) {
      this.resetForm();
    }
  }
}
