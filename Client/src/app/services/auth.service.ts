import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private router: Router) { }

    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem('authToken');
        return !!token;
    }

    getCurrentUser(): any {
        if (typeof window === 'undefined') return null;

        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const decoded: any = jwtDecode(token);
            return {
                userId: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded['sub'],
                email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded['email'],
                name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded['name'],
                role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role']
            };
        } catch (error) {
            console.error('Lỗi decode token:', error);
            return null;
        }
    }

    getUserRole(): string | null {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    logout(): void {
        if (typeof window !== 'undefined') {
            console.log('🚪 Đăng xuất - Xóa token khỏi localStorage');
            localStorage.removeItem('authToken');

            const remainingToken = localStorage.getItem('authToken');
            if (remainingToken) {
                console.error('❌ Cảnh báo: Token vẫn còn trong localStorage!');
            } else {
                console.log('✅ Token đã được xóa thành công');
            }
        }

        this.router.navigate(['/login']);
    }

    saveToken(token: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
            localStorage.setItem('authToken', token);
            const saved = localStorage.getItem('authToken');
            return saved === token;
        } catch (error) {
            console.error('Lỗi lưu token:', error);
            return false;
        }
    }
}
