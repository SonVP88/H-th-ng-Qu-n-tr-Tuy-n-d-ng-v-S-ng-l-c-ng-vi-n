import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';
import { JobService } from '../../../services/job.service';

export interface QuestionBankItem {
  bankQuestionId: string;
  content: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
  tags: string;
  tagList?: string[];
  createdAt: string;
}

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank.html',
  styleUrl: './question-bank.scss'
})
export class QuestionBankComponent implements OnInit {
  questions: QuestionBankItem[] = [];
  jobs: any[] = [];

  // Generate form
  selectedJobId = '';
  selectedLevel = 'Middle';
  selectedType = 'Kỹ thuật';
  selectedCount = 10;
  isGenerating = false;
  showGeneratePanel = false;
  generatedQuestions: any[] = [];

  // Filter
  searchText = '';
  filterDifficulty = '';
  filterJobTitle = '';
  isLoading = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  readonly levels = ['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead'];
  readonly types = ['Kỹ thuật', 'Tình huống', 'Hành vi'];
  readonly counts = [5, 10, 15, 20];

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.loadJobs();
  }

  loadJobs(): void {
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => this.jobs = jobs.filter(j => j.status === 'OPEN' || j.status === 'DRAFT'),
      error: () => {}
    });
  }

  loadQuestions(): void {
    this.isLoading = true;
    let url = `/api/interviews/question-bank?page=${this.currentPage}&pageSize=${this.pageSize}&`;
    if (this.searchText) url += `search=${encodeURIComponent(this.searchText)}&`;
    if (this.filterDifficulty) url += `difficulty=${this.filterDifficulty}&`;
    if (this.filterJobTitle) url += `tags=${encodeURIComponent(this.filterJobTitle)}&`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.questions = res.data.map((q: any) => ({
          ...q,
          tagList: q.tags ? q.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
        }));
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadQuestions();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadQuestions();
    }
  }

  onAiGenerate(): void {
    if (!this.selectedJobId) {
      this.toast.warning('Thiếu thông tin', 'Vui lòng chọn Job để lấy mô tả tự động.');
      return;
    }
    this.isGenerating = true;
    this.generatedQuestions = [];

    const payload = {
      jobId: this.selectedJobId,
      level: this.selectedLevel,
      questionType: this.selectedType,
      count: this.selectedCount
    };

    this.http.post<any>('/api/interviews/ai-generate-questions', payload).subscribe({
      next: (res) => {
        this.generatedQuestions = (res.questions || []).map((q: any) => ({
          ...q,
          tagList: q.tags ? q.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
        }));
        this.toast.success('AI sinh câu hỏi thành công!', res.message);
        this.isGenerating = false;
        this.loadQuestions(); // Refresh list
      },
      error: (err) => {
        const msg = err?.error?.message || 'Lỗi kết nối AI.';
        this.toast.error('Thất bại', msg);
        this.isGenerating = false;
      }
    });
  }

  getDifficultyClass(difficulty: string): string {
    const map: Record<string, string> = {
      'Easy': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      'Hard': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return map[difficulty] || 'bg-gray-100 text-gray-600';
  }

  getDifficultyLabel(d: string): string {
    return d === 'Easy' ? 'Dễ' : d === 'Medium' ? 'Trung bình' : 'Khó';
  }
}
