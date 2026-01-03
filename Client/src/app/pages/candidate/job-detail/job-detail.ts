import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Interface khớp với Backend JobDetailDto
export interface JobDetailDto {
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
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  contactEmail: string | null;
  numberOfPositions: number | null;
}

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
})
export class JobDetail implements OnInit {
  job: JobDetailDto | null = null;
  loading = true;
  error: string | null = null;

  private apiUrl = 'https://localhost:7181/api'; // HTTPS backend

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Lấy ID từ URL params
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'Invalid job ID';
      this.loading = false;
      return;
    }

    this.loadJobDetail(id);
  }

  /**
   * Gọi API lấy chi tiết job
   */
  loadJobDetail(id: string): void {
    this.loading = true;
    this.error = null;

    this.http.get<JobDetailDto>(`${this.apiUrl}/jobs/${id}`)
      .subscribe({
        next: (job) => {
          this.job = job;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loaded job detail:', job);
        },
        error: (err) => {
          console.error('Error loading job:', err);
          if (err.status === 404) {
            this.error = 'Job not found';
          } else {
            this.error = 'Failed to load job details';
          }
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Format salary range
   */
  formatSalary(min: number | null, max: number | null): string {
    if (!min && !max) return 'Negotiable';

    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(0)}M VNĐ`;
      }
      return `${num.toLocaleString('vi-VN')} VNĐ`;
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)}`;
    } else if (min) {
      return `From ${formatNumber(min)}`;
    } else if (max) {
      return `Up to ${formatNumber(max)}`;
    }

    return 'Negotiable';
  }

  /**
   * Format date
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Calculate days ago
   */
  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['/candidate/home']);
  }
}
