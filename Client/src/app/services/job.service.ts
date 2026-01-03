import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho CreateJobRequest
export interface CreateJobRequest {
    title: string;
    description?: string;
    salaryMin?: number;
    salaryMax?: number;
    location?: string;
    employmentType?: string;
    deadline?: string; // ISO date string
    skillIds: string[];
}

// Interface cho response
export interface CreateJobResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class JobService {
    private apiUrl = 'https://localhost:7181/api';

    constructor(private http: HttpClient) { }

    /**
     * Tạo job posting mới
     */
    createJob(jobData: CreateJobRequest): Observable<CreateJobResponse> {
        return this.http.post<CreateJobResponse>(`${this.apiUrl}/jobs`, jobData);
    }
}
