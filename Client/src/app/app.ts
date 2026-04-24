import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { LoadingInterceptorService } from './services/loading-interceptor.service';
import { PopupComponent } from './components/popup/popup.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, LoadingOverlayComponent, PopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Client');

  constructor(private loadingInterceptor: LoadingInterceptorService) {
    // LoadingInterceptorService is instantiated to handle router events
  }
}
