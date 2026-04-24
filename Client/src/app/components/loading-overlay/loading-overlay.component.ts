import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="(loading$ | async)" class="fixed top-0 left-0 w-full h-1 z-50">
      <!-- Top progress bar with gradient animation -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary via-blue-400 to-cyan-400 opacity-90 animate-pulse"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-primary to-blue-400 w-full h-full animate-[slide_2s_ease-in-out_infinite]" style="animation: slide 1s ease-in-out infinite;"></div>
    </div>

    <style>
      @keyframes slide {
        0% {
          clip-path: polygon(0% 0%, 0% 100%, 20% 100%, 20% 0%);
        }
        50% {
          clip-path: polygon(0% 0%, 0% 100%, 80% 100%, 80% 0%);
        }
        100% {
          clip-path: polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%);
        }
      }
    </style>
  `
})
export class LoadingOverlayComponent {
  loading$: any;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}
