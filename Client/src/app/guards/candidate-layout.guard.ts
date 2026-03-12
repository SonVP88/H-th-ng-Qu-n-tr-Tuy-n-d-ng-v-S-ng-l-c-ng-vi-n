import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

/**
 * Guard dùng cho các trang Candidate (như /home, /jobs).
 * Nếu đang login bằng Role ADMIN/HR, tự động đá về Dashboard để không kẹt Giao diện Candidate.
 */
export const candidateLayoutGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    if (authService.isAuthenticated()) {
        const role = authService.getUserRole();
        // Nếu là Admin/HR mà cố tình vào trang Candidate -> Xoá token và bắt đăng nhập lại
        if (role === 'ADMIN' || role === 'HR') {
            authService.logout(); // Hàm logout sẽ tự clear token và navigate về login
            return false;
        }
    }

    return true;
};
