import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No role restriction
    }

    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
    }

    // Get current user
    const currentUser = authService.getCurrentUser();

    if (!currentUser || !currentUser.role) {
        router.navigate(['/login']);
        return false;
    }

    // Check if user has required role
    const hasRequiredRole = requiredRoles.includes(currentUser.role);

    if (!hasRequiredRole) {
        console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}, User role: ${currentUser.role}`);
        router.navigate(['/403']);
        return false;
    }

    return true;
};
