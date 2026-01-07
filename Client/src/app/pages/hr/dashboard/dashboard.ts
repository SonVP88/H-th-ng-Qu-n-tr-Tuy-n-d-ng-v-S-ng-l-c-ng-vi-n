import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { JobService, JobDto } from '../../../services/job.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  latestJobs: JobDto[] = [];
  isLoadingJobs = false;
  errorMessage: string | null = null;
  private routerSubscription?: Subscription;

  constructor(
    private jobService: JobService,
    private router: Router,
    private cdr: ChangeDetectorRef // Add ChangeDetectorRef like home.ts
  ) { }

  ngOnInit(): void {
    console.log('🔄 Dashboard ngOnInit called');
    this.loadLatestJobs();

    // Subscribe to router events to reload when navigating back
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        console.log('🔄 Navigation detected:', event.url);
        if (event.url === '/hr/dashboard' || event.url === '/hr') {
          console.log('🔄 Reloading jobs...');
          this.loadLatestJobs();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadLatestJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = null;

    console.log('🔍 Calling API: /api/jobs/latest/5');
    console.log('📊 Initial state - isLoadingJobs:', this.isLoadingJobs, 'latestJobs:', this.latestJobs);

    this.jobService.getLatestJobs(5).subscribe({
      next: (jobs) => {
        console.log('✅ Response received:', jobs);
        console.log('📝 Jobs array length:', jobs?.length);
        console.log('📝 Jobs array:', Array.isArray(jobs));

        this.latestJobs = jobs;
        this.isLoadingJobs = false;
        this.cdr.detectChanges(); // CRITICAL: Manually trigger change detection

        console.log('📊 After update - isLoadingJobs:', this.isLoadingJobs, 'latestJobs.length:', this.latestJobs?.length);
      },
      error: (error) => {
        console.error('❌ API Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        this.errorMessage = `Cannot load jobs. Backend may not be running. Error: ${error.status || 'Unknown'}`;
        this.isLoadingJobs = false;
        this.cdr.detectChanges(); // CRITICAL: Manually trigger change detection
      }
    });
  }
}
