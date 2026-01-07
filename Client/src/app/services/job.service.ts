import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho CreateJobRequest
export interface CreateJobRequest {
    title: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    numberOfPositions?: number;
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

// Interface cho Job DTO (matches backend camelCase response)
export interface JobDto {
    jobId: string;
    title: string;
    companyName?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: string;
    deadline?: string;
    createdDate: string;
    skills?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class JobService {
    private apiUrl = '/api';

    constructor(private http: HttpClient) { }

    /**
     * Tạo job posting mới
     */
    createJob(jobData: CreateJobRequest): Observable<CreateJobResponse> {
        return this.http.post<CreateJobResponse>(`${this.apiUrl}/jobs`, jobData);
    }

    /**
     * Lấy danh sách jobs mới nhất
     */
    getLatestJobs(count: number = 10): Observable<JobDto[]> {
        return this.http.get<JobDto[]>(`${this.apiUrl}/jobs/latest/${count}`);
    }
}
