import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho JobType
export interface JobType {
    jobTypeId: string;
    name: string;
}

// Interface cho Skill
export interface Skill {
    skillId: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class MasterDataService {
    private apiUrl = '/api';

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách JobTypes từ API
     */
    getJobTypes(): Observable<JobType[]> {
        return this.http.get<JobType[]>(`${this.apiUrl}/master-data/job-types`);
    }

    /**
     * Lấy danh sách Skills từ API
     */
    getSkills(): Observable<Skill[]> {
        return this.http.get<Skill[]>(`${this.apiUrl}/master-data/skills`);
    }
}
