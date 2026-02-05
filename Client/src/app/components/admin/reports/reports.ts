import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { ReportService, ReportDashboardDto, ReportChartsDto } from '../../../services/report.service';

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
  selectedYear = new Date().getFullYear(); // Năm hiện tại
  years: number[] = [];

  constructor(private reportService: ReportService) {
    // Generate years từ 2024 đến năm hiện tại
    const currentYear = new Date().getFullYear();
    for (let year = 2024; year <= currentYear; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.loadReports();
  }

  /**
   * Handle year selection change
   */
  onYearChange(event: any): void {
    this.selectedYear = parseInt(event.target.value);
    this.loadReports();
  }

  /**
   * Refresh reports data
   */
  refreshReports(): void {
    this.loadReports();
  }

  /**
   * Export reports to Excel (CSV format)
   */
  exportToExcel(): void {
    const csvData = this.generateCSV();
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Tuyen_Dung_${this.selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate CSV content from report data
   */
  private generateCSV(): string {
    let csv = 'Báo Cáo Tuyển Dụng ' + this.selectedYear + '\n\n';

    // Summary section
    csv += 'Tổng Quan\n';
    csv += 'Chỉ số,Giá trị\n';
    csv += `Tổng ứng viên,${this.summary.totalCandidates}\n`;
    csv += `Đã tuyển,${this.summary.hiredCount}\n`;
    csv += `Vị trí đang mở,${this.summary.openJobsCount}\n`;
    csv += `Tỷ lệ tuyển dụng,${this.summary.conversionRate}%\n\n`;

    // Funnel data
    csv += 'Phễu Tuyển Dụng\n';
    csv += 'Giai đoạn,Số lượng\n';
    this.funnelChartData.labels?.forEach((label, i) => {
      csv += `${label},${this.funnelChartData.datasets[0].data[i]}\n`;
    });
    csv += '\n';

    // Source data
    csv += 'Nguồn Ứng Viên\n';
    csv += 'Nguồn,Số lượng\n';
    this.sourceChartData.labels?.forEach((label, i) => {
      csv += `${label},${this.sourceChartData.datasets[0].data[i]}\n`;
    });
    csv += '\n';

    // Trend data
    csv += 'Xu Hướng Theo Tháng\n';
    csv += 'Tháng,Số ứng tuyển\n';
    this.trendChartData.labels?.forEach((label, i) => {
      csv += `${label},${this.trendChartData.datasets[0].data[i]}\n`;
    });

    return csv;
  }

  /**
   * Load all report data from API
   */
  loadReports(): void {
    this.isLoading = true;

    // Load both summary and charts in parallel with year filter
    const summary$ = this.reportService.getSummary(this.selectedYear);
    const charts$ = this.reportService.getCharts(this.selectedYear);

    // Wait for both to complete
    summary$.subscribe({
      next: (data) => {
        this.summary = data;
        console.log('📊 Summary loaded:', data);
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('❌ Error loading summary:', err);
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });

    charts$.subscribe({
      next: (data) => {
        this.updateCharts(data);
        console.log('📈 Charts loaded:', data);
        this.isLoading = false; // Set to false after charts load
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('❌ Error loading charts:', err);
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  /**
   * Update chart data from API response
   */
  private updateCharts(data: ReportChartsDto): void {
    console.log('🔍 updateCharts called with:', data);

    try {
      // Update Funnel Chart
      if (data?.funnelData?.labels && data?.funnelData?.data) {
        this.funnelChartData.labels = data.funnelData.labels;
        this.funnelChartData.datasets[0].data = data.funnelData.data;
        console.log('✅ Funnel chart updated');
      } else {
        console.warn('⚠️ Funnel data is incomplete:', data?.funnelData);
      }

      // Update Source Chart
      if (data?.sourceData?.labels && data?.sourceData?.data) {
        this.sourceChartData.labels = data.sourceData.labels;
        this.sourceChartData.datasets[0].data = data.sourceData.data;
        console.log('✅ Source chart updated');
      } else {
        console.warn('⚠️ Source data is incomplete:', data?.sourceData);
      }

      // Update Trend Chart
      if (data?.trendData?.labels && data?.trendData?.data) {
        this.trendChartData.labels = data.trendData.labels;
        this.trendChartData.datasets[0].data = data.trendData.data;
        console.log('✅ Trend chart updated');
      } else {
        console.warn('⚠️ Trend data is incomplete:', data?.trendData);
      }
    } catch (error) {
      console.error('❌ Error updating charts:', error);
    }
  }
}
