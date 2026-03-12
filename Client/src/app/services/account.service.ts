import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileDto {
    userId: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    avatarUrl: string;
}

export interface UpdateProfileDto {
    fullName: string;
    phone: string;
    avatarUrl: string;
}

export interface CompanyInfoDto {
    name: string;
    website: string;
    industry: string;
    address: string;
    description: string;
    logoUrl: string;
}

export interface UpdateCompanyDto {
    name: string;
    website: string;
    industry: string;
    address: string;
    description: string;
    logoUrl: string;
}

export interface NotificationSettingDto {
    notifyJobOpportunities: boolean;
    notifyApplicationUpdates: boolean;
    notifySecurityAlerts: boolean;
    notifyMarketing: boolean;
    channelEmail: boolean;
    channelPush: boolean;
}

export interface CandidateDto {
    userId: string;
    email: string;
    fullName: string;
    phone: string;
    avatarUrl: string;
    isActive: boolean;
    authProvider: string;
    createdAt: string;
    lockedAt?: string;
    lockedByName?: string;
    lockReason?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private apiUrl = `${environment.apiUrl}/account`;
    private notifUrl = `${environment.apiUrl}/notification-settings`;

    constructor(private http: HttpClient) { }

    getProfile(): Observable<UserProfileDto> {
        return this.http.get<UserProfileDto>(`${this.apiUrl}/profile`);
    }

    updateProfile(data: UpdateProfileDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, data);
    }

    getCompanyInfo(): Observable<CompanyInfoDto> {
        return this.http.get<CompanyInfoDto>(`${this.apiUrl}/company`);
    }

    updateCompanyInfo(data: UpdateCompanyDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/company`, data);
    }

    getNotificationSettings(): Observable<NotificationSettingDto> {
        return this.http.get<NotificationSettingDto>(this.notifUrl);
    }

    updateNotificationSettings(data: NotificationSettingDto): Observable<any> {
        return this.http.put(this.notifUrl, data);
    }

    getCandidates(searchTerm: string = '', pageConfig: number = 1, pageSize: number = 10): Observable<{ data: CandidateDto[], total: number, page: number, pageSize: number }> {
        return this.http.get<{ data: CandidateDto[], total: number, page: number, pageSize: number }>(
            `${this.apiUrl}/candidates?searchTerm=${searchTerm}&pageConfig=${pageConfig}&pageSize=${pageSize}`
        );
    }

    toggleCandidateStatus(id: string, reason: string = ''): Observable<{ message: string, isActive: boolean }> {
        return this.http.put<{ message: string, isActive: boolean }>(`${this.apiUrl}/candidates/${id}/toggle-status`, { reason });
    }
}
