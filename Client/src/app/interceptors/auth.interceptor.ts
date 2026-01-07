import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Tránh truy cập `localStorage` khi chạy trên server (SSR) -> ReferenceError
    let token: string | null = null;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        token = window.localStorage.getItem('authToken');
    }

    // Nếu có token, thêm vào header Authorization
    if (token) {
        console.log('🔑 AuthInterceptor: Attaching token', token.substring(0, 10) + '...');
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    } else {
        console.warn('⚠️ AuthInterceptor: No token found in localStorage');
    }

    // Nếu không có token, gửi request bình thường
    return next(req);
};
