import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportDashboardDto {
    totalCandidates: number;
    hiredCount: number;
    openJobsCount: number;
    conversionRate: number;
}

export interface ChartDataDto {
    labels: string[];
    data: number[];
}

export interface ReportChartsDto {
    funnelData: ChartDataDto;
    sourceData: ChartDataDto;
    trendData: ChartDataDto;
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = '/api/reports';

    constructor(private http: HttpClient) { }

    /**
     * Get summary statistics for dashboard
     */
    getSummary(year?: number): Observable<ReportDashboardDto> {
        if (year) {
            return this.http.get<ReportDashboardDto>(`${this.apiUrl}/summary`, { params: { year: year.toString() } });
        }
        return this.http.get<ReportDashboardDto>(`${this.apiUrl}/summary`);
    }

    /**
     * Get chart data for funnel, sources, and trends
     */
    getCharts(year?: number): Observable<ReportChartsDto> {
        if (year) {
            return this.http.get<ReportChartsDto>(`${this.apiUrl}/charts`, { params: { year: year.toString() } });
        }
        return this.http.get<ReportChartsDto>(`${this.apiUrl}/charts`);
    }
}
