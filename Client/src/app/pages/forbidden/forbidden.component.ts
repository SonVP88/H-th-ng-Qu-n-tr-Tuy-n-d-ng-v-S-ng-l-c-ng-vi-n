import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-forbidden',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './forbidden.component.html',
    styleUrl: './forbidden.component.scss'
})
export class ForbiddenComponent {
    private router = inject(Router);
    private authService = inject(AuthService);

    goHome(): void {
        const user = this.authService.getCurrentUser();

        if (!user) {
            this.router.navigate(['/login']);
            return;
        }

        // Redirect based on role
        switch (user.role) {
            case 'ADMIN':
            case 'HR':
            case 'INTERVIEWER':
                this.router.navigate(['/hr/dashboard']);
                break;
            case 'CANDIDATE':
                this.router.navigate(['/candidate/home']);
                break;
            default:
                this.router.navigate(['/login']);
        }
    }
}
