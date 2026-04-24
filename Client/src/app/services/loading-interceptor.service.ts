import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { LoadingService } from '../services/loading.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingInterceptorService {
  constructor(
    private router: Router,
    private loadingService: LoadingService
  ) {
    this.initRouterEvents();
  }

  private initRouterEvents(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Show loading when navigation starts
        this.loadingService.show();
      } else if (event instanceof NavigationEnd || event instanceof NavigationError) {
        // Hide loading after 1 second when navigation ends (faster)
        setTimeout(() => {
          this.loadingService.hide();
        }, 1000);
      }
    });
  }
}

