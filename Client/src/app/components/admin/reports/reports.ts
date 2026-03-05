import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { ReportService, ReportDashboardDto, ReportChartsDto } from '../../../services/report.service';
import { saveAs } from 'file-saver';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {

  // ==================== SUMMARY DATA ====================
  summary: ReportDashboardDto = {
    totalCandidates: 0,
    hiredCount: 0,
    openJobsCount: 0,
    conversionRate: 0
  };

  isLoading = true;

  // ==================== FUNNEL CHART (BAR) ====================
  public funnelChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Số lượng ứng viên',
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  public funnelChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Phễu Tuyển Dụng',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  public funnelChartType = 'bar' as const;

  // ==================== SOURCE CHART (PIE) ====================
  public sourceChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  public sourceChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: {
        display: true,
        text: 'Nguồn Ứng Viên',
        font: { size: 16, weight: 'bold' }
      }
    }
  };

  public sourceChartType = 'pie' as const;

  // ==================== TREND CHART (LINE) ====================
  public trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Số ứng tuyển',
        fill: true,
        tension: 0.4,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  public trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Xu Hướng Ứng Tuyển 2026',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  public trendChartType = 'line' as const;

  private cdr = inject(ChangeDetectorRef);
  selectedYear = new Date().getFullYear();
  years: number[] = [];

  constructor(private reportService: ReportService) {
    const currentYear = new Date().getFullYear();
    for (let year = 2024; year <= currentYear; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.loadReports();
  }

  onYearChange(event: any): void {
    this.selectedYear = parseInt(event.target.value);
    this.loadReports();
  }

  refreshReports(): void {
    this.loadReports();
  }

  /**
   * Xuất Excel từ backend API - có native BarChart, PieChart, LineChart thật
   */
  exportToExcel(): void {
    this.reportService.exportExcel(this.selectedYear).subscribe({
      next: (blob) => {
        saveAs(blob, `Bao_Cao_Tuyen_Dung_${this.selectedYear}.xlsx`);
      },
      error: (err) => {
        console.error('Lỗi xuất Excel:', err);
        alert('Không thể xuất Excel. Vui lòng thử lại sau.');
      }
    });
  }

  /**
   * Load all report data from API
   */
  loadReports(): void {
    this.isLoading = true;

    const summary$ = this.reportService.getSummary(this.selectedYear);
    const charts$ = this.reportService.getCharts(this.selectedYear);

    summary$.subscribe({
      next: (data) => {
        this.summary = data;
        console.log('📊 Summary loaded:', data);
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('Error loading summary:', err);
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });

    charts$.subscribe({
      next: (data) => {
        this.updateCharts(data);
        console.log('📈 Charts loaded:', data);
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('Error loading charts:', err);
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  /**
   * Update chart data from API response
   */
  private updateCharts(data: ReportChartsDto): void {
    try {
      if (data?.funnelData?.labels && data?.funnelData?.data) {
        this.funnelChartData.labels = data.funnelData.labels;
        this.funnelChartData.datasets[0].data = data.funnelData.data;
      }
      if (data?.sourceData?.labels && data?.sourceData?.data) {
        this.sourceChartData.labels = data.sourceData.labels;
        this.sourceChartData.datasets[0].data = data.sourceData.data;
      }
      if (data?.trendData?.labels && data?.trendData?.data) {
        this.trendChartData.labels = data.trendData.labels;
        this.trendChartData.datasets[0].data = data.trendData.data;
      }
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }
}
