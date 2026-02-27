import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvaluationSubmitDto {
    interviewId: string;
    interviewerId: string;
    submittedById?: string;
    score: number;
    comment: string;
    result: 'Passed' | 'Failed' | 'Consider';
    details: string; 
    submittedByName?: string;
    isBelated?: boolean;
}

export interface EvaluationDetail {
    criterion: string;
    score: number;
    maxScore: number;
}

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {
    private apiUrl = '/api/evaluation';

    constructor(private http: HttpClient) { }

    submitEvaluation(dto: EvaluationSubmitDto): Observable<ApiResponse> {
        const token = localStorage.getItem('authToken');
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post<ApiResponse>(
            `${this.apiUrl}/submit`,
            dto,
            { headers }
        );
    }

    getEvaluation(interviewId: string): Observable<ApiResponse<EvaluationSubmitDto>> {
        const token = localStorage.getItem('authToken');
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.get<ApiResponse<EvaluationSubmitDto>>(
            `${this.apiUrl}/${interviewId}`,
            { headers }
        );
    }
}
