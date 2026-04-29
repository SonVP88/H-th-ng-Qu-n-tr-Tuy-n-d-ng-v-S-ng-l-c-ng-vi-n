import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartItem, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-ai-score-radar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full aspect-square max-h-[300px] flex items-center justify-center">
      <canvas #radarCanvas></canvas>
    </div>
  `
})
export class AiScoreRadarComponent implements OnChanges {
  @Input() scores: { technicalSkills: number, experience: number, education: number, softSkills: number } | null = null;
  @ViewChild('radarCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private chartInstance: Chart | null = null;

  ngOnChanges(): void {
    if (this.scores && this.canvasRef) {
      this.renderChart();
    }
  }

  // Use ngAfterViewInit instead of just ngOnChanges if canvas isn't ready
  ngAfterViewInit(): void {
    if (this.scores) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (!this.scores || !this.canvasRef) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const t = (this.scores as any).TechnicalSkills ?? this.scores.technicalSkills ?? 0;
    const e = (this.scores as any).Experience ?? this.scores.experience ?? 0;
    const ed = (this.scores as any).Education ?? this.scores.education ?? 0;
    const s = (this.scores as any).SoftSkills ?? this.scores.softSkills ?? 0;

    const data = [t, e, ed, s];

    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: ['Kỹ năng', 'Kinh nghiệm', 'Học vấn', 'Kỹ năng mềm'],
        datasets: [{
          label: 'Điểm AI',
          data: data,
          backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo 500 with opacity
          borderColor: 'rgba(99, 102, 241, 1)',
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            suggestedMin: 0,
            suggestedMax: 100,
            beginAtZero: true,
            angleLines: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 'bold'
              },
              color: '#4b5563' // text-gray-600
            },
            ticks: {
              stepSize: 20,
              display: false // Hide numbers
            }
          }
        },
        plugins: {
          legend: {
            display: false // Hide legend
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.8)', // bg-gray-900
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => `Đạt: ${context.raw}/100`
            }
          }
        }
      }
    };

    this.chartInstance = new Chart(ctx as ChartItem, config);
  }
}
